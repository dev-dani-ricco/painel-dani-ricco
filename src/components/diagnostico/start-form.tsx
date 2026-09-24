"use client"

import * as React from "react"
import { ArrowRight, Check, LoaderCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export function DiagnosticStartForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [consent, setConsent] = React.useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setError("")
    setLoading(true)
    const form = new FormData(event.currentTarget)
    const utm = Object.fromEntries(
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
        .map((key) => [key, searchParams.get(key) ?? ""])
        .filter(([, value]) => value),
    )
    try {
      const response = await fetch("/api/diagnostico/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          whatsapp: form.get("whatsapp"),
          profession: form.get("profession"),
          consent,
          source: "diagnostico-impar",
          utm,
        }),
      })
      const payload = await response.json() as { sessionId?: string; error?: string }
      if (!response.ok || !payload.sessionId) throw new Error(payload.error || "Não foi possível iniciar")
      window.localStorage.setItem(`impar-diagnostico:${payload.sessionId}`, JSON.stringify({ answers: {}, index: 0 }))
      router.push(`/diagnostico/teste?session=${encodeURIComponent(payload.sessionId)}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar o diagnóstico")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="relative border border-[#2a201e]/14 bg-[#fbf8f4] p-6 shadow-[0_24px_70px_rgba(47,24,29,.08)] sm:p-9">
      <div className="mb-8 border-b border-[#2a201e]/12 pb-7">
        <div className="flex items-center justify-between"><p className="text-[9px] font-bold uppercase tracking-[.25em] text-[#7b2940]">Seu diagnóstico começa aqui</p><span className="impar-serif text-3xl text-[#b69a92]">01</span></div>
        <h2 className="impar-serif mt-4 text-4xl leading-[1.04] text-[#2b191d]">Antes das perguntas, conte um pouco sobre você.</h2>
        <p className="mt-3 text-sm leading-6 text-[#78656a]">Usaremos esses dados apenas para identificar e entregar seu resultado.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[.14em] text-[#5d454c]">Nome</span>
          <input required name="name" autoComplete="name" placeholder="Como você gostaria de ser chamada?" className="impar-input" />
        </label>
        <label>
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[.14em] text-[#5d454c]">E-mail</span>
          <input required type="email" name="email" autoComplete="email" placeholder="voce@email.com" className="impar-input" />
        </label>
        <label>
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[.14em] text-[#5d454c]">WhatsApp</span>
          <input name="whatsapp" autoComplete="tel" placeholder="(17) 99999-9999" className="impar-input" />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[.14em] text-[#5d454c]">Profissão ou área de atuação</span>
          <input name="profession" placeholder="Ex.: médica, advogada, empresária, consultora..." className="impar-input" />
        </label>
      </div>
      <button type="button" onClick={() => setConsent((value) => !value)} className="mt-5 flex items-start gap-3 text-left text-xs leading-5 text-[#78656a]">
        <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center border ${consent ? "border-[#741b34] bg-[#741b34] text-white" : "border-[#bdaeb2] bg-transparent"}`}>
          {consent && <Check className="size-3.5" />}
        </span>
        <span>Concordo com o uso dos meus dados para gerar e entregar o diagnóstico, conforme a finalidade informada nesta experiência.</span>
      </button>
      {error && <p className="mt-4 rounded-xl bg-[#8b1738]/8 px-4 py-3 text-sm text-[#8b1738]">{error}</p>}
      <button disabled={!consent || loading} className="mt-7 flex h-14 w-full items-center justify-center gap-3 bg-[#5a1729] px-6 text-[10px] font-bold uppercase tracking-[.18em] text-white transition hover:bg-[#43101f] disabled:cursor-not-allowed disabled:opacity-45">
        {loading ? <LoaderCircle className="size-5 animate-spin" /> : <>Iniciar diagnóstico <ArrowRight className="size-4" /></>}
      </button>
      <p className="mt-4 text-center text-[10px] uppercase tracking-[.13em] text-[#9c898e]">24 perguntas · aproximadamente 6 minutos · resultado imediato</p>
    </form>
  )
}