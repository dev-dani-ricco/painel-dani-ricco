"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft, ArrowRight, ExternalLink, ImagePlus, Images,
  LayoutPanelTop, ListChecks, Save, Send, Ticket,
  Trash2, Upload,
} from "lucide-react"
import { toast } from "sonner"
import {
  cloneImmersaoContent,
  createDefaultImmersaoContent,
  createManagedMedia,
  type ImmersaoContentDocument,
  type ManagedMedia,
} from "@/lib/imersao-content"
import { cn } from "@/lib/utils"

type Tab = "midia" | "cards" | "ingressos"

type UploadResult = {
  asset: {
    id: string
    url: string
    pathname: string
    width: number | null
    height: number | null
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

async function prepareImage(file: File) {
  const source = URL.createObjectURL(file)
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error("Não foi possível abrir a imagem."))
    element.src = source
  })
  URL.revokeObjectURL(source)

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
      (result) => result ? resolve(result) : reject(new Error("Falha ao otimizar imagem.")),
      "image/webp",
      0.88,
    )
  })

  return {
    file: new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
      type: "image/webp",
    }),
    width: canvas.width,
    height: canvas.height,
  }
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-600">
    {children}
  </span>
}
function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input
    {...props}
    className={cn(
      "h-10 w-full rounded-xl border border-white/[.09] bg-white/[.035] px-3 text-sm text-zinc-100 outline-none transition focus:border-primary/50",
      props.className,
    )}
  />
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea
    {...props}
    className={cn(
      "min-h-20 w-full resize-y rounded-xl border border-white/[.09] bg-white/[.035] p-3 text-sm leading-6 text-zinc-100 outline-none transition focus:border-primary/50",
      props.className,
    )}
  />
}

function SectionTitle({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string
  title: string
  copy?: string
}) {
  return <div className="mb-6">
    <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">{eyebrow}</p>
    <h2 className="mt-2 font-[var(--font-playfair)] text-3xl font-medium tracking-[-.035em] text-white">{title}</h2>
    {copy ? <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{copy}</p> : null}
  </div>
}

function MediaCanvas({
  media,
  ratio,
  breakpoint,
  onChange,
}: {
  media: ManagedMedia | null
  ratio: number
  breakpoint: "desktop" | "tablet" | "mobile"
  onChange: (next: ManagedMedia) => void
}) {
  const drag = React.useRef({
    active: false,
    x: 0,
    y: 0,
    transformX: 0,
    transformY: 0,
  })
  const transform = media?.transform?.[breakpoint] ?? { x: 0, y: 0, zoom: 1 }

  return <div>
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080808] touch-none"
      style={{ aspectRatio: String(ratio) }}
      onPointerDown={(event) => {
        if (!media?.src) return
        drag.current = {
          active: true,
          x: event.clientX,
          y: event.clientY,
          transformX: transform.x,
          transformY: transform.y,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (!drag.current.active || !media?.src) return
        const rect = event.currentTarget.getBoundingClientRect()
        const dx = ((event.clientX - drag.current.x) / rect.width) * 100
        const dy = ((event.clientY - drag.current.y) / rect.height) * 100
        onChange({
          ...media,
          transform: {
            ...media.transform,
            [breakpoint]: {
              ...transform,
              x: clamp(drag.current.transformX + dx, -50, 50),
              y: clamp(drag.current.transformY + dy, -50, 50),
            },
          },
        })
      }}
      onPointerUp={() => { drag.current.active = false }}
      onPointerCancel={() => { drag.current.active = false }}
    >
      {media?.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.src}
          alt={media.alt}
          className="pointer-events-none absolute left-1/2 top-1/2 size-full select-none object-cover"
          draggable={false}
          style={{
            transform: `translate(calc(-50% + ${transform.x}%), calc(-50% + ${transform.y}%)) scale(${transform.zoom})`,
            transformOrigin: "center",
          }}
        />
      ) : (
        <div className="grid size-full place-items-center text-center text-zinc-700">
          <div><ImagePlus className="mx-auto mb-3 size-6 text-primary"/><span className="text-xs">Nenhuma imagem publicada</span></div>
        </div>
      )}
      {media?.src ? <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/65 px-3 py-1 text-[9px] uppercase tracking-[.12em] text-zinc-400 backdrop-blur">Arraste para enquadrar</span> : null}
    </div>
    {media ? <div className="mt-3 grid grid-cols-3 gap-3">
      <label><FieldLabel>Horizontal</FieldLabel><input type="range" min="-50" max="50" value={transform.x} onChange={(event) => onChange({ ...media, transform: { ...media.transform, [breakpoint]: { ...transform, x:Number(event.target.value) } } })} className="w-full accent-primary"/></label>
      <label><FieldLabel>Vertical</FieldLabel><input type="range" min="-50" max="50" value={transform.y} onChange={(event) => onChange({ ...media, transform: { ...media.transform, [breakpoint]: { ...transform, y:Number(event.target.value) } } })} className="w-full accent-primary"/></label>
      <label><FieldLabel>Zoom</FieldLabel><input type="range" min="1" max="2.2" step=".05" value={transform.zoom} onChange={(event) => onChange({ ...media, transform: { ...media.transform, [breakpoint]: { ...transform, zoom:Number(event.target.value) } } })} className="w-full accent-primary"/></label>
    </div> : null}
  </div>
}

function UploadButton({
  label,
  onFile,
  busy,
}: {
  label: string
  onFile: (file: File) => void
  busy?: boolean
}) {
  return <label className={cn(
    "inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-4 text-xs font-medium text-zinc-300 transition hover:border-primary/40 hover:text-white",
    busy && "pointer-events-none opacity-50",
  )}>
    <Upload className="size-3.5 text-primary"/>{busy ? "Enviando..." : label}
    <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(event) => {
      const file = event.target.files?.[0]
      if (file) onFile(file)
      event.currentTarget.value = ""
    }}/>
  </label>
}

export function ImersaoContentStudio() {
  const [doc, setDoc] = React.useState<ImmersaoContentDocument>(() => createDefaultImmersaoContent())
  const [tab, setTab] = React.useState<Tab>("midia")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState<string | null>(null)
  const [dirty, setDirty] = React.useState(false)
  const [publishedAt, setPublishedAt] = React.useState<string | null>(null)
  const [gallerySelected, setGallerySelected] = React.useState(0)
  const [mediaBreakpoint, setMediaBreakpoint] = React.useState<"desktop" | "tablet" | "mobile">("desktop")

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
      .catch((error) => {
        console.error(error)
        toast.error("Não foi possível carregar o Conteúdo da Imersão.")
      })
      .finally(() => setLoading(false))
  }, [])

  const commit = React.useCallback((updater: (next: ImmersaoContentDocument) => void) => {
    setDoc((current) => {
      const next = cloneImmersaoContent(current)
      updater(next)
      return next
    })
    setDirty(true)
  }, [])

  const save = async (action: "save" | "publish") => {
    setSaving(true)
    try {
      const response = await fetch("/api/imersao-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: doc, action }),
      })
      if (!response.ok) throw new Error("Não foi possível salvar.")
      const payload = await response.json()
      setDirty(false)
      if (action === "publish") {
        setPublishedAt(payload.published_at || new Date().toISOString())
        toast.success("Conteúdo publicado na landing page.")
      } else {
        toast.success("Rascunho salvo.")
      }
    } catch (error) {
      console.error(error)
      toast.error("Não foi possível salvar o conteúdo.")
    } finally {
      setSaving(false)
    }
  }

  const upload = async (slot: string, file: File) => {
    setUploading(slot)
    try {
      const prepared = await prepareImage(file)
      const form = new FormData()
      form.set("file", prepared.file)
      form.set("slot", slot)
      form.set("width", String(prepared.width))
      form.set("height", String(prepared.height))
      const response = await fetch("/api/imersao-content/assets", {
        method: "POST",
        body: form,
      })
      const payload = await response.json() as UploadResult & { error?: string }
      if (!response.ok || !payload.asset) {
        throw new Error(payload.error || "Falha no upload.")
      }
      return payload.asset
    } finally {
      setUploading(null)
    }
  }

  const uploadSingle = async (
    slot: "hero" | "dani",
    file: File,
  ) => {
    try {
      const asset = await upload(slot, file)
      const media = createManagedMedia(
        asset.id,
        asset.url,
        slot === "hero" ? "Dani Ricco — Posicionamento IMPAR®" : "Dani Ricco",
        file.name,
      )
      commit((next) => {
        if (slot === "hero") next.hero.image = media
        else next.about.image = media
      })
      toast.success("Imagem adicionada ao rascunho.")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Falha no upload.")
    }
  }

  const addGalleryImage = async (file: File) => {
    try {
      const asset = await upload("experiencia", file)
      const media = createManagedMedia(
        asset.id,
        asset.url,
        "Experiência Posicionamento IMPAR®",
        file.name,
      )
      const nextIndex = doc.carousel.length
      commit((next) => { next.carousel.push(media) })
      setGallerySelected(nextIndex)
      toast.success("Foto adicionada ao carrossel.")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Falha no upload.")
    }
  }

  const moveGallery = (index: number, direction: -1 | 1) => {
    commit((next) => {
      const target = index + direction
      if (target < 0 || target >= next.carousel.length) return
      const [item] = next.carousel.splice(index, 1)
      next.carousel.splice(target, 0, item)
    })
    setGallerySelected((current) => clamp(current + direction, 0, Math.max(0, doc.carousel.length - 1)))
  }

  const removeGallery = (index: number) => {
    commit((next) => { next.carousel.splice(index, 1) })
    setGallerySelected((current) => Math.max(0, Math.min(current, doc.carousel.length - 2)))
  }

  if (loading) {
    return <div className="grid min-h-[70vh] place-items-center text-sm text-zinc-500">Carregando Conteúdo da Imersão…</div>
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof Images }> = [
    { id: "midia", label: "Fotos & Mídia", icon: Images },
    { id: "cards", label: "Cards & Entregáveis", icon: ListChecks },
    { id: "ingressos", label: "Ingressos", icon: Ticket },
  ]

  return <div className="-mx-4 -mt-5 min-h-[calc(100vh-92px)] bg-[#090909] sm:-mx-6 lg:-mx-10">
    <header className="sticky top-[72px] z-20 border-b border-white/[.08] bg-[#0b0b0b]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3">
        <div className="mr-auto">
          <p className="text-sm font-semibold text-white">Conteúdo da Imersão</p>
          <p className="mt-1 text-[10px] text-zinc-600">Mídia, cards e informações que alimentam a página oficial.</p>
        </div>
        <span className={cn("text-[10px]", dirty ? "text-amber-400" : "text-zinc-600")}>{dirty ? "Alterações não salvas" : publishedAt ? "Publicado" : "Somente rascunho"}</span>
        <Link href="/editor-paginas" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-xs text-zinc-400 transition hover:text-white"><LayoutPanelTop className="size-3.5"/>Page Studio</Link>
        <a href="https://daniricco.com.br/imersao" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-xs text-zinc-400 transition hover:text-white"><ExternalLink className="size-3.5"/>Abrir página</a>
        <button onClick={() => void save("save")} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-xs text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"><Save className="size-3.5"/>Salvar</button>
        <button onClick={() => {
          if (window.confirm("Publicar estas alterações na landing page da Imersão?")) void save("publish")
        }} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-black transition hover:bg-primary/90 disabled:opacity-50"><Send className="size-3.5"/>Publicar</button>
      </div>
    </header>
    <div className="border-b border-white/[.06] bg-[#0a0a0a] px-4 sm:px-6">
      <div className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto py-2">
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={cn("inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-xs transition", tab === id ? "bg-white text-black" : "text-zinc-500 hover:bg-white/[.04] hover:text-white")}><Icon className="size-3.5"/>{label}</button>)}
      </div>
    </div>

    <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
      {tab === "midia" ? <div className="space-y-12">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[.08] bg-white/[.02] p-4">
          <div>
            <p className="text-xs font-semibold text-white">Enquadramento responsivo</p>
            <p className="mt-1 text-[11px] text-zinc-600">Ajuste cada foto separadamente para desktop, tablet e mobile.</p>
          </div>
          <div className="flex rounded-xl border border-white/[.08] bg-black p-1">
            {(["desktop", "tablet", "mobile"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setMediaBreakpoint(value)}
                className={cn(
                  "h-9 rounded-lg px-3 text-[10px] font-semibold uppercase tracking-[.08em] transition",
                  mediaBreakpoint === value ? "bg-white text-black" : "text-zinc-500 hover:text-white",
                )}
              >
                {value === "desktop" ? "Desktop" : value === "tablet" ? "Tablet" : "Mobile"}
              </button>
            ))}
          </div>
        </div>
        <section>
          <SectionTitle eyebrow="Imagem principal" title="Hero da página" copy="Envie a foto, arraste dentro do quadro para escolher o enquadramento e ajuste zoom. O arquivo fica no repositório da Dani; a publicação apenas troca a referência usada no site."/>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <MediaCanvas media={doc.hero.image} ratio={16/8.3} breakpoint={mediaBreakpoint} onChange={(media) => commit((next) => { next.hero.image = media })}/>
            <div className="space-y-4 rounded-2xl border border-white/[.08] bg-white/[.02] p-5">
              <UploadButton label={doc.hero.image?.src ? "Trocar foto do Hero" : "Adicionar foto do Hero"} busy={uploading === "hero"} onFile={(file) => void uploadSingle("hero", file)}/>
              <label className="block"><FieldLabel>Headline</FieldLabel><TextArea value={doc.hero.title} onChange={(event) => commit((next) => { next.hero.title = event.target.value })}/></label>
              <label className="block"><FieldLabel>Descrição</FieldLabel><TextArea value={doc.hero.copy} onChange={(event) => commit((next) => { next.hero.copy = event.target.value })}/></label>
              <label className="block"><FieldLabel>Texto do botão</FieldLabel><TextInput value={doc.hero.cta} onChange={(event) => commit((next) => { next.hero.cta = event.target.value })}/></label>
            </div>
          </div>
        </section>
        <section>
          <SectionTitle eyebrow="Experiência anterior" title="Carrossel de fotos" copy="As imagens continuam rolando e arrastáveis na página. Aqui você escolhe quais entram, a ordem e o enquadramento de cada uma."/>
          <div className="flex flex-wrap items-center gap-3">
            <UploadButton label="Adicionar foto ao carrossel" busy={uploading === "experiencia"} onFile={(file) => void addGalleryImage(file)}/>
            <span className="text-xs text-zinc-600">{doc.carousel.length} foto(s) no rascunho</span>
          </div>
          {doc.carousel.length ? <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
            <div className="flex gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {doc.carousel.map((media, index) => {
                const transform = media.transform[mediaBreakpoint] ?? { x: 0, y: 0, zoom: 1 }
                return <button key={media.id || index} onClick={() => setGallerySelected(index)} className={cn("relative h-40 w-56 shrink-0 overflow-hidden rounded-2xl border transition", gallerySelected === index ? "border-primary" : "border-white/10")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={media.src}
                    alt={media.alt}
                    className="pointer-events-none absolute left-1/2 top-1/2 size-full object-cover"
                    style={{
                      transform: `translate(calc(-50% + ${transform.x}%), calc(-50% + ${transform.y}%)) scale(${transform.zoom})`,
                      transformOrigin: "center",
                    }}
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[9px] text-zinc-300">{String(index + 1).padStart(2, "0")}</span>
                </button>
              })}
            </div>
            <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-4">
              {doc.carousel[gallerySelected] ? <>
                <MediaCanvas media={doc.carousel[gallerySelected]} ratio={4/3} breakpoint={mediaBreakpoint} onChange={(media) => commit((next) => { next.carousel[gallerySelected] = media })}/>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button disabled={gallerySelected === 0} onClick={() => moveGallery(gallerySelected, -1)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-zinc-400 disabled:opacity-30"><ArrowLeft className="size-3"/>Mover</button>
                  <button disabled={gallerySelected >= doc.carousel.length - 1} onClick={() => moveGallery(gallerySelected, 1)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-zinc-400 disabled:opacity-30">Mover<ArrowRight className="size-3"/></button>
                  <button onClick={() => removeGallery(gallerySelected)} className="ml-auto inline-flex h-9 items-center gap-2 rounded-lg border border-red-500/20 px-3 text-xs text-red-400"><Trash2 className="size-3"/>Remover</button>
                </div>
              </> : null}
            </div>
          </div> : <div className="mt-5 rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center text-sm text-zinc-600">Adicione as fotos da experiência anterior. Elas aparecerão aqui e depois no carrossel oficial.</div>}
        </section>

        <section>
          <SectionTitle eyebrow="Autoridade" title="Foto da Dani" copy="Imagem da seção sobre a Dani. O enquadramento é independente da foto do Hero."/>
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <MediaCanvas media={doc.about.image} ratio={4/5} breakpoint={mediaBreakpoint} onChange={(media) => commit((next) => { next.about.image = media })}/>
            <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-5">
              <UploadButton label={doc.about.image?.src ? "Trocar foto da Dani" : "Adicionar foto da Dani"} busy={uploading === "dani"} onFile={(file) => void uploadSingle("dani", file)}/>
              <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-500">Depois do upload, ajuste o foco diretamente no quadro. A imagem original continua no repositório e o enquadramento fica salvo como configuração da página.</p>
            </div>
          </div>
        </section>
      </div> : null}
      {tab === "cards" ? <div className="space-y-12">
        <section>
          <SectionTitle eyebrow="Conteúdo" title="12 horas para transformar conhecimento em posicionamento" copy="Edite o título e a descrição de cada item. A ordem abaixo é a ordem da página."/>
          <div className="space-y-3">
            {doc.learning.map((card, index) => <div key={index} className="grid gap-3 rounded-2xl border border-white/[.08] bg-white/[.02] p-4 lg:grid-cols-[220px_1fr]">
              <label><FieldLabel>Título</FieldLabel><TextInput value={card.title} onChange={(event) => commit((next) => { next.learning[index].title = event.target.value })}/></label>
              <label><FieldLabel>Descrição</FieldLabel><TextArea value={card.copy} onChange={(event) => commit((next) => { next.learning[index].copy = event.target.value })} className="min-h-10"/></label>
            </div>)}
          </div>
        </section>

        <section>
          <SectionTitle eyebrow="Entregáveis" title="Tudo o que está incluído" copy="Cada linha alimenta a lista com o check verde na landing."/>
          <div className="space-y-3">
            {doc.included.map((card, index) => <div key={card.id} className="grid gap-3 rounded-2xl border border-white/[.08] bg-white/[.02] p-4 lg:grid-cols-[260px_1fr]">
              <label><FieldLabel>Entrega</FieldLabel><TextInput value={card.title} onChange={(event) => commit((next) => { next.included[index].title = event.target.value })}/></label>
              <label><FieldLabel>Descrição</FieldLabel><TextArea value={card.copy} onChange={(event) => commit((next) => { next.included[index].copy = event.target.value })} className="min-h-10"/></label>
            </div>)}
          </div>
        </section>

        <section>
          <SectionTitle eyebrow="FAQ" title="Dúvidas frequentes" copy="Edite pergunta e resposta sem alterar o design da seção final."/>
          <div className="space-y-3">
            {doc.faq.map((item, index) => <div key={item.id} className="grid gap-3 rounded-2xl border border-white/[.08] bg-white/[.02] p-4 lg:grid-cols-[280px_1fr]">
              <label><FieldLabel>Pergunta</FieldLabel><TextInput value={item.question} onChange={(event) => commit((next) => { next.faq[index].question = event.target.value })}/></label>
              <label><FieldLabel>Resposta</FieldLabel><TextArea value={item.answer} onChange={(event) => commit((next) => { next.faq[index].answer = event.target.value })} className="min-h-10"/></label>
            </div>)}
          </div>
        </section>
      </div> : null}
      {tab === "ingressos" ? <div className="space-y-10">
        <section>
          <SectionTitle eyebrow="Evento" title="Informações comerciais" copy="Data, cidade e aviso de disponibilidade usados na landing."/>
          <div className="grid gap-4 rounded-2xl border border-white/[.08] bg-white/[.02] p-5 md:grid-cols-3">
            <label><FieldLabel>Data</FieldLabel><TextInput value={doc.event.date} onChange={(event) => commit((next) => { next.event.date = event.target.value })}/></label>
            <label><FieldLabel>Cidade</FieldLabel><TextInput value={doc.event.city} onChange={(event) => commit((next) => { next.event.city = event.target.value })}/></label>
            <label><FieldLabel>Disponibilidade</FieldLabel><TextInput value={doc.event.spotsLabel} onChange={(event) => commit((next) => { next.event.spotsLabel = event.target.value })}/></label>
          </div>
        </section>
        <section>
        <SectionTitle eyebrow="Oferta" title="Pérola, Ouro e Prata" copy="Preço, posicionamento e benefícios são publicados a partir daqui. Um benefício por linha."/>
        <div className="grid gap-5 xl:grid-cols-3">
          {doc.offers.map((offer, index) => <article key={offer.name} className={cn("rounded-3xl border p-5", offer.name === "PÉROLA" ? "border-[#e8dfd3] bg-[#eee9e1] text-black" : offer.name === "OURO" ? "border-[#b8943d] bg-[#0c0c0c]" : "border-zinc-600 bg-[#0c0c0c]")}>
            <h3 className="font-[var(--font-playfair)] text-3xl">{offer.name}</h3>
            <div className="mt-5 space-y-4">
              <label><FieldLabel>Posição / fileira</FieldLabel><TextInput value={offer.row} onChange={(event) => commit((next) => { next.offers[index].row = event.target.value })} className={offer.name === "PÉROLA" ? "border-black/10 bg-black/[.04] text-black" : ""}/></label>
              <label><FieldLabel>Descrição</FieldLabel><TextInput value={offer.subtitle} onChange={(event) => commit((next) => { next.offers[index].subtitle = event.target.value })} className={offer.name === "PÉROLA" ? "border-black/10 bg-black/[.04] text-black" : ""}/></label>
              <label><FieldLabel>Valor</FieldLabel><TextInput value={offer.price} onChange={(event) => commit((next) => { next.offers[index].price = event.target.value })} className={offer.name === "PÉROLA" ? "border-black/10 bg-black/[.04] text-black" : ""}/></label>
              <label><FieldLabel>Parcelamento</FieldLabel><TextInput value={offer.installment} onChange={(event) => commit((next) => { next.offers[index].installment = event.target.value })} className={offer.name === "PÉROLA" ? "border-black/10 bg-black/[.04] text-black" : ""}/></label>
              <label><FieldLabel>O que inclui</FieldLabel><TextArea value={offer.items.join("\n")} onChange={(event) => commit((next) => { next.offers[index].items = event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} className={cn("min-h-56", offer.name === "PÉROLA" && "border-black/10 bg-black/[.04] text-black")}/></label>
            </div>
          </article>)}
        </div>
        </section>
      </div> : null}
    </main>
  </div>
}
