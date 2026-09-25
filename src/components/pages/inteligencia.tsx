"use client"

import Image from "next/image"
import * as React from "react"
import {
  AudioLines, BrainCircuit, CheckCircle2, FileText, Image as ImageIcon,
  LoaderCircle, Mic, MicOff, Paperclip, RefreshCw, Send, Sparkles, Tags, Trash2, Upload,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { PwaInstallButton } from "@/components/pwa-install-button"
import {
  MemoryAuditPanel,
  MemoryDeleteDialog,
  type DeletableMemory,
} from "@/components/memory-governance"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: {
    resultIndex: number
    results: ArrayLike<{
      isFinal: boolean
      0: { transcript: string }
    }>
  }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

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
  const [engine, setEngine] = React.useState("fallback")
  const [recording, setRecording] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<DeletableMemory | null>(null)
  const [auditRefresh, setAuditRefresh] = React.useState(0)
  const recorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])
  const speechRecognitionRef = React.useRef<SpeechRecognitionLike | null>(null)
  const speechTranscriptRef = React.useRef("")
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const chatEndRef = React.useRef<HTMLDivElement | null>(null)

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

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [messages, sending])

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
      if (!response.ok) throw new Error(body.error || "Falha ao conversar com a Dani IA")
      setEngine(body.engine || "fallback")
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: body.answer,
        sources: body.sources,
      }])
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao conversar com a Dani IA")
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
      setNotice("Memória incorporada e classificada automaticamente.")
      await loadPulse(promptOffset)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao registrar memória")
    } finally {
      setSaving(false)
    }
  }

  async function uploadFile(file: File) {
    setUploading(true)
    setNotice(file.type.startsWith("audio/") ? "Recebendo e transcrevendo o áudio…" : "Processando " + file.name + "…")
    try {
      const form = new FormData()
      form.set("file", file)
      const response = await fetch("/api/knowledge/sources", { method: "POST", body: form })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Falha no envio")
      await loadPulse(promptOffset)

      if (file.type.startsWith("audio/") && body.processing?.status === "ready") {
        setNotice("Áudio transcrito e incorporado ao clone com sucesso.")
      } else if (body.processing?.warning === "AI_GATEWAY_BILLING_REQUIRED") {
        setNotice(
          "Áudio recebido, mas a transcrição de arquivo está pendente porque o AI Gateway da Vercel ainda exige liberação de cobrança. Gravações ao vivo usam a transcrição do navegador quando disponível.",
        )
      } else if (body.processing?.warning) {
        setNotice("Conteúdo recebido. Parte do processamento inteligente ficou pendente.")
      } else {
        setNotice(file.name + " foi incorporado ao clone.")
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha no envio")
    } finally {
      setUploading(false)
    }
  }

  async function saveBrowserAudioTranscript(transcript: string) {
    const content = transcript.trim()
    if (!content) return false

    setUploading(true)
    setNotice("Transcrição capturada. Incorporando ao clone…")
    try {
      const response = await fetch("/api/knowledge/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "audio",
          sourceMode: "browser-audio-transcript",
          title: "Áudio · " + new Date().toLocaleString("pt-BR"),
          content,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Falha ao salvar transcrição.")
      await loadPulse(promptOffset)
      setNotice("Áudio transcrito no navegador e incorporado ao clone com sucesso.")
      return true
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao salvar transcrição.")
      return false
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
      setNotice("Resposta incorporada. O clone atualizou este aspecto da Dani.")
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
      speechRecognitionRef.current?.stop()
      recorderRef.current?.stop()
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setNotice("Este navegador não oferece gravação de áudio compatível.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      speechTranscriptRef.current = ""

      const speechWindow = window as typeof window & {
        SpeechRecognition?: SpeechRecognitionConstructor
        webkitSpeechRecognition?: SpeechRecognitionConstructor
      }
      const SpeechRecognitionApi =
        speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition

      let recognition: SpeechRecognitionLike | null = null
      if (SpeechRecognitionApi) {
        recognition = new SpeechRecognitionApi()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "pt-BR"
        recognition.onresult = (event) => {
          let finalText = ""
          for (let index = event.resultIndex; index < event.results.length; index += 1) {
            const result = event.results[index]
            if (result.isFinal) finalText += result[0]?.transcript || ""
          }
          if (finalText.trim()) {
            speechTranscriptRef.current +=
              (speechTranscriptRef.current ? " " : "") + finalText.trim()
          }
        }
        recognition.onerror = (event) => {
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            speechRecognitionRef.current = null
          }
        }
        recognition.onend = () => {
          if (recorderRef.current?.state === "recording") {
            try {
              recognition?.start()
            } catch {
              // Browser may reject immediate restarts; the audio file remains the fallback.
            }
          }
        }
        try {
          recognition.start()
          speechRecognitionRef.current = recognition
        } catch {
          speechRecognitionRef.current = null
        }
      }

      const preferred = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined)
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data)
      }
      recorder.onerror = () => {
        speechRecognitionRef.current?.abort()
        speechRecognitionRef.current = null
        stream.getTracks().forEach((track) => track.stop())
        setRecording(false)
        setNotice("A gravação foi interrompida pelo navegador. Tente novamente.")
      }
      recorder.onstop = () => {
        speechRecognitionRef.current?.stop()
        speechRecognitionRef.current = null

        const mimeType = recorder.mimeType || preferred || "audio/webm"
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const browserTranscript = speechTranscriptRef.current.trim()
        stream.getTracks().forEach((track) => track.stop())
        setRecording(false)

        if (browserTranscript) {
          void saveBrowserAudioTranscript(browserTranscript)
          return
        }

        if (!blob.size) {
          setNotice("Nenhum áudio foi capturado.")
          return
        }

        const extension = mimeType.includes("mp4") ? "m4a" : "webm"
        const file = new File(
          [blob],
          "memoria-dani-" + Date.now() + "." + extension,
          { type: mimeType },
        )
        setNotice(
          "O navegador não gerou transcrição local. Tentando o serviço de transcrição do servidor…",
        )
        void uploadFile(file)
      }

      recorder.start(1000)
      setRecording(true)
      setNotice(
        SpeechRecognitionApi
          ? "Gravando e transcrevendo ao vivo… toque no microfone novamente para concluir."
          : "Gravando… este navegador não oferece transcrição ao vivo; o servidor tentará processar ao concluir.",
      )
    } catch {
      setNotice("Não foi possível acessar o microfone. Verifique a permissão do navegador.")
    }
  }

  if (loading) {
    return <div className="flex min-h-[55vh] items-center justify-center"><DaniAvatar state="thinking" size="lg"/></div>
  }

  const stats = pulse?.stats
  const recent = pulse?.recent || []
  const canDeleteMemories = ["DANI", "TIBROKER"].includes(
    user?.username?.toUpperCase() || "",
  )

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[.07] bg-[#0b0b0b]">
      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/[.06] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <DaniAvatar state={recording ? "recording" : sending ? "thinking" : "idle"} size="sm"/>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-zinc-100">Dani IA</p>
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(255,106,0,.8)]"/>
            </div>
            <p className="truncate text-[10px] text-zinc-600">Clone inteligente · memória viva do ecossistema</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-white/[.07] bg-white/[.02] px-3 py-1.5 text-[9px] text-zinc-600 md:flex">
            <span>{stats?.totalMemories || 0} memórias</span>
            <span>·</span>
            <span>{stats?.coveragePercent || 0}% cobertura</span>
            <span>·</span>
            <span>{engine === "fallback" ? "memória" : "IA ativa"}</span>
          </div>
          <PwaInstallButton/>
        </div>
      </header>

      {notice && (
        <div className="border-b border-primary/10 bg-primary/[.035] px-4 py-2.5 text-center text-[11px] text-zinc-400">
          {notice}
        </div>
      )}

      <div className="grid min-h-[calc(100vh-180px)] xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="relative flex min-h-[680px] flex-col bg-[#0a0a0a]">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
              {!messages.length ? (
                <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
                  <DaniAvatar state={recording ? "recording" : sending ? "thinking" : "idle"} size="xl"/>
                  <p className="mt-7 text-[10px] font-semibold uppercase tracking-[.22em] text-primary">DANI IA</p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-[-.04em] text-zinc-100 sm:text-3xl">
                    O que você quer pensar com a Dani?
                  </h1>
                  <p className="mt-3 max-w-xl text-xs leading-5 text-zinc-600">
                    Pergunte, valide uma ideia, envie contexto ou peça uma análise. Quando o clone não tiver evidência suficiente, ele deve dizer o que ainda precisa aprender.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {[
                      "A Dani aprovaria esta ideia?",
                      "Como ela avaliaria esta decisão?",
                      "Isso está coerente com o IMPAR?",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setMessage(suggestion)}
                        className="rounded-full border border-white/[.08] bg-white/[.025] px-3 py-2 text-[10px] text-zinc-500 transition hover:border-primary/25 hover:text-zinc-300"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-7">
                  {messages.map((item) => (
                    <div key={item.id}>
                      {item.role === "user" ? (
                        <div className="ml-auto max-w-[82%] rounded-3xl rounded-br-lg bg-[#242424] px-4 py-3 text-sm leading-6 text-zinc-100">
                          <div className="whitespace-pre-wrap">{item.content}</div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <DaniAvatar state="idle" size="xs"/>
                          <div className="min-w-0 flex-1 pt-1 text-sm leading-7 text-zinc-200">
                            <div className="whitespace-pre-wrap">{item.content}</div>
                            {!!item.sources?.length && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {item.sources.slice(0, 6).map((source) => (
                                  <Badge key={source.marker} variant="outline" className="border-white/10 text-[9px] text-zinc-600">
                                    {source.marker} · {source.title}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {sending && (
                    <div className="flex items-center gap-3">
                      <DaniAvatar state="thinking" size="xs"/>
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="size-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-.2s]"/>
                        <span className="size-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-.1s]"/>
                        <span className="size-1.5 animate-bounce rounded-full bg-zinc-500"/>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef}/>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent px-3 pb-4 pt-8 sm:px-6">
            <div className="mx-auto w-full max-w-3xl rounded-[26px] border border-white/[.10] bg-[#171717] p-3 shadow-[0_18px_80px_rgba(0,0,0,.45)]">
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    void sendMessage()
                  }
                }}
                placeholder={recording ? "Gravando áudio para ensinar o clone…" : "Mensagem para a Dani IA"}
                className="min-h-14 max-h-40 resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0"
              />
              <div className="mt-1 flex items-center gap-1.5">
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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  title="Adicionar arquivo à memória do clone"
                  className="rounded-full text-zinc-500 hover:text-zinc-200"
                >
                  {uploading ? <LoaderCircle className="animate-spin"/> : <Paperclip/>}
                </Button>
                <Button
                  type="button"
                  variant={recording ? "default" : "ghost"}
                  size="icon-sm"
                  disabled={uploading}
                  onClick={() => void toggleRecording()}
                  title={recording ? "Encerrar gravação" : "Ensinar por áudio"}
                  className={recording ? "rounded-full shadow-[0_0_20px_rgba(255,106,0,.35)]" : "rounded-full text-zinc-500 hover:text-zinc-200"}
                >
                  {recording ? <MicOff/> : <Mic/>}
                </Button>
                {recording && (
                  <div className="ml-1 flex items-center gap-2 text-[10px] text-primary">
                    <span className="size-2 animate-pulse rounded-full bg-primary"/>
                    gravando
                  </div>
                )}
                <Button
                  size="icon-sm"
                  className="ml-auto rounded-full"
                  disabled={!message.trim() || sending}
                  onClick={() => void sendMessage()}
                  title="Enviar mensagem"
                >
                  {sending ? <LoaderCircle className="animate-spin"/> : <Send/>}
                </Button>
              </div>
            </div>
            <p className="mx-auto mt-2 max-w-3xl text-center text-[9px] text-zinc-700">
              A Dani IA pode errar. Decisões sensíveis continuam exigindo validação humana.
            </p>
          </div>
        </main>

        <aside className="border-t border-white/[.06] bg-[#0e0e0e] xl:border-l xl:border-t-0">
          <div className="max-h-[calc(100vh-180px)] space-y-0 overflow-y-auto">
            <section className="border-b border-white/[.06] p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary"/>
                <h2 className="text-sm font-semibold">Ensinar o clone</h2>
              </div>
              <p className="mt-1 text-[10px] leading-5 text-zinc-600">Registre contexto bruto. A classificação acontece por trás.</p>
              <Textarea
                value={memory}
                onChange={(event) => setMemory(event.target.value)}
                placeholder="Uma decisão, preferência, frase, regra, feedback, exceção ou caso real…"
                className="mt-4 min-h-28 resize-none border-white/10 bg-black/20 text-xs"
              />
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                  <Upload/> Arquivo
                </Button>
                <Button className="ml-auto" size="sm" disabled={!memory.trim() || saving} onClick={() => void saveMemory()}>
                  {saving ? <LoaderCircle className="animate-spin"/> : <CheckCircle2/>} Incorporar
                </Button>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-white/[.05] bg-black/20 p-3 text-[9px] leading-4 text-zinc-600">
                <Tags className="mt-0.5 size-3.5 shrink-0"/>
                Assunto, palavras-chave, tipo, profundidade, confiança e autoria são inferidos automaticamente.
              </div>
            </section>

            <section className="border-b border-white/[.06] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[.18em] text-primary">O clone quer entender melhor</p>
                  <h2 className="mt-2 text-sm font-semibold">{pulse?.prompt.domainLabel || "Contexto"}</h2>
                </div>
                <Badge variant="outline" className="border-primary/20 text-[8px] text-primary">1 pergunta</Badge>
              </div>
              <p className="mt-2 text-[10px] leading-5 text-zinc-600">{pulse?.prompt.reason}</p>
              <p className="mt-4 text-sm font-medium leading-6 text-zinc-200">{pulse?.prompt.question}</p>
              <Textarea
                value={promptAnswer}
                onChange={(event) => setPromptAnswer(event.target.value)}
                placeholder={"Responda do seu jeito, " + (user?.displayName?.split(" ")[0] || "time") + "…"}
                className="mt-4 min-h-24 resize-none border-white/10 bg-black/20 text-xs"
              />
              <div className="mt-3 flex items-center gap-2">
                <Select value={confidence} onValueChange={setConfidence}>
                  <SelectTrigger className="h-8 w-[132px] border-white/10 bg-black/20 text-[10px]">
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Convicção 10</SelectItem>
                    <SelectItem value="8">Convicção 8</SelectItem>
                    <SelectItem value="6">Depende · 6</SelectItem>
                    <SelectItem value="3">Em formação · 3</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="px-2 text-zinc-600" onClick={anotherPrompt} title="Outra pergunta">
                  <RefreshCw/>
                </Button>
                <Button className="ml-auto" size="sm" disabled={!promptAnswer.trim() || saving} onClick={() => void answerAdaptivePrompt()}>
                  {saving ? <LoaderCircle className="animate-spin"/> : <Sparkles/>} Ensinar
                </Button>
              </div>
            </section>

            <section className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-zinc-300">Memórias recentes</h2>
                <span className="text-[9px] text-zinc-700">{recent.length} visíveis</span>
              </div>
              <div className="mt-3 space-y-2">
                {!recent.length && <p className="py-6 text-center text-[10px] text-zinc-700">O clone ainda está vazio.</p>}
                {recent.slice(0, 6).map((source) => {
                  const Icon = sourceIcon(source.kind)
                  const metadata = source.metadata || {}
                  return (
                    <div key={source.id} className="rounded-xl border border-white/[.05] bg-white/[.018] p-3">
                      <div className="flex items-start gap-2.5">
                        <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/[.04]">
                          <Icon className="size-3.5 text-zinc-600"/>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-medium text-zinc-400">{source.title}</p>
                          <p className="mt-1 text-[8px] uppercase tracking-wide text-zinc-700">
                            {String(metadata.contributor || source.kind)} · {new Date(source.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        {canDeleteMemories && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({
                              id: source.id,
                              title: source.title,
                              kind: source.kind,
                              created_at: source.created_at,
                              metadata: source.metadata || {},
                            })}
                            className="grid size-7 shrink-0 place-items-center rounded-lg text-zinc-700 transition hover:bg-red-500/[.06] hover:text-red-400"
                            title="Apagar memória"
                          >
                            <Trash2 className="size-3.5"/>
                          </button>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {metadata.topicLabel ? <Chip>{String(metadata.topicLabel)}</Chip> : null}
                        {metadata.contentType ? <Chip>{label(metadata.contentType)}</Chip> : null}
                        {metadata.detailLevel ? <Chip>{label(metadata.detailLevel)}</Chip> : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
            {canDeleteMemories && <MemoryAuditPanel refreshToken={auditRefresh}/>}
          </div>
        </aside>
      </div>

      <MemoryDeleteDialog
        source={deleteTarget}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onDeleted={async () => {
          setDeleteTarget(null)
          setAuditRefresh((value) => value + 1)
          await loadPulse(promptOffset)
        }}
      />
    </div>
  )
}

function DaniAvatar({
  state,
  size,
}: {
  state: "idle" | "thinking" | "recording"
  size: "xs" | "sm" | "lg" | "xl"
}) {
  const sizes = {
    xs: "size-8",
    sm: "size-10",
    lg: "size-16",
    xl: "size-20",
  }
  const imageSizes = { xs: 32, sm: 40, lg: 64, xl: 80 }
  const active = state !== "idle"

  return (
    <div className={"relative shrink-0 " + sizes[size]}>
      {active && (
        <>
          <span className="absolute -inset-2 animate-ping rounded-full border border-primary/25"/>
          <span className="absolute -inset-1 animate-pulse rounded-full bg-primary/15 blur-md"/>
        </>
      )}
      <span className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-primary/80 via-primary/15 to-white/10"/>
      <Image
        src="/dani/profile-burgundy.png"
        alt="Avatar Dani Ricco"
        width={imageSizes[size]}
        height={imageSizes[size]}
        className="relative size-full rounded-full border-2 border-[#0b0b0b] object-cover"
        priority={size === "xl"}
      />
      <span className={
        "absolute bottom-0 right-0 rounded-full border-2 border-[#0b0b0b] " +
        (state === "recording" ? "size-3 bg-primary animate-pulse" : "size-2.5 bg-primary")
      }/>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-white/[.06] bg-black/20 px-1.5 py-0.5 text-[8px] text-zinc-600">
      {children}
    </span>
  )
}
