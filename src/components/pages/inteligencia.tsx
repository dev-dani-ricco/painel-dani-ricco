"use client"

import Image from "next/image"
import * as React from "react"
import {
  AudioLines, BrainCircuit, CheckCircle2, FileText, Image as ImageIcon,
  LoaderCircle, Mic, MicOff, RefreshCw, Send, Sparkles, Tags, Upload,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type CloneSource = {
  id: string
  project_id: string
  kind: "note" | "file" | "audio" | "image"
  title: string
  original_filename: string | null
  mime_type: string | null
  size_bytes: number | null
  status: string
  extracted_text: string | null
  metadata: Record<string, unknown>
  created_at: string
}

type ClonePrompt = {
  id: string
  domain: string
  domainLabel: string
  question: string
  reason: string
}

type Pulse = {
  prompt: ClonePrompt
  stats: {
    totalMemories: number
    coveredDomains: number
    totalDomains: number
    classified: number
    coveragePercent: number
    engine: string
  }
  recent: CloneSource[]
}

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Array<{ marker: string; title: string; excerpt: string }>
}

function sourceIcon(kind: CloneSource["kind"]) {
  if (kind === "audio") return AudioLines
  if (kind === "image") return ImageIcon
  if (kind === "note") return BrainCircuit
  return FileText
}

function label(value: unknown) {
  if (!value) return null
  const map: Record<string, string> = {
    principle: "Princípio",
    decision: "Decisão",
    preference: "Preferência",
    case: "Caso real",
    language: "Linguagem",
    process: "Processo",
    fact: "Fato",
    reference: "Referência",
    guardrail: "Guardrail",
    signal: "Sinal",
    context: "Contexto",
    deep: "Profundo",
  }
  return map[String(value)] || String(value)
}

export function IntelligencePage() {
  const { user } = useAuth()
  const [pulse, setPulse] = React.useState<Pulse | null>(null)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [message, setMessage] = React.useState("")
  const [memory, setMemory] = React.useState("")
  const [promptAnswer, setPromptAnswer] = React.useState("")
  const [confidence, setConfidence] = React.useState("7")
  const [promptOffset, setPromptOffset] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [sending, setSending] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [notice, setNotice] = React.useState("")
  const [engine, setEngine] = React.useState("vercel-gateway")
  const [recording, setRecording] = React.useState(false)
  const recorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const loadPulse = React.useCallback(async (offset = 0) => {
    const response = await fetch("/api/clone/pulse?offset=" + offset, { cache: "no-store" })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || "Falha ao carregar o clone")
    setPulse(body)
    setEngine(body.stats?.engine || "fallback")
  }, [])

  React.useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      void loadPulse().catch((error) => {
        if (active) setNotice(error instanceof Error ? error.message : "Falha ao carregar o clone")
      }).finally(() => {
        if (active) setLoading(false)
      })
    }, 0)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [loadPulse])

  async function sendMessage() {
    const content = message.trim()
    if (!content || sending) return
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content }])
    setMessage("")
    setSending(true)
    setNotice("")
    try {
      const response = await fetch("/api/knowledge/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Falha ao conversar com o clone")
      setEngine(body.engine || "fallback")
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: body.answer,
        sources: body.sources,
      }])
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao conversar com o clone")
    } finally {
      setSending(false)
    }
  }

  async function saveMemory() {
    const content = memory.trim()
    if (!content || saving) return
    setSaving(true)
    setNotice("")
    try {
      const response = await fetch("/api/knowledge/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Falha ao registrar memória")
      setMemory("")
      setNotice("Memória registrada e classificada automaticamente.")
      await loadPulse(promptOffset)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao registrar memória")
    } finally {
      setSaving(false)
    }
  }

  async function uploadFile(file: File) {
    setUploading(true)
    setNotice("")
    try {
      const form = new FormData()
      form.set("file", file)
      const response = await fetch("/api/knowledge/sources", { method: "POST", body: form })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Falha no envio")
      await loadPulse(promptOffset)
      const warning = body.processing?.warning
      setNotice(
        warning
          ? "Arquivo guardado. O processamento inteligente ficou pendente nesta execução."
          : file.name + " foi incorporado ao clone e classificado.",
      )
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha no envio")
    } finally {
      setUploading(false)
    }
  }

  async function answerAdaptivePrompt() {
    const answer = promptAnswer.trim()
    if (!pulse?.prompt || !answer || saving) return
    setSaving(true)
    setNotice("")
    try {
      const response = await fetch("/api/clone/pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: pulse.prompt.id,
          domain: pulse.prompt.domain,
          domainLabel: pulse.prompt.domainLabel,
          question: pulse.prompt.question,
          answer,
          confidence: Number(confidence),
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Falha ao ensinar o clone")
      setPromptAnswer("")
      setNotice("Resposta incorporada. O clone atualizou a cobertura deste tema.")
      setPromptOffset(0)
      await loadPulse(0)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao ensinar o clone")
    } finally {
      setSaving(false)
    }
  }

  function anotherPrompt() {
    const next = promptOffset + 1
    setPromptOffset(next)
    setPromptAnswer("")
    void loadPulse(next)
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
          const file = new File([blob], "memoria-audio-" + Date.now() + ".webm", { type: blob.type })
          void uploadFile(file)
        }
      }
      recorder.start()
      setRecording(true)
      setNotice("Gravando. Fale naturalmente; o áudio será transformado em memória do clone.")
    } catch {
      setNotice("Não foi possível acessar o microfone.")
    }
  }

  if (loading) {
    return <div className="flex min-h-[55vh] items-center justify-center"><LoaderCircle className="size-6 animate-spin text-primary"/></div>
  }

  const stats = pulse?.stats
  const recent = pulse?.recent || []

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-[#0d0d0d]">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_25%,rgba(255,106,0,.14),transparent_55%)]"/>
        <div className="relative grid gap-8 p-6 lg:grid-cols-[1fr_auto] lg:items-end lg:p-8">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 min-w-32 items-center rounded-xl border border-white/[.08] bg-black/30 px-4">
                <Image src="/dani/logo-branca.png" alt="Dani Ricco" width={122} height={34} className="h-auto w-[122px] object-contain"/>
              </div>
              <Badge className="border border-primary/20 bg-primary/[.08] text-primary hover:bg-primary/[.08]">
                <Sparkles className="size-3"/> CLONE ATIVO
              </Badge>
            </div>
            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[.22em] text-zinc-600">MEMÓRIA VIVA DO ECOSSISTEMA</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
              Ensine o que a Dani pensa. O clone aprende como ela decide.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
              Texto, arquivos, imagens, áudios, decisões e exemplos reais entram em uma única memória central, classificados automaticamente para alimentar a Dani IA em todo o ecossistema.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            <Metric value={String(stats?.totalMemories || 0)} label="memórias"/>
            <Metric value={(stats?.coveragePercent || 0) + "%"} label="cobertura"/>
            <Metric value={String(stats?.coveredDomains || 0) + "/" + String(stats?.totalDomains || 0)} label="temas"/>
            <Metric value={engine === "fallback" ? "MEM" : "IA"} label="motor"/>
          </div>
        </div>
      </section>

      {notice && (
        <div className="rounded-xl border border-primary/20 bg-primary/[.045] px-4 py-3 text-xs text-zinc-300">
          {notice}
        </div>
      )}

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(390px,.55fr)]">
        <Card className="min-h-[620px] border-white/[.08] bg-card/70">
          <CardHeader className="border-b border-white/[.06]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BrainCircuit className="size-4 text-primary"/> Conversar com a Dani IA
                </CardTitle>
                <CardDescription>Consulte critérios, repertório, decisões, linguagem e memória acumulada.</CardDescription>
              </div>
              <Badge variant="outline" className="border-white/10 text-[9px] text-zinc-500">
                memória compartilhada
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-[530px] flex-col p-0">
            <div className="flex-1 space-y-4 p-5">
              {!messages.length && (
                <div className="flex min-h-[330px] flex-col items-center justify-center text-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"/>
                    <div className="relative grid size-14 place-items-center rounded-2xl border border-primary/20 bg-primary/[.06]">
                      <BrainCircuit className="size-6 text-primary"/>
                    </div>
                  </div>
                  <p className="mt-5 text-base font-medium">Pergunte como se a Dani estivesse na sala.</p>
                  <p className="mt-2 max-w-lg text-xs leading-5 text-zinc-600">
                    O clone separa o que já aprendeu, o que é inferência e o que ainda precisa ser validado pela Dani real.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {[
                      "Isso combina com a Dani?",
                      "Ela aprovaria este posicionamento?",
                      "Quais critérios pesam nessa decisão?",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setMessage(suggestion)}
                        className="rounded-full border border-white/[.08] bg-white/[.025] px-3 py-1.5 text-[10px] text-zinc-500 transition hover:border-primary/20 hover:text-zinc-300"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((item) => (
                <div key={item.id} className={item.role === "user" ? "ml-auto max-w-[82%]" : "mr-auto max-w-[90%]"}>
                  <div className={
                    item.role === "user"
                      ? "rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-black"
                      : "rounded-2xl rounded-bl-md border border-white/[.08] bg-white/[.035] px-4 py-3 text-sm leading-6 text-zinc-200"
                  }>
                    <div className="whitespace-pre-wrap">{item.content}</div>
                  </div>
                  {!!item.sources?.length && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.sources.slice(0, 5).map((source) => (
                        <Badge key={source.marker} variant="outline" className="border-white/10 text-[9px] text-zinc-500">
                          {source.marker} · {source.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <LoaderCircle className="size-4 animate-spin"/> Dani IA está pensando…
                </div>
              )}
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
                placeholder="Pergunte, valide uma ideia ou peça uma análise…"
                className="min-h-24 resize-none border-white/10 bg-white/[.025]"
              />
              <div className="mt-3 flex justify-end">
                <Button size="sm" disabled={!message.trim() || sending} onClick={() => void sendMessage()}>
                  {sending ? <LoaderCircle className="animate-spin"/> : <Send/>} Enviar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/[.08] bg-card/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm"><Sparkles className="size-4 text-primary"/> Ensinar o clone</CardTitle>
              <CardDescription>Jogue contexto bruto. A classificação acontece por trás.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={memory}
                onChange={(event) => setMemory(event.target.value)}
                placeholder="Uma decisão, opinião, preferência, frase, regra, feedback, caso real, exceção…"
                className="min-h-32 resize-none border-white/10 bg-white/[.025]"
              />
              <div className="mt-3 flex flex-wrap gap-2">
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
                <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                  <Upload/> Arquivo
                </Button>
                <Button variant="outline" size="sm" disabled={uploading} onClick={() => void toggleRecording()}>
                  {recording ? <MicOff className="text-primary"/> : <Mic/>}
                  {recording ? "Encerrar" : "Áudio"}
                </Button>
                <Button className="ml-auto" size="sm" disabled={!memory.trim() || saving} onClick={() => void saveMemory()}>
                  {saving ? <LoaderCircle className="animate-spin"/> : <CheckCircle2/>} Incorporar
                </Button>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-white/[.06] bg-black/20 p-3 text-[10px] leading-5 text-zinc-600">
                <Tags className="mt-0.5 size-3.5 shrink-0"/>
                O clone identifica assunto, palavras-chave, termos, tipo de memória, profundidade e confiança. Você não precisa escolher “onde guardar”.
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-primary/15 bg-[linear-gradient(145deg,rgba(255,106,0,.06),rgba(255,255,255,.015))]">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[.18em] text-primary">O CLONE QUER ENTENDER MELHOR</p>
                  <CardTitle className="mt-2 text-base">{pulse?.prompt.domainLabel || "Contexto"}</CardTitle>
                </div>
                <Badge variant="outline" className="border-primary/20 text-[9px] text-primary">1 pergunta</Badge>
              </div>
              <CardDescription>{pulse?.prompt.reason}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium leading-6 text-zinc-200">{pulse?.prompt.question}</p>
              <Textarea
                value={promptAnswer}
                onChange={(event) => setPromptAnswer(event.target.value)}
                placeholder={"Responda do seu jeito, " + (user?.displayName?.split(" ")[0] || "time") + "…"}
                className="mt-4 min-h-28 resize-none border-white/10 bg-black/20"
              />
              <div className="mt-3 flex items-center gap-2">
                <Select value={confidence} onValueChange={setConfidence}>
                  <SelectTrigger className="h-9 w-[150px] border-white/10 bg-black/20 text-xs">
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Convicção 10</SelectItem>
                    <SelectItem value="8">Convicção 8</SelectItem>
                    <SelectItem value="6">Depende · 6</SelectItem>
                    <SelectItem value="3">Em formação · 3</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="text-zinc-500" onClick={anotherPrompt}>
                  <RefreshCw/> Outra
                </Button>
                <Button className="ml-auto" size="sm" disabled={!promptAnswer.trim() || saving} onClick={() => void answerAdaptivePrompt()}>
                  {saving ? <LoaderCircle className="animate-spin"/> : <Sparkles/>} Ensinar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-white/[.08] bg-card/70">
        <CardHeader className="border-b border-white/[.06]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm">Memórias recentes</CardTitle>
              <CardDescription>O que entrou no clone e como foi classificado.</CardDescription>
            </div>
            <Badge variant="outline" className="border-white/10 text-[9px] text-zinc-500">
              classificação automática
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {!recent.length && (
            <div className="col-span-full py-10 text-center text-xs text-zinc-600">
              O clone ainda está vazio. Comece ensinando uma decisão, um áudio ou um exemplo real.
            </div>
          )}
          {recent.map((source) => {
            const Icon = sourceIcon(source.kind)
            const metadata = source.metadata || {}
            const keywords = Array.isArray(metadata.keywords) ? metadata.keywords.slice(0, 4).map(String) : []
            return (
              <div key={source.id} className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
                <div className="flex items-start gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[.04]">
                    <Icon className="size-4 text-zinc-500"/>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-zinc-300">{source.title}</p>
                    <p className="mt-1 text-[9px] uppercase tracking-wide text-zinc-600">
                      {String(metadata.contributor || source.kind)} · {new Date(source.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {metadata.topicLabel ? <Chip>{String(metadata.topicLabel)}</Chip> : null}
                  {metadata.contentType ? <Chip>{label(metadata.contentType)}</Chip> : null}
                  {metadata.detailLevel ? <Chip>{label(metadata.detailLevel)}</Chip> : null}
                  {metadata.confidence ? <Chip>{"conf. " + String(metadata.confidence)}</Chip> : null}
                </div>
                {!!keywords.length && (
                  <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[9px] text-zinc-600">
                    {keywords.map((keyword) => <span key={keyword}>#{keyword}</span>)}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ value, label: metricLabel }: { value: string; label: string }) {
  return (
    <div className="min-w-28 rounded-xl border border-white/[.07] bg-black/25 px-4 py-3">
      <p className="text-xl font-semibold tracking-tight text-zinc-100">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-[.14em] text-zinc-600">{metricLabel}</p>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-white/[.07] bg-black/20 px-2 py-1 text-[9px] text-zinc-500">
      {children}
    </span>
  )
}
