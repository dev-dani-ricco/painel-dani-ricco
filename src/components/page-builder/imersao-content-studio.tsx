"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, ExternalLink,
  FileImage, GripVertical, ImagePlus, LayoutPanelTop, Loader2, Monitor,
  Plus, Save, Smartphone, Tablet, Trash2, Upload, WandSparkles,
} from "lucide-react"
import { toast } from "sonner"
import {
  cloneImmersaoContent,
  createDefaultImmersaoContent,
  createManagedMedia,
  type ImmersaoBreakpoint,
  type ImmersaoContentDocument,
  type ManagedMedia,
} from "@/lib/imersao-content"
import { cn } from "@/lib/utils"

type SectionKey = "hero" | "carousel" | "about" | "event" | "included" | "offers" | "faq"

const SECTIONS: Array<{ key: SectionKey; label: string; hint: string }> = [
  { key: "hero", label: "Hero", hint: "Foto principal, headline e CTA" },
  { key: "carousel", label: "Última experiência", hint: "Fotos rolando no carrossel" },
  { key: "about", label: "Sobre Dani", hint: "Foto da especialista" },
  { key: "event", label: "Data e cidade", hint: "Informações principais do evento" },
  { key: "included", label: "O que está incluso", hint: "Entregáveis da experiência" },
  { key: "offers", label: "Setores / ingressos", hint: "Pérola, Ouro e Prata" },
  { key: "faq", label: "Dúvidas frequentes", hint: "Perguntas e respostas" },
]

const DEVICE_META: Record<ImmersaoBreakpoint, { label: string; icon: typeof Monitor }> = {
  desktop: { label: "Desktop", icon: Monitor },
  tablet: { label: "Tablet", icon: Tablet },
  mobile: { label: "Mobile", icon: Smartphone },
}

const inputClass =
  "h-10 w-full rounded-xl border border-white/10 bg-white/[.035] px-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-[#E85002]/55"
const textareaClass =
  "min-h-24 w-full resize-y rounded-xl border border-white/10 bg-white/[.035] p-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-700 focus:border-[#E85002]/55"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

async function compressImage(file: File) {
  const source = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image()
      element.onload = () => resolve(element)
      element.onerror = reject
      element.src = source
    })

    const maxSide = 2200
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Não foi possível preparar a imagem.")
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error("Não foi possível otimizar a imagem."))),
        "image/webp",
        0.88,
      )
    })
    return new File([blob], file.name.replace(/.[^.]+$/, "") + ".webp", { type: "image/webp" })
  } finally {
    URL.revokeObjectURL(source)
  }
}

async function uploadImage(file: File) {
  const optimized = await compressImage(file)
  const form = new FormData()
  form.set("file", optimized)
  const response = await fetch("/api/imersao-content/assets", { method: "POST", body: form })
  const payload = await response.json().catch(() => ({})) as { url?: string; error?: string }
  if (!response.ok || !payload.url) throw new Error(payload.error || "Não foi possível enviar a imagem.")
  return payload.url
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.12em] text-zinc-500">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[11px] leading-5 text-zinc-700">{hint}</span> : null}
    </label>
  )
}

function ImageCanvas({
  title,
  location,
  media,
  onChange,
  aspect = "16 / 9",
}: {
  title: string
  location: string
  media: ManagedMedia | null
  onChange: (media: ManagedMedia | null) => void
  aspect?: string
}) {
  const [device, setDevice] = React.useState<ImmersaoBreakpoint>("desktop")
  const [uploading, setUploading] = React.useState(false)
  const dragRef = React.useRef<{ x: number; y: number; startX: number; startY: number; width: number; height: number } | null>(null)
  const transform = media?.transform[device] ?? { x: 0, y: 0, zoom: 1 }

  const updateTransform = React.useCallback((patch: Partial<typeof transform>) => {
    if (!media) return
    const next = JSON.parse(JSON.stringify(media)) as ManagedMedia
    next.transform[device] = { ...next.transform[device], ...patch }
    onChange(next)
  }, [device, media, onChange])

  async function chooseFile(file?: File) {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      const base = media ? JSON.parse(JSON.stringify(media)) as ManagedMedia : createManagedMedia(title)
      const next: ManagedMedia = {
        ...base,
        src: url,
        name: title,
        alt: base.alt || title,
      }
      onChange(next)
      toast.success("Imagem salva na biblioteca.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a imagem.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="rounded-[22px] border border-white/10 bg-[#0b0b0b] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-[11px] text-zinc-600">Aparece em: {location}</p>
        </div>
        <div className="flex rounded-lg border border-white/10 bg-black p-1">
          {(Object.keys(DEVICE_META) as ImmersaoBreakpoint[]).map((key) => {
            const Icon = DEVICE_META[key].icon
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDevice(key)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[10px] transition",
                  device === key ? "bg-white text-black" : "text-zinc-600 hover:text-white",
                )}
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{DEVICE_META[key].label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div
        className="relative isolate mx-auto w-full max-w-3xl overflow-hidden rounded-[18px] border border-white/10 bg-black"
        style={{ aspectRatio: aspect }}
        onPointerDown={(event) => {
          if (!media?.src) return
          const rect = event.currentTarget.getBoundingClientRect()
          dragRef.current = {
            x: event.clientX,
            y: event.clientY,
            startX: transform.x,
            startY: transform.y,
            width: rect.width,
            height: rect.height,
          }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current
          if (!drag || !media?.src) return
          const dx = ((event.clientX - drag.x) / drag.width) * 100
          const dy = ((event.clientY - drag.y) / drag.height) * 100
          updateTransform({
            x: clamp(drag.startX + dx, -55, 55),
            y: clamp(drag.startY + dy, -55, 55),
          })
        }}
        onPointerUp={(event) => {
          dragRef.current = null
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        onPointerCancel={() => { dragRef.current = null }}
      >
        {media?.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.src}
            alt={media.alt}
            draggable={false}
            className="pointer-events-none absolute left-1/2 top-1/2 size-full select-none object-cover"
            style={{
              transform: `translate(calc(-50% + ${transform.x}%), calc(-50% + ${transform.y}%)) scale(${transform.zoom})`,
              transformOrigin: "center",
            }}
          />
        ) : (
          <div className="grid size-full place-items-center text-center">
            <div>
              <FileImage className="mx-auto size-7 text-[#E85002]" />
              <p className="mt-3 text-xs text-zinc-500">Nenhuma imagem publicada neste espaço.</p>
              <p className="mt-1 text-[10px] text-zinc-700">Faça upload e arraste para enquadrar.</p>
            </div>
          </div>
        )}
        {media?.src ? (
          <div className="pointer-events-none absolute inset-0 border border-white/5">
            <div className="absolute left-1/2 top-0 h-full w-px bg-white/10" />
            <div className="absolute left-0 top-1/2 h-px w-full bg-white/10" />
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px] lg:items-end">
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#E85002] px-4 text-[11px] font-semibold text-white transition hover:bg-[#ff6413]">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {media?.src ? "Trocar imagem" : "Adicionar imagem"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              disabled={uploading}
              onChange={(event) => {
                void chooseFile(event.target.files?.[0])
                event.currentTarget.value = ""
              }}
            />
          </label>
          {media?.src ? (
            <>
              <button
                type="button"
                onClick={() => updateTransform({ x: 0, y: 0, zoom: 1 })}
                className="h-10 rounded-xl border border-white/10 px-4 text-[11px] font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                Centralizar
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="h-10 rounded-xl border border-red-500/20 px-4 text-[11px] font-medium text-red-400 transition hover:bg-red-500/10"
              >
                Remover
              </button>
            </>
          ) : null}
        </div>

        <Field label="Zoom">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="2.4"
              step="0.01"
              value={transform.zoom}
              disabled={!media?.src}
              onChange={(event) => updateTransform({ zoom: Number(event.target.value) })}
              className="w-full accent-[#E85002]"
            />
            <span className="w-12 text-right text-xs text-zinc-500">{transform.zoom.toFixed(2)}x</span>
          </div>
        </Field>
      </div>
    </section>
  )
}

function SectionHeader({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="mb-6 border-b border-white/8 pb-5">
      <h2 className="font-[var(--font-playfair)] text-3xl font-medium tracking-[-.035em] text-white sm:text-4xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{copy}</p>
    </div>
  )
}

export function ImmersaoContentStudio() {
  const [doc, setDoc] = React.useState<ImmersaoContentDocument>(() => createDefaultImmersaoContent())
  const [section, setSection] = React.useState<SectionKey>("hero")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [dirty, setDirty] = React.useState(false)
  const [publishedAt, setPublishedAt] = React.useState<string | null>(null)
  const [carouselIndex, setCarouselIndex] = React.useState(0)
  const [offerIndex, setOfferIndex] = React.useState(0)

  React.useEffect(() => {
    fetch("/api/imersao-content", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao carregar conteúdo.")
        return response.json()
      })
      .then((payload) => {
        setDoc(payload.draft || createDefaultImmersaoContent())
        setPublishedAt(payload.publishedAt || null)
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Falha ao carregar conteúdo."))
      .finally(() => setLoading(false))
  }, [])

  const mutate = React.useCallback((updater: (next: ImmersaoContentDocument) => void) => {
    setDoc((current) => {
      const next = cloneImmersaoContent(current)
      updater(next)
      return next
    })
    setDirty(true)
  }, [])

  async function save(action: "save" | "publish") {
    setSaving(true)
    try {
      const response = await fetch("/api/imersao-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: doc, action }),
      })
      const payload = await response.json().catch(() => ({})) as { error?: string; published_at?: string }
      if (!response.ok) throw new Error(payload.error || "Não foi possível salvar.")
      setDirty(false)
      if (action === "publish") {
        setPublishedAt(payload.published_at || new Date().toISOString())
        toast.success("Conteúdo publicado no site oficial.")
      } else {
        toast.success("Rascunho salvo.")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="grid min-h-[70vh] place-items-center text-sm text-zinc-600"><Loader2 className="mr-2 inline size-4 animate-spin" />Carregando conteúdo da Imersão…</div>
  }

  const selectedCarousel = doc.carousel[carouselIndex] || null
  const selectedOffer = doc.offers[offerIndex]

  return (
    <div className="-mx-4 -mt-5 min-h-[calc(100vh-92px)] bg-[#080808] sm:-mx-6 lg:-mx-10">
      <header className="sticky top-[72px] z-30 border-b border-white/8 bg-[#0b0b0b]/95 backdrop-blur-xl">
        <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-2 lg:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.14em] text-zinc-700">
              <span>Page Studio</span><ChevronRight className="size-3" /><span>Imersão</span><ChevronRight className="size-3" /><span className="text-zinc-400">Conteúdo</span>
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-white">Posicionamento IMPAR® — Gestão de Conteúdo</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={cn("hidden text-[10px] md:inline", dirty ? "text-amber-400" : "text-zinc-700")}>{dirty ? "Alterações não salvas" : "Salvo"}</span>
            <Link
              href="/editor-paginas"
              className="hidden h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-[11px] font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white sm:inline-flex"
            >
              <LayoutPanelTop className="size-4" /> Layout
            </Link>
            <a
              href="https://daniricco.com.br/imersao"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-[11px] font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white sm:inline-flex"
            >
              <ExternalLink className="size-4" /> Ver site
            </a>
            <button
              type="button"
              onClick={() => void save("save")}
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-[11px] font-medium text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              <Save className="size-4" /> Salvar
            </button>
            <button
              type="button"
              onClick={() => void save("publish")}
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#E85002] px-4 text-[11px] font-semibold text-white transition hover:bg-[#ff6413] disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
              Atualizar site
            </button>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-136px)] xl:grid-cols-[260px_1fr]">
        <aside className="border-r border-white/8 bg-[#0a0a0a] p-3 xl:sticky xl:top-[136px] xl:h-[calc(100vh-136px)] xl:overflow-y-auto">
          <div className="mb-3 rounded-xl border border-white/8 bg-white/[.025] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-600">Publicação</p>
            <p className="mt-2 text-xs text-zinc-400">{publishedAt ? "Site sincronizado" : "Ainda não publicado por este editor"}</p>
            {publishedAt ? <p className="mt-1 text-[10px] text-zinc-700">{new Date(publishedAt).toLocaleString("pt-BR")}</p> : null}
          </div>
          <nav className="space-y-1">
            {SECTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSection(item.key)}
                className={cn(
                  "w-full rounded-xl px-3 py-3 text-left transition",
                  section === item.key ? "bg-[#E85002]/12 text-white ring-1 ring-[#E85002]/25" : "text-zinc-500 hover:bg-white/[.035] hover:text-zinc-200",
                )}
              >
                <span className="block text-xs font-semibold">{item.label}</span>
                <span className="mt-1 block text-[10px] leading-4 text-zinc-700">{item.hint}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {section === "hero" ? (
              <>
                <SectionHeader title="Hero" copy="Você está editando a primeira dobra da landing. A imagem pode ser arrastada e enquadrada separadamente no desktop, tablet e mobile." />
                <ImageCanvas
                  title="Foto principal"
                  location="Topo da página / hero"
                  media={doc.hero.image}
                  onChange={(media) => mutate((next) => { next.hero.image = media })}
                  aspect="16 / 7"
                />
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="Headline">
                    <textarea className={textareaClass} value={doc.hero.title} onChange={(event) => mutate((next) => { next.hero.title = event.target.value })} />
                  </Field>
                  <Field label="Texto de apoio">
                    <textarea className={textareaClass} value={doc.hero.copy} onChange={(event) => mutate((next) => { next.hero.copy = event.target.value })} />
                  </Field>
                  <Field label="Texto do botão">
                    <input className={inputClass} value={doc.hero.cta} onChange={(event) => mutate((next) => { next.hero.cta = event.target.value })} />
                  </Field>
                  <Field label="Aviso de vagas">
                    <input className={inputClass} value={doc.event.spotsLabel} onChange={(event) => mutate((next) => { next.event.spotsLabel = event.target.value })} />
                  </Field>
                </div>
              </>
            ) : null}

            {section === "carousel" ? (
              <>
                <SectionHeader title="Última experiência" copy="Cada foto é um item do carrossel. No site ele continua rolando sozinho e também pode ser arrastado com o dedo ou mouse." />
                <div className="mb-5 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {doc.carousel.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCarouselIndex(index)}
                      className={cn(
                        "relative h-24 w-36 shrink-0 overflow-hidden rounded-xl border bg-black",
                        carouselIndex === index ? "border-[#E85002]" : "border-white/10",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.src} alt={item.alt} className="size-full object-cover" />
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-1 text-[9px] text-white">{String(index + 1).padStart(2, "0")}</span>
                    </button>
                  ))}
                  <label className="grid h-24 w-36 shrink-0 cursor-pointer place-items-center rounded-xl border border-dashed border-white/15 bg-white/[.02] text-center text-[10px] text-zinc-600 transition hover:border-[#E85002]/50 hover:text-white">
                    <span><ImagePlus className="mx-auto mb-2 size-5 text-[#E85002]" />Adicionar foto</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        void (async () => {
                          try {
                            const url = await uploadImage(file)
                            mutate((next) => {
                              next.carousel.push(createManagedMedia(`Foto carrossel ${next.carousel.length + 1}`, url, "Foto da experiência Posicionamento IMPAR®"))
                            })
                            setCarouselIndex(doc.carousel.length)
                            toast.success("Foto adicionada ao carrossel.")
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Não foi possível enviar.")
                          }
                        })()
                        event.currentTarget.value = ""
                      }}
                    />
                  </label>
                </div>

                {selectedCarousel ? (
                  <>
                    <ImageCanvas
                      title={selectedCarousel.name}
                      location={`Carrossel da última experiência · posição ${carouselIndex + 1}`}
                      media={selectedCarousel}
                      onChange={(media) => {
                        if (!media) return
                        mutate((next) => { next.carousel[carouselIndex] = media })
                      }}
                      aspect="4 / 3"
                    />
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={carouselIndex === 0}
                        onClick={() => {
                          mutate((next) => {
                            const [item] = next.carousel.splice(carouselIndex, 1)
                            next.carousel.splice(carouselIndex - 1, 0, item)
                          })
                          setCarouselIndex((value) => Math.max(0, value - 1))
                        }}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-[11px] text-zinc-400 disabled:opacity-30"
                      >
                        <ArrowLeft className="size-4" /> Mover para esquerda
                      </button>
                      <button
                        type="button"
                        disabled={carouselIndex >= doc.carousel.length - 1}
                        onClick={() => {
                          mutate((next) => {
                            const [item] = next.carousel.splice(carouselIndex, 1)
                            next.carousel.splice(carouselIndex + 1, 0, item)
                          })
                          setCarouselIndex((value) => Math.min(doc.carousel.length - 1, value + 1))
                        }}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-[11px] text-zinc-400 disabled:opacity-30"
                      >
                        Mover para direita <ArrowRight className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          mutate((next) => { next.carousel.splice(carouselIndex, 1) })
                          setCarouselIndex((value) => Math.max(0, value - 1))
                        }}
                        className="ml-auto inline-flex h-9 items-center gap-2 rounded-xl border border-red-500/20 px-3 text-[11px] text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="size-4" /> Excluir foto
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[22px] border border-dashed border-white/10 p-12 text-center">
                    <ImagePlus className="mx-auto size-7 text-zinc-700" />
                    <p className="mt-3 text-sm text-zinc-500">Adicione as fotos da experiência anterior.</p>
                    <p className="mt-1 text-xs text-zinc-700">Enquanto estiver vazio, o site mantém o carrossel atual como fallback.</p>
                  </div>
                )}
              </>
            ) : null}

            {section === "about" ? (
              <>
                <SectionHeader title="Sobre Dani" copy="Edite somente a foto desta seção sem alterar a identidade, logo e números de autoridade." />
                <ImageCanvas
                  title="Foto Dani"
                  location="Seção Sobre Dani Ricco"
                  media={doc.about.image}
                  onChange={(media) => mutate((next) => { next.about.image = media })}
                  aspect="4 / 5"
                />
              </>
            ) : null}

            {section === "event" ? (
              <>
                <SectionHeader title="Data e cidade" copy="Esses dados aparecem na faixa de destaque e no fechamento da página." />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Data"><input className={inputClass} value={doc.event.date} onChange={(event) => mutate((next) => { next.event.date = event.target.value })} /></Field>
                  <Field label="Cidade"><input className={inputClass} value={doc.event.city} onChange={(event) => mutate((next) => { next.event.city = event.target.value })} /></Field>
                  <Field label="Aviso de vagas"><input className={inputClass} value={doc.event.spotsLabel} onChange={(event) => mutate((next) => { next.event.spotsLabel = event.target.value })} /></Field>
                </div>
              </>
            ) : null}

            {section === "included" ? (
              <>
                <SectionHeader title="O que está incluso" copy="Edite títulos e descrições. A ordem aqui é a mesma ordem exibida na landing." />
                <div className="space-y-2">
                  {doc.included.map((item, index) => (
                    <div key={item.id} className="grid gap-3 rounded-xl border border-white/8 bg-white/[.02] p-3 md:grid-cols-[28px_1fr_1.4fr_40px] md:items-center">
                      <GripVertical className="hidden size-4 text-zinc-700 md:block" />
                      <input className={inputClass} value={item.title} onChange={(event) => mutate((next) => { next.included[index].title = event.target.value })} />
                      <input className={inputClass} value={item.copy} onChange={(event) => mutate((next) => { next.included[index].copy = event.target.value })} />
                      <button type="button" onClick={() => mutate((next) => { next.included.splice(index, 1) })} className="grid size-9 place-items-center rounded-lg text-zinc-700 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="size-4" /></button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => mutate((next) => { next.included.push({ id: crypto.randomUUID(), title: "Novo entregável", copy: "Descrição do que está incluso." }) })}
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-[11px] font-medium text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  <Plus className="size-4" /> Adicionar item
                </button>
              </>
            ) : null}

            {section === "offers" && selectedOffer ? (
              <>
                <SectionHeader title="Setores / ingressos" copy="Ajuste preço, posição, descrição e tudo o que está incluso em cada setor. O visual Pérola/Ouro/Prata continua protegido." />
                <div className="mb-5 flex gap-2">
                  {doc.offers.map((offer, index) => (
                    <button
                      key={offer.id}
                      type="button"
                      onClick={() => setOfferIndex(index)}
                      className={cn(
                        "rounded-full px-4 py-2 text-[11px] font-semibold transition",
                        offerIndex === index ? "bg-white text-black" : "border border-white/10 text-zinc-500 hover:text-white",
                      )}
                    >
                      {offer.name}
                    </button>
                  ))}
                </div>
                <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Nome do setor"><input className={inputClass} value={selectedOffer.name} onChange={(event) => mutate((next) => { next.offers[offerIndex].name = event.target.value })} /></Field>
                      <Field label="Fileira / posição"><input className={inputClass} value={selectedOffer.row} onChange={(event) => mutate((next) => { next.offers[offerIndex].row = event.target.value })} /></Field>
                      <Field label="Descrição"><input className={inputClass} value={selectedOffer.subtitle} onChange={(event) => mutate((next) => { next.offers[offerIndex].subtitle = event.target.value })} /></Field>
                      <Field label="Preço"><input className={inputClass} value={selectedOffer.price} onChange={(event) => mutate((next) => { next.offers[offerIndex].price = event.target.value })} /></Field>
                      <Field label="Parcelamento"><input className={inputClass} value={selectedOffer.installment} onChange={(event) => mutate((next) => { next.offers[offerIndex].installment = event.target.value })} /></Field>
                    </div>
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-zinc-500">Inclusos no setor</p>
                      <div className="space-y-2">
                        {selectedOffer.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center gap-2">
                            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#00e676]"><Check className="size-3 text-black" strokeWidth={3} /></span>
                            <input className={inputClass} value={item} onChange={(event) => mutate((next) => { next.offers[offerIndex].items[itemIndex] = event.target.value })} />
                            <button type="button" onClick={() => mutate((next) => { next.offers[offerIndex].items.splice(itemIndex, 1) })} className="grid size-9 shrink-0 place-items-center rounded-lg text-zinc-700 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="size-4" /></button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => mutate((next) => { next.offers[offerIndex].items.push("Novo benefício") })} className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-[11px] text-zinc-500 hover:text-white"><Plus className="size-4" /> Adicionar benefício</button>
                    </div>
                  </div>

                  <div className={cn(
                    "flex min-h-[520px] flex-col rounded-[24px] border p-6",
                    selectedOffer.id === "perola"
                      ? "border-[#e9dfd0] bg-[#f2eee7] text-black"
                      : selectedOffer.id === "ouro"
                        ? "border-[#b8943d] bg-black text-white"
                        : "border-[#8f8f8f] bg-black text-white",
                  )}>
                    <p className={cn("text-[10px] uppercase tracking-[.16em]", selectedOffer.id === "perola" ? "text-black/45" : "text-white/35")}>{selectedOffer.row}</p>
                    <h3 className={cn("mt-3 font-[var(--font-playfair)] text-4xl", selectedOffer.id === "ouro" && "text-[#d8b759]")}>{selectedOffer.name}</h3>
                    <p className={cn("mt-2 text-sm", selectedOffer.id === "perola" ? "text-black/55" : "text-white/50")}>{selectedOffer.subtitle}</p>
                    <div className="mt-6 space-y-2">
                      {selectedOffer.items.map((item) => <div key={item} className="flex gap-2 text-xs leading-5"><Check className="mt-0.5 size-3.5 shrink-0 text-[#00d26a]" />{item}</div>)}
                    </div>
                    <div className={cn("mt-auto border-t pt-6", selectedOffer.id === "perola" ? "border-black/10" : "border-white/10")}>
                      <p className="font-[var(--font-playfair)] text-3xl">{selectedOffer.price}</p>
                      <p className="mt-2 text-xs opacity-55">{selectedOffer.installment}</p>
                      <div className="mt-5 rounded-full bg-[#232323] px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-[.12em] text-white">Quero ser {selectedOffer.name}</div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {section === "faq" ? (
              <>
                <SectionHeader title="Dúvidas frequentes" copy="Edite as perguntas e respostas exibidas no final da landing." />
                <div className="space-y-3">
                  {doc.faq.map((item, index) => (
                    <div key={item.id} className="rounded-xl border border-white/8 bg-white/[.02] p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid size-7 shrink-0 place-items-center rounded-full border border-white/10 text-[10px] text-zinc-600">{index + 1}</div>
                        <div className="min-w-0 flex-1 space-y-3">
                          <input className={inputClass} value={item.question} onChange={(event) => mutate((next) => { next.faq[index].question = event.target.value })} />
                          <textarea className={textareaClass} value={item.answer} onChange={(event) => mutate((next) => { next.faq[index].answer = event.target.value })} />
                        </div>
                        <button type="button" onClick={() => mutate((next) => { next.faq.splice(index, 1) })} className="grid size-9 shrink-0 place-items-center rounded-lg text-zinc-700 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="size-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => mutate((next) => { next.faq.push({ id: crypto.randomUUID(), question: "Nova pergunta", answer: "Resposta." }) })}
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-[11px] font-medium text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  <Plus className="size-4" /> Adicionar pergunta
                </button>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}