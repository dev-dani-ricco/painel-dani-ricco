"use client"

import * as React from "react"
import Link from "next/link"
import { Rnd } from "react-rnd"
import {
  AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, Box,
  Copy, ExternalLink, Eye, EyeOff, ImageIcon, Layers3, Link2, Monitor, Move,
  MousePointer2, Redo2, Save, Smartphone, Square, Tablet, TextCursorInput,
  Trash2, Undo2, Upload, WandSparkles, X,
} from "lucide-react"
import { toast } from "sonner"
import {
  cloneDocument,
  createDefaultImersaoDocument,
  type ElementRect,
  type PageBreakpoint,
  type PageBuilderDocument,
  type PageElement,
} from "@/lib/page-builder"
import { cn } from "@/lib/utils"

const DEVICE_META: Record<PageBreakpoint, { label:string; icon: typeof Monitor }> = {
  desktop: { label: "Desktop", icon: Monitor },
  tablet: { label: "Tablet", icon: Tablet },
  mobile: { label: "Mobile", icon: Smartphone },
}

const uid = () => Math.random().toString(36).slice(2, 10)
const clamp = (value:number,min:number,max:number) => Math.min(Math.max(value,min),max)

function styleFor(element: PageElement): React.CSSProperties {
  const s = element.style
  return {
    color: s.color,
    background: s.background,
    borderColor: s.borderColor,
    borderWidth: s.borderWidth,
    borderStyle: s.borderWidth ? "solid" : undefined,
    borderRadius: s.borderRadius,
    opacity: s.opacity ?? 1,
    padding: s.padding,
    zIndex: s.zIndex ?? 1,
    fontFamily: s.fontFamily === "playfair" ? "var(--font-playfair), Georgia, serif" : "var(--font-manrope), sans-serif",
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    textAlign: s.textAlign,
    boxShadow: s.shadow,
  }
}

async function compressImage(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })

  const maxSide = 1400
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(img.width * scale))
  canvas.height = Math.max(1, Math.round(img.height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/webp", 0.82)
}

function ElementView({ element }: { element: PageElement }) {
  const style = styleFor(element)

  if (element.type === "image") {
    return element.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={element.src}
        alt={element.alt || ""}
        className="size-full select-none"
        style={{ ...style, objectFit: element.fit || "cover", padding: 0 }}
        draggable={false}
      />
    ) : (
      <div className="grid size-full place-items-center border border-dashed border-white/20 bg-white/[.025] text-center" style={style}>
        <div className="px-5 text-[11px] uppercase tracking-[.14em] text-zinc-600">
          <ImageIcon className="mx-auto mb-3 size-5 text-primary"/>
          {element.alt || "Adicionar imagem"}
        </div>
      </div>
    )
  }

  if (element.type === "button") {
    return <div className="flex size-full items-center justify-center whitespace-pre-wrap" style={style}>{element.content || "Botão"}</div>
  }

  if (element.type === "box") {
    return <div className="size-full" style={style}/>
  }

  if (element.type === "divider") {
    return <div className="flex size-full items-center"><div className="w-full border-t" style={{ borderColor: element.style.borderColor || "#333", borderWidth: element.style.borderWidth || 1 }}/></div>
  }

  return <div className="size-full overflow-hidden whitespace-pre-wrap" style={style}>{element.content || "Texto"}</div>
}

function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.13em] text-zinc-600">{label}</span>{children}</label>
}

function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} type="number" className={cn("h-9 w-full rounded-lg border border-white/[.09] bg-white/[.035] px-3 text-xs outline-none transition focus:border-primary/50", props.className)}/>
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-9 w-full rounded-lg border border-white/[.09] bg-white/[.035] px-3 text-xs outline-none transition focus:border-primary/50", props.className)}/>
}

function ToolButton({ active, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?:boolean }) {
  return <button {...props} className={cn("inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-[11px] font-medium transition", active ? "border-primary/50 bg-primary/10 text-primary" : "border-white/[.08] bg-white/[.025] text-zinc-400 hover:bg-white/[.05] hover:text-white", props.className)}>{children}</button>
}

export function PageStudio({ slug = "imersao" }: { slug?:string }) {
  const [doc, setDoc] = React.useState<PageBuilderDocument>(() => createDefaultImersaoDocument())
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [device, setDevice] = React.useState<PageBreakpoint>("desktop")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [dirty, setDirty] = React.useState(false)
  const [preview, setPreview] = React.useState(false)
  const [snap, setSnap] = React.useState(true)
  const [showLayers, setShowLayers] = React.useState(true)
  const [showInspector, setShowInspector] = React.useState(true)
  const [undoStack, setUndoStack] = React.useState<PageBuilderDocument[]>([])
  const [redoStack, setRedoStack] = React.useState<PageBuilderDocument[]>([])
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = React.useState(1)

  const selected = React.useMemo(
    () => doc.elements.find((element) => element.id === selectedId) || null,
    [doc.elements, selectedId],
  )
  const canvas = doc.canvas[device]

  React.useEffect(() => {
    let active = true
    fetch(`/api/page-builder/${slug}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao carregar editor")
        return response.json()
      })
      .then((payload) => {
        if (!active) return
        setDoc(payload.draft || createDefaultImersaoDocument())
        setLoading(false)
      })
      .catch((error) => {
        console.error(error)
        toast.error("Não foi possível carregar o editor. Abrindo modelo local.")
        setLoading(false)
      })
    return () => { active = false }
  }, [slug])

  React.useEffect(() => {
    const node = viewportRef.current
    if (!node) return
    const update = () => {
      const available = Math.max(280, node.clientWidth - 48)
      setScale(Math.min(1, available / canvas.width))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [canvas.width, device, showLayers, showInspector, preview])

  const commit = React.useCallback((next:PageBuilderDocument) => {
    setUndoStack((stack) => [...stack.slice(-39), cloneDocument(doc)])
    setRedoStack([])
    setDoc(next)
    setDirty(true)
  }, [doc])

  const updateElement = React.useCallback((id:string, updater:(element:PageElement)=>PageElement) => {
    const next = cloneDocument(doc)
    const index = next.elements.findIndex((element) => element.id === id)
    if (index < 0) return
    next.elements[index] = updater(next.elements[index])
    commit(next)
  }, [commit, doc])

  const updateRect = (id:string, rect:Partial<ElementRect>) => {
    updateElement(id, (element) => {
      const current = element.states[device].rect
      element.states[device].rect = {
        x: clamp(rect.x ?? current.x, 0, canvas.width),
        y: clamp(rect.y ?? current.y, 0, canvas.height),
        w: clamp(rect.w ?? current.w, 24, canvas.width),
        h: clamp(rect.h ?? current.h, 16, canvas.height),
      }
      return element
    })
  }

  const addElement = (type:PageElement["type"]) => {
    const next = cloneDocument(doc)
    const baseY = Math.min(
      canvas.height - 180,
      Math.max(80, ...next.elements.map((element) => element.states[device].rect.y + element.states[device].rect.h + 28)),
    )
    const element:PageElement = {
      id: `${type}-${uid()}`,
      name: type === "text" ? "Novo texto" : type === "image" ? "Nova imagem" : type === "button" ? "Novo botão" : type === "divider" ? "Divisor" : "Bloco",
      type,
      content: type === "text" ? "Escreva seu texto" : type === "button" ? "CLIQUE AQUI" : undefined,
      alt: type === "image" ? "Adicionar imagem" : undefined,
      fit: "cover",
      states: {
        desktop: { rect: { x: 120, y: baseY, w: type === "divider" ? 1200 : type === "button" ? 320 : 520, h: type === "divider" ? 16 : type === "image" ? 360 : type === "box" ? 280 : type === "button" ? 56 : 120 } },
        tablet: { rect: { x: 44, y: Math.round(baseY * .72), w: type === "divider" ? 680 : type === "button" ? 300 : 520, h: type === "divider" ? 16 : type === "image" ? 320 : type === "box" ? 240 : type === "button" ? 56 : 110 } },
        mobile: { rect: { x: 20, y: Math.round(baseY * .82), w: type === "divider" ? 350 : type === "button" ? 300 : 350, h: type === "divider" ? 16 : type === "image" ? 280 : type === "box" ? 220 : type === "button" ? 54 : 110 } },
      },
      style: {
        fontFamily: type === "text" ? "playfair" : "manrope",
        fontSize: type === "text" ? 42 : 13,
        fontWeight: type === "button" ? 700 : 500,
        lineHeight: 1.08,
        textAlign: type === "button" ? "center" : "left",
        color: "#ffffff",
        background: type === "button" ? "#E85002" : type === "box" ? "#111111" : undefined,
        borderColor: type === "image" ? "#2b2b2b" : type === "divider" ? "#333333" : undefined,
        borderWidth: type === "image" || type === "divider" ? 1 : 0,
        borderRadius: type === "button" ? 999 : type === "image" || type === "box" ? 18 : 0,
        padding: type === "text" ? 4 : type === "button" ? 12 : 0,
        zIndex: 2,
      },
    }
    next.elements.push(element)
    commit(next)
    setSelectedId(element.id)
  }

  const duplicateSelected = () => {
    if (!selected) return
    const next = cloneDocument(doc)
    const copy = cloneDocument({ ...doc, elements:[selected] }).elements[0]
    copy.id = `${selected.type}-${uid()}`
    copy.name = `${selected.name} — cópia`
    ;(["desktop","tablet","mobile"] as PageBreakpoint[]).forEach((bp) => {
      copy.states[bp].rect.x += 20
      copy.states[bp].rect.y += 20
    })
    next.elements.push(copy)
    commit(next)
    setSelectedId(copy.id)
  }

  const deleteSelected = () => {
    if (!selected) return
    const next = cloneDocument(doc)
    next.elements = next.elements.filter((element) => element.id !== selected.id)
    commit(next)
    setSelectedId(null)
  }

  const undo = () => {
    const previous = undoStack.at(-1)
    if (!previous) return
    setRedoStack((stack) => [...stack, cloneDocument(doc)])
    setUndoStack((stack) => stack.slice(0, -1))
    setDoc(previous)
    setDirty(true)
  }

  const redo = () => {
    const next = redoStack.at(-1)
    if (!next) return
    setUndoStack((stack) => [...stack, cloneDocument(doc)])
    setRedoStack((stack) => stack.slice(0, -1))
    setDoc(next)
    setDirty(true)
  }

  const save = async (action:"save"|"publish" = "save") => {
    setSaving(true)
    try {
      const response = await fetch(`/api/page-builder/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document:doc, action }),
      })
      if (!response.ok) throw new Error(await response.text())
      setDirty(false)
      toast.success(action === "publish" ? "Página publicada." : "Rascunho salvo.")
    } catch (error) {
      console.error(error)
      toast.error("Não foi possível salvar a página.")
    } finally {
      setSaving(false)
    }
  }

  const importImage = async (file:File) => {
    if (!selected || selected.type !== "image") return
    try {
      const dataUrl = await compressImage(file)
      const response = await fetch("/api/page-builder/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, name:file.name }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error:"Falha ao enviar imagem." })) as { error?:string }
        throw new Error(payload.error || "Falha ao enviar imagem.")
      }
      const payload = await response.json() as { url:string }
      updateElement(selected.id, (element) => ({ ...element, src:payload.url, alt:element.alt || file.name }))
      toast.success("Imagem adicionada e salva na biblioteca.")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Não foi possível processar a imagem.")
    }
  }

  const copyCurrentTo = (target:PageBreakpoint) => {
    if (!selected) return
    updateElement(selected.id, (element) => {
      const from = element.states[device].rect
      const fromCanvas = doc.canvas[device]
      const targetCanvas = doc.canvas[target]
      element.states[target].rect = {
        x: Math.round(from.x / fromCanvas.width * targetCanvas.width),
        y: Math.round(from.y / fromCanvas.width * targetCanvas.width),
        w: Math.round(from.w / fromCanvas.width * targetCanvas.width),
        h: Math.round(from.h / fromCanvas.width * targetCanvas.width),
      }
      element.states[target].hidden = element.states[device].hidden
      return element
    })
  }

  const changeCanvasHeight = (value:number) => {
    const next = cloneDocument(doc)
    next.canvas[device].height = clamp(value, 800, 20000)
    commit(next)
  }

  if (loading) {
    return <div className="grid min-h-[70vh] place-items-center text-sm text-zinc-500">Carregando Page Studio…</div>
  }

  const selectedState = selected?.states[device]

  return <div className="-mx-4 -mt-5 min-h-[calc(100vh-92px)] bg-[#090909] sm:-mx-6 lg:-mx-10">
    <div className="sticky top-[72px] z-20 flex min-h-14 flex-wrap items-center gap-2 border-b border-white/[.08] bg-[#0c0c0c]/95 px-3 py-2 backdrop-blur-xl sm:px-4">
      <div className="mr-2">
        <p className="text-xs font-semibold text-white">Page Studio</p>
        <p className="text-[9px] uppercase tracking-[.14em] text-zinc-600">daniricco.com.br/imersao</p>
      </div>

      <div className="flex rounded-lg border border-white/[.08] bg-black p-1">
        {(Object.keys(DEVICE_META) as PageBreakpoint[]).map((key) => {
          const Icon = DEVICE_META[key].icon
          return <button key={key} onClick={() => setDevice(key)} className={cn("flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[10px] transition", device === key ? "bg-white text-black" : "text-zinc-500 hover:text-white")}>
            <Icon className="size-3.5"/><span className="hidden sm:inline">{DEVICE_META[key].label}</span>
          </button>
        })}
      </div>

      <ToolButton active={snap} onClick={() => setSnap((value) => !value)}><Move className="size-3.5"/>Grid</ToolButton>
      <ToolButton onClick={undo} disabled={!undoStack.length}><Undo2 className="size-3.5"/></ToolButton>
      <ToolButton onClick={redo} disabled={!redoStack.length}><Redo2 className="size-3.5"/></ToolButton>

      <div className="ml-auto flex items-center gap-2">
        <span className={cn("hidden text-[10px] sm:inline", dirty ? "text-amber-400" : "text-zinc-600")}>{dirty ? "Alterações não salvas" : "Salvo"}</span>
        <ToolButton active={preview} onClick={() => setPreview((value) => !value)}><Eye className="size-3.5"/>{preview ? "Editar" : "Prévia"}</ToolButton>
        <Link href="/editor-paginas/imersao/conteudo" className="hidden h-9 items-center gap-2 rounded-lg border border-[#E85002]/25 bg-[#E85002]/8 px-3 text-[11px] font-medium text-[#ff8f58] transition hover:bg-[#E85002]/15 sm:inline-flex">
          <WandSparkles className="size-3.5"/>Conteúdo
        </Link>
        <a href="https://daniricco.com.br/imersao" target="_blank" rel="noopener noreferrer" className="hidden h-9 items-center gap-2 rounded-lg border border-white/[.08] bg-white/[.025] px-3 text-[11px] font-medium text-zinc-400 transition hover:bg-white/[.05] hover:text-white sm:inline-flex">
          <ExternalLink className="size-3.5"/>Abrir página
        </a>
        <ToolButton onClick={() => void save("save")} disabled={saving}><Save className="size-3.5"/>Salvar</ToolButton>
        <button
          onClick={() => {
            if (window.confirm("Publicar esta versão e substituir a landing page atual em daniricco.com.br/imersao?")) void save("publish")
          }}
          disabled={saving}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[11px] font-semibold text-black transition hover:bg-primary/90 disabled:opacity-50"
        >
          <ArrowDownToLine className="size-3.5"/>Publicar
        </button>
      </div>
    </div>

    {!preview && <div className="flex min-h-12 items-center gap-2 overflow-x-auto border-b border-white/[.06] bg-[#0a0a0a] px-3 py-2 sm:px-4">
      <span className="mr-1 text-[9px] font-semibold uppercase tracking-[.14em] text-zinc-700">Adicionar</span>
      <ToolButton onClick={() => addElement("text")}><TextCursorInput className="size-3.5"/>Texto</ToolButton>
      <ToolButton onClick={() => addElement("image")}><ImageIcon className="size-3.5"/>Imagem / Design</ToolButton>
      <ToolButton onClick={() => addElement("button")}><MousePointer2 className="size-3.5"/>Botão</ToolButton>
      <ToolButton onClick={() => addElement("box")}><Square className="size-3.5"/>Bloco</ToolButton>
      <ToolButton onClick={() => addElement("divider")}><Box className="size-3.5"/>Divisor</ToolButton>
      <div className="ml-auto flex gap-2">
        <ToolButton active={showLayers} onClick={() => setShowLayers((value) => !value)}><Layers3 className="size-3.5"/>Camadas</ToolButton>
        <ToolButton active={showInspector} onClick={() => setShowInspector((value) => !value)}><WandSparkles className="size-3.5"/>Inspector</ToolButton>
      </div>
    </div>}

    <div className={cn("grid min-h-[calc(100vh-178px)]", !preview && showLayers && showInspector ? "xl:grid-cols-[230px_1fr_300px]" : !preview && (showLayers || showInspector) ? "xl:grid-cols-[230px_1fr]" : "grid-cols-1")}>
      {!preview && showLayers && <aside className="hidden min-h-0 border-r border-white/[.08] bg-[#0b0b0b] xl:block">
        <div className="sticky top-[178px] max-h-[calc(100vh-178px)] overflow-y-auto p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-600">Camadas</p>
            <span className="text-[9px] text-zinc-700">{doc.elements.length}</span>
          </div>
          <div className="space-y-1">
            {[...doc.elements].sort((a,b) => (b.style.zIndex || 0) - (a.style.zIndex || 0)).map((element) => {
              const hidden = element.states[device].hidden
              return <button key={element.id} onClick={() => setSelectedId(element.id)} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] transition", selectedId === element.id ? "bg-primary/10 text-primary" : "text-zinc-500 hover:bg-white/[.04] hover:text-zinc-200")}>
                {element.type === "image" ? <ImageIcon className="size-3.5"/> : element.type === "text" ? <TextCursorInput className="size-3.5"/> : element.type === "button" ? <MousePointer2 className="size-3.5"/> : <Square className="size-3.5"/>}
                <span className="min-w-0 flex-1 truncate">{element.name}</span>
                {hidden ? <EyeOff className="size-3"/> : null}
              </button>
            })}
          </div>
        </div>
      </aside>}

      <section ref={viewportRef} className="min-w-0 overflow-auto bg-[#111] p-6 sm:p-8" onClick={() => !preview && setSelectedId(null)}>
        <div className="mx-auto" style={{ width:canvas.width * scale, height:canvas.height * scale }}>
          <div
            className={cn("relative origin-top-left overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,.45)]", snap && !preview && "page-builder-grid")}
            style={{
              width:canvas.width,
              height:canvas.height,
              background:doc.settings.background,
              transform:`scale(${scale})`,
              transformOrigin:"top left",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {doc.elements.map((element) => {
              const state = element.states[device]
              if (state.hidden) return null
              const isSelected = selectedId === element.id

              if (preview) {
                return <div key={element.id} className="absolute" style={{ left:state.rect.x, top:state.rect.y, width:state.rect.w, height:state.rect.h, zIndex:element.style.zIndex || 1 }}>
                  <ElementView element={element}/>
                </div>
              }

              return <Rnd
                key={element.id}
                bounds="parent"
                scale={scale}
                size={{ width:state.rect.w, height:state.rect.h }}
                position={{ x:state.rect.x, y:state.rect.y }}
                dragGrid={snap ? [8,8] : [1,1]}
                resizeGrid={snap ? [8,8] : [1,1]}
                onDragStart={() => setSelectedId(element.id)}
                onDragStop={(_event, data) => updateRect(element.id, { x:data.x, y:data.y })}
                onResizeStart={() => setSelectedId(element.id)}
                onResizeStop={(_event, _direction, ref, _delta, position) => updateRect(element.id, { x:position.x, y:position.y, w:ref.offsetWidth, h:ref.offsetHeight })}
                className={cn("group", isSelected && "ring-1 ring-primary")}
                style={{ zIndex:element.style.zIndex || 1 }}
              >
                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); setSelectedId(element.id) }}
                  className="relative size-full cursor-move text-left"
                  aria-label={`Selecionar ${element.name}`}
                >
                  <ElementView element={element}/>
                  <span className={cn("pointer-events-none absolute -top-6 left-0 rounded bg-primary px-1.5 py-1 text-[8px] font-bold uppercase tracking-[.08em] text-black opacity-0 transition", isSelected && "opacity-100")}>{element.name}</span>
                </button>
              </Rnd>
            })}
          </div>
        </div>
      </section>

      {!preview && showInspector && <aside className={cn("hidden min-h-0 border-l border-white/[.08] bg-[#0b0b0b] xl:block", showLayers ? "" : "")}>
        <div className="sticky top-[178px] max-h-[calc(100vh-178px)] overflow-y-auto p-4">
          {!selected ? <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-white">Página</p>
              <p className="mt-1 text-[11px] leading-5 text-zinc-600">Selecione um elemento para editar. Aqui você também controla o canvas de cada dispositivo.</p>
            </div>
            <Field label="Altura do canvas">
              <NumberInput value={canvas.height} min={800} max={20000} onChange={(event) => changeCanvasHeight(Number(event.target.value))}/>
            </Field>
            <Field label="Fundo da página">
              <div className="flex gap-2"><input type="color" value={doc.settings.background} onChange={(event) => { const next=cloneDocument(doc); next.settings.background=event.target.value; commit(next) }} className="h-9 w-12 rounded border border-white/10 bg-transparent"/><TextInput value={doc.settings.background} onChange={(event) => { const next=cloneDocument(doc); next.settings.background=event.target.value; commit(next) }}/></div>
            </Field>
            <div className="rounded-xl border border-white/[.08] bg-white/[.025] p-3 text-[11px] leading-5 text-zinc-500">
              <strong className="text-zinc-300">Dica:</strong> use “Imagem / Design” para subir uma arte pronta e arrastá-la livremente. Cada dispositivo guarda posição e tamanho próprios.
            </div>
          </div> : <div className="space-y-5">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{selected.name}</p><p className="mt-1 text-[9px] uppercase tracking-[.12em] text-zinc-600">{selected.type} · {DEVICE_META[device].label}</p></div>
              <button onClick={() => setSelectedId(null)} className="grid size-7 place-items-center rounded-md text-zinc-600 hover:bg-white/5 hover:text-white"><X className="size-3.5"/></button>
            </div>

            <Field label="Nome da camada"><TextInput value={selected.name} onChange={(event) => updateElement(selected.id, (element) => ({ ...element, name:event.target.value }))}/></Field>

            {(selected.type === "text" || selected.type === "button") && <Field label="Texto">
              <textarea value={selected.content || ""} onChange={(event) => updateElement(selected.id, (element) => ({ ...element, content:event.target.value }))} className="min-h-24 w-full resize-y rounded-lg border border-white/[.09] bg-white/[.035] p-3 text-xs leading-5 outline-none focus:border-primary/50"/>
            </Field>}

            {selected.type === "button" && <Field label="Link"><div className="relative"><Link2 className="absolute left-3 top-2.5 size-3.5 text-zinc-600"/><TextInput value={selected.href || ""} onChange={(event) => updateElement(selected.id, (element) => ({ ...element, href:event.target.value }))} className="pl-9"/></div></Field>}

            {selected.type === "image" && <>
              <Field label="Imagem / design">
                <label className="flex h-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/[.12] bg-white/[.025] text-[11px] text-zinc-500 transition hover:border-primary/40 hover:text-white">
                  <span className="flex items-center gap-2"><Upload className="size-4 text-primary"/>Escolher arquivo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => { const file=event.target.files?.[0]; if(file) void importImage(file); event.currentTarget.value="" }}/>
                </label>
              </Field>
              <Field label="URL da imagem"><TextInput value={selected.src?.startsWith("data:") ? "" : selected.src || ""} placeholder="https://..." onChange={(event) => updateElement(selected.id, (element) => ({ ...element, src:event.target.value }))}/></Field>
              <Field label="Ajuste">
                <select value={selected.fit || "cover"} onChange={(event) => updateElement(selected.id, (element) => ({ ...element, fit:event.target.value as PageElement["fit"] }))} className="h-9 w-full rounded-lg border border-white/[.09] bg-[#111] px-3 text-xs">
                  <option value="cover">Preencher</option><option value="contain">Conter</option><option value="fill">Esticar</option>
                </select>
              </Field>
            </>}

            <div className="grid grid-cols-2 gap-2">
              {(["x","y","w","h"] as const).map((key) => <Field key={key} label={key.toUpperCase()}><NumberInput value={selectedState?.rect[key] ?? 0} onChange={(event) => updateRect(selected.id, { [key]:Number(event.target.value) })}/></Field>)}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(selected.type === "text" || selected.type === "button") && <>
                <Field label="Tamanho"><NumberInput min={8} max={180} value={selected.style.fontSize || 16} onChange={(event) => updateElement(selected.id, (element) => ({ ...element, style:{ ...element.style, fontSize:Number(event.target.value) } }))}/></Field>
                <Field label="Peso"><NumberInput min={100} max={900} step={100} value={selected.style.fontWeight || 400} onChange={(event) => updateElement(selected.id, (element) => ({ ...element, style:{ ...element.style, fontWeight:Number(event.target.value) } }))}/></Field>
              </>}
              <Field label="Raio"><NumberInput min={0} max={999} value={selected.style.borderRadius || 0} onChange={(event) => updateElement(selected.id, (element) => ({ ...element, style:{ ...element.style, borderRadius:Number(event.target.value) } }))}/></Field>
              <Field label="Camada Z"><NumberInput min={0} max={999} value={selected.style.zIndex || 1} onChange={(event) => updateElement(selected.id, (element) => ({ ...element, style:{ ...element.style, zIndex:Number(event.target.value) } }))}/></Field>
            </div>

            {(selected.type === "text" || selected.type === "button") && <div className="grid grid-cols-2 gap-2">
              <Field label="Fonte">
                <select value={selected.style.fontFamily || "manrope"} onChange={(event) => updateElement(selected.id, (element) => ({ ...element, style:{ ...element.style, fontFamily:event.target.value as "manrope"|"playfair" } }))} className="h-9 w-full rounded-lg border border-white/[.09] bg-[#111] px-3 text-xs">
                  <option value="manrope">Manrope</option><option value="playfair">Playfair Display</option>
                </select>
              </Field>
              <Field label="Alinhamento">
                <div className="grid grid-cols-3 gap-1">
                  {([["left",AlignLeft],["center",AlignCenter],["right",AlignRight]] as const).map(([value,Icon]) => <button key={value} onClick={() => updateElement(selected.id, (element) => ({ ...element, style:{ ...element.style, textAlign:value } }))} className={cn("grid h-9 place-items-center rounded-lg border", selected.style.textAlign === value ? "border-primary/50 bg-primary/10 text-primary" : "border-white/[.08] text-zinc-600")}><Icon className="size-3.5"/></button>)}
                </div>
              </Field>
            </div>}

            <div className="grid grid-cols-2 gap-2">
              <Field label="Cor"><div className="flex gap-2"><input type="color" value={selected.style.color || "#ffffff"} onChange={(event) => updateElement(selected.id, (element) => ({ ...element, style:{ ...element.style, color:event.target.value } }))} className="h-9 w-full rounded border border-white/10 bg-transparent"/></div></Field>
              <Field label="Fundo"><div className="flex gap-2"><input type="color" value={(selected.style.background && selected.style.background.startsWith("#")) ? selected.style.background : "#000000"} onChange={(event) => updateElement(selected.id, (element) => ({ ...element, style:{ ...element.style, background:event.target.value } }))} className="h-9 w-full rounded border border-white/10 bg-transparent"/></div></Field>
            </div>

            <Field label="Visibilidade neste dispositivo">
              <button onClick={() => updateElement(selected.id, (element) => { element.states[device].hidden = !element.states[device].hidden; return element })} className="flex h-9 w-full items-center justify-between rounded-lg border border-white/[.09] bg-white/[.025] px-3 text-xs text-zinc-400">
                {selectedState?.hidden ? "Oculto" : "Visível"}{selectedState?.hidden ? <EyeOff className="size-3.5"/> : <Eye className="size-3.5 text-primary"/>}
              </button>
            </Field>

            <div className="rounded-xl border border-white/[.08] bg-white/[.02] p-3">
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-[.13em] text-zinc-600">Copiar posição</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(DEVICE_META) as PageBreakpoint[]).filter((bp) => bp !== device).map((bp) => <ToolButton key={bp} onClick={() => copyCurrentTo(bp)} className="px-2"><Copy className="size-3"/>{DEVICE_META[bp].label}</ToolButton>)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-white/[.08] pt-4">
              <ToolButton onClick={duplicateSelected}><Copy className="size-3.5"/>Duplicar</ToolButton>
              <ToolButton onClick={deleteSelected} className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"><Trash2 className="size-3.5"/>Excluir</ToolButton>
            </div>
          </div>}
        </div>
      </aside>}
    </div>
  </div>
}