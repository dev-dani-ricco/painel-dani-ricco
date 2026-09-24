"use client"

import * as React from "react"
import {
  AudioLines, BrainCircuit, Database, FileText, Image as ImageIcon,
  LoaderCircle, Mic, MicOff, Send, ShieldCheck, Upload,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type KnowledgeProject = {
  id: string
  slug: string
  name: string
  description: string | null
}

type KnowledgeSource = {
  id: string
  project_id: string
  kind: "note" | "file" | "audio" | "image"
  title: string
  original_filename: string | null
  mime_type: string | null
  size_bytes: number | null
  storage_path: string | null
  status: string
  extracted_text: string | null
  created_at: string
}

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Array<{ marker: string; title: string; excerpt: string }>
}

function sourceIcon(kind: KnowledgeSource["kind"]) {
  if (kind === "audio") return AudioLines
  if (kind === "image") return ImageIcon
  if (kind === "note") return BrainCircuit
  return FileText
}

function formatBytes(value: number | null) {
  if (!value) return "texto"
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

export function IntelligencePage() {
  const [projects, setProjects] = React.useState<KnowledgeProject[]>([])
  const [projectId, setProjectId] = React.useState("")
  const [sources, setSources] = React.useState<KnowledgeSource[]>([])
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [message, setMessage] = React.useState("")
  const [note, setNote] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [sending, setSending] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [notice, setNotice] = React.useState("")
  const [recording, setRecording] = React.useState(false)
  const recorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const loadSources = React.useCallback(async (selected: string) => {
    if (!selected) return
    const response = await fetch(`/api/knowledge/sources?projectId=${encodeURIComponent(selected)}`, { cache: "no-store" })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || "Falha ao carregar fontes")
    setSources(body.sources)
  }, [])

  React.useEffect(() => {
    let active = true
    async function load() {
      try {
        const response = await fetch("/api/knowledge/projects", { cache: "no-store" })
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || "Falha ao carregar projetos")
        if (!active) return
        setProjects(body.projects)
        const initial = body.projects[0]?.id || ""
        setProjectId(initial)
        if (initial) await loadSources(initial)
      } catch (error) {
        if (active) setNotice(error instanceof Error ? error.message : "Falha ao conectar ao conhecimento")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [loadSources])

  async function selectProject(value: string) {
    setProjectId(value)
    setMessages([])
    setNotice("")
    try {
      await loadSources(value)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao carregar fontes")
    }
  }

  async function uploadFile(file: File) {
    if (!projectId) return
    setUploading(true)
    setNotice("")
    try {
      const form = new FormData()
      form.set("projectId", projectId)
      form.set("file", file)
      const response = await fetch("/api/knowledge/sources", { method: "POST", body: form })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Falha no upload")
      await loadSources(projectId)
      const warning = body.processing?.warning
      setNotice(warning
        ? `Arquivo preservado. Processamento pendente: ${warning}`
        : `${file.name} entrou na base com sucesso.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha no upload")
    } finally {
      setUploading(false)
    }
  }

  async function saveNote() {
    if (!projectId || !note.trim()) return
    setUploading(true)
    setNotice("")
    try {
      const response = await fetch("/api/knowledge/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: note.trim().slice(0, 72),
          content: note.trim(),
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Falha ao salvar nota")
      setNote("")
      await loadSources(projectId)
      setNotice("Nota adicionada ao conhecimento autorizado.")
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao salvar nota")
    } finally {
      setUploading(false)
    }
  }

  async function sendMessage() {
    const content = message.trim()
    if (!projectId || !content || sending) return
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content }
    setMessages((current) => [...current, userMessage])
    setMessage("")
    setSending(true)
    setNotice("")
    try {
      const response = await fetch("/api/knowledge/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: content }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Falha na consulta")
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: body.answer,
        sources: body.sources,
      }])
      if (!body.aiConfigured) setNotice("A busca está ativa; configure OPENAI_API_KEY para respostas generativas.")
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha na consulta")
    } finally {
      setSending(false)
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop()
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice("Gravação de áudio não está disponível neste navegador.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
        stream.getTracks().forEach((track) => track.stop())
        setRecording(false)
        if (blob.size) {
          const file = new File([blob], `audio-${Date.now()}.webm`, { type: blob.type })
          void uploadFile(file)
        }
      }
      recorder.start()
      setRecording(true)
      setNotice("Gravando áudio… clique novamente para concluir.")
    } catch {
      setNotice("Não foi possível acessar o microfone.")
    }
  }
  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><LoaderCircle className="size-6 animate-spin text-primary" /></div>
  }

  const selectedProject = projects.find((item) => item.id === projectId)

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/[.07] text-primary">DANI KNOWLEDGE</Badge>
          <Badge variant="outline" className="border-white/10 text-zinc-500"><ShieldCheck className="size-3"/> domínio isolado</Badge>
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Central de Inteligência</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Alimente a base da Dani com texto, arquivos, imagens e áudio. Cada fonte permanece vinculada ao projeto escolhido e mantém sua origem.
        </p>
      </div>
      <div className="w-full xl:w-[360px]">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-600">Escopo de conhecimento</p>
        <Select value={projectId} onValueChange={selectProject}>
          <SelectTrigger className="h-11 border-white/10 bg-white/[.03]"><SelectValue placeholder="Selecione um projeto"/></SelectTrigger>
          <SelectContent>{projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>

    {notice && <div className="rounded-xl border border-primary/20 bg-primary/[.05] px-4 py-3 text-xs text-zinc-300">{notice}</div>}

    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,.55fr)]">
      <Card className="border-white/[.08] bg-card/70">
        <CardHeader className="border-b border-white/[.06]">
          <CardTitle className="flex items-center gap-2 text-base"><BrainCircuit className="size-4 text-primary"/> Conversar com a base</CardTitle>
          <CardDescription>{selectedProject?.description || "Conhecimento autorizado do projeto selecionado."}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="min-h-[390px] space-y-4 p-5">
            {!messages.length && <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[.07]"><BrainCircuit className="size-5 text-primary"/></div>
              <p className="mt-4 text-sm font-medium">A base está pronta para receber contexto.</p>
              <p className="mt-1 max-w-md text-xs leading-5 text-zinc-600">Pergunte, envie referências ou registre informações. A resposta utiliza somente o escopo selecionado.</p>
            </div>}
            {messages.map((item) => <div key={item.id} className={item.role === "user" ? "ml-auto max-w-[82%]" : "mr-auto max-w-[88%]"}>
              <div className={item.role === "user"
                ? "rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-black"
                : "rounded-2xl rounded-bl-md border border-white/[.08] bg-white/[.035] px-4 py-3 text-sm leading-6 text-zinc-200"}>
                <div className="whitespace-pre-wrap">{item.content}</div>
              </div>
              {item.sources?.length ? <div className="mt-2 flex flex-wrap gap-1.5">
                {item.sources.slice(0, 5).map((source) => <Badge key={source.marker} variant="outline" className="border-white/10 text-[9px] text-zinc-500">{source.marker} · {source.title}</Badge>)}
              </div> : null}
            </div>)}
            {sending && <div className="flex items-center gap-2 text-xs text-zinc-500"><LoaderCircle className="size-4 animate-spin"/> Consultando conhecimento…</div>}
          </div>

          <div className="border-t border-white/[.06] p-4">
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  void sendMessage()
                }
              }}
              placeholder="Pergunte ou envie uma instrução contextual…"
              className="min-h-24 resize-none border-white/10 bg-white/[.025]"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.json,image/*,audio/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void uploadFile(file)
                  event.currentTarget.value = ""
                }}
              />
              <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}><Upload/> Arquivo</Button>
              <Button variant="outline" size="sm" disabled={uploading} onClick={() => void toggleRecording()}>
                {recording ? <MicOff className="text-primary"/> : <Mic/>}
                {recording ? "Encerrar áudio" : "Áudio"}
              </Button>
              <div className="ml-auto">
                <Button size="sm" className="bg-primary text-black hover:bg-primary/90" disabled={!message.trim() || sending} onClick={() => void sendMessage()}>
                  {sending ? <LoaderCircle className="animate-spin"/> : <Send/>} Enviar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-white/[.08] bg-card/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><Database className="size-4 text-primary"/> Adicionar conhecimento</CardTitle>
            <CardDescription>Registre contexto textual diretamente na base.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Cole uma informação, decisão, referência, insight ou briefing…" className="min-h-32 resize-none border-white/10 bg-white/[.025]"/>
            <Button className="mt-3 w-full bg-primary text-black hover:bg-primary/90" disabled={!note.trim() || uploading} onClick={() => void saveNote()}>
              {uploading ? <LoaderCircle className="animate-spin"/> : <BrainCircuit/>} Salvar na base
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/[.08] bg-card/70">
          <CardHeader>
            <CardTitle className="text-sm">Fontes recentes</CardTitle>
            <CardDescription>{sources.length} itens no escopo selecionado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!sources.length && <p className="py-6 text-center text-xs text-zinc-600">Nenhuma fonte adicionada ainda.</p>}
            {sources.slice(0, 12).map((source) => {
              const Icon = sourceIcon(source.kind)
              return <div key={source.id} className="flex items-start gap-3 rounded-xl border border-white/[.06] bg-white/[.025] p-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[.04]"><Icon className="size-4 text-zinc-500"/></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-zinc-300">{source.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-[9px] uppercase tracking-wide text-zinc-600">
                    <span>{source.kind}</span><span>·</span><span>{formatBytes(source.size_bytes)}</span>
                  </div>
                </div>
                <Badge variant="outline" className={source.status === "ready" ? "border-primary/20 text-[9px] text-primary" : "border-white/10 text-[9px] text-zinc-500"}>{source.status}</Badge>
              </div>
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
}
