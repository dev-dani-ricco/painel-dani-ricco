"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { diagnosticQuestions, pillarLabels, type DiagnosticAnswers } from "@/lib/diagnostic"

export function TestExperience({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const storageKey = `impar-diagnostico:${sessionId}`
  const [index, setIndex] = React.useState(0)
  const [answers, setAnswers] = React.useState<DiagnosticAnswers>({})
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")
  const hydrated = React.useRef(false)

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(storageKey)
        if (saved) {
          const parsed = JSON.parse(saved) as { answers?: DiagnosticAnswers; index?: number }
          if (parsed.answers) setAnswers(parsed.answers)
          if (typeof parsed.index === "number") setIndex(Math.min(Math.max(parsed.index, 0), diagnosticQuestions.length - 1))
        }
      } catch {}
      hydrated.current = true
    })
    return () => window.cancelAnimationFrame(frame)
  }, [storageKey])

  React.useEffect(() => {
    if (!hydrated.current) return
    window.localStorage.setItem(storageKey, JSON.stringify({ answers, index }))
  }, [answers, index, storageKey])

  const question = diagnosticQuestions[index]
  const selected = answers[question.id]
  const progress = ((index + 1) / diagnosticQuestions.length) * 100

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key >= "1" && event.key <= "4") {
        const option = question.options[Number(event.key) - 1]
        if (option) setAnswers((current) => ({ ...current, [question.id]: option.id }))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [question])

  async function next() {
    if (!selected) return
    if (index < diagnosticQuestions.length - 1) {
      setIndex((value) => value + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const response = await fetch("/api/diagnostico/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers }),
      })
      const payload = await response.json() as { redirect?: string; error?: string }
      if (!response.ok || !payload.redirect) throw new Error(payload.error || "Não foi possível concluir")
      window.localStorage.removeItem(storageKey)
      router.push(payload.redirect)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir o diagnóstico")
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-4xl flex-col px-5 py-8 sm:px-8 sm:py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#792540]">Pilar {pillarLabels[question.pillar]}</p>
          <p className="mt-1 text-xs text-[#9a858b]">Pergunta {index + 1} de {diagnosticQuestions.length}</p>
        </div>
        <span className="impar-serif text-2xl text-[#6c2137]">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#e8dddf]">
        <div className="h-full rounded-full bg-[#702038] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <section className="my-auto py-10 sm:py-16">
        <h1 className="impar-serif max-w-3xl text-3xl leading-[1.12] text-[#2e171e] sm:text-5xl">{question.prompt}</h1>
        <p className="mt-4 text-sm text-[#8c777d]">Escolha a alternativa que mais se aproxima do seu comportamento natural — não daquilo que você acredita que deveria responder.</p>
        <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2">
          {question.options.map((option, optionIndex) => {
            const active = selected === option.id
            return (
              <button key={option.id} onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))} className={`group flex min-h-24 items-center gap-4 rounded-2xl border p-5 text-left transition ${active ? "border-[#72213a] bg-[#72213a] text-white shadow-[0_20px_50px_rgba(104,27,49,.18)]" : "border-[#d8cbce] bg-white/75 text-[#443137] hover:border-[#9f7380] hover:bg-white"}`}>
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${active ? "border-white/35 bg-white/10" : "border-[#d7c9cd] text-[#917780]"}`}>
                  {active ? <Check className="size-4" /> : optionIndex + 1}
                </span>
                <span className="text-sm font-medium leading-6">{option.label}</span>
              </button>
            )
          })}
        </div>
        {error && <p className="mt-5 rounded-xl bg-[#8b1738]/8 px-4 py-3 text-sm text-[#8b1738]">{error}</p>}
      </section>

      <div className="flex items-center justify-between border-t border-[#6d2136]/10 pt-6">
        <button disabled={index === 0 || submitting} onClick={() => setIndex((value) => Math.max(0, value - 1))} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-[#876f76] disabled:opacity-30">
          <ArrowLeft className="size-4" /> Voltar
        </button>
        <button disabled={!selected || submitting} onClick={next} className="flex h-12 items-center gap-3 rounded-full bg-[#681b31] px-6 text-xs font-bold uppercase tracking-[.13em] text-white transition hover:bg-[#501326] disabled:opacity-40">
          {submitting ? <><LoaderCircle className="size-4 animate-spin" /> Calculando</> : <>{index === diagnosticQuestions.length - 1 ? "Ver meu resultado" : "Continuar"}<ArrowRight className="size-4" /></>}
        </button>
      </div>
    </main>
  )
}