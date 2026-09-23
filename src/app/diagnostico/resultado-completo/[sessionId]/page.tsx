import { notFound, redirect } from "next/navigation"
import { ArrowRight, CircleAlert, Eye, MessageCircleMore, MoveUpRight, Sparkles } from "lucide-react"
import { PublicFrame } from "@/components/diagnostico/public-frame"
import { describeCombination, getArchetype } from "@/lib/archetypes"
import { getDiagnosticResult } from "@/lib/diagnostic-db"

export const metadata = {
  title: "Mapa Arquetípico IMPAR® | Seu Resultado Completo",
  robots: { index: false, follow: false },
}

export default async function FullDiagnosticResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { sessionId } = await params
  const query = await searchParams
  const isDemo = sessionId === "preview"
  const previewAllowed = isDemo && (process.env.NODE_ENV === "development" || query.preview === "1")
  const record = isDemo ? null : await getDiagnosticResult(sessionId)
  if (!isDemo && !record) notFound()
  if (!previewAllowed && !record?.unlocked) redirect(`/mapa-arquetipico?session=${encodeURIComponent(sessionId)}`)

  const primaryId = isDemo ? "sabia" : record!.primaryArchetype
  const secondaryId = isDemo ? "amante" : record!.secondaryArchetype
  const primary = getArchetype(primaryId)
  const secondary = getArchetype(secondaryId)
  const combination = describeCombination(primaryId, secondaryId)
  const firstName = isDemo ? "Dani" : record!.name.trim().split(/\s+/)[0]

  const pillarCards = [
    { icon: Eye, title: "Visual", primary: primary.visual, secondary: secondary.visual },
    { icon: MessageCircleMore, title: "Verbal", primary: primary.verbal, secondary: secondary.verbal },
    { icon: MoveUpRight, title: "Comportamental", primary: primary.behavioral, secondary: secondary.behavioral },
  ]

  return (
    <PublicFrame>
      <main>
        <section className="relative overflow-hidden bg-[#4b1122] text-white">
          <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_78%_20%,#c98b9b_0,transparent_36%)]" />
          <div className="relative mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#e6c8cf]">Seu Mapa Arquetípico IMPAR®</p>
            <p className="mt-8 text-sm text-[#e2c7ce]">{firstName}, sua combinação principal é</p>
            <h1 className="impar-serif mt-3 text-5xl leading-none sm:text-8xl">{primary.name} <span className="text-[#cba2ad]">+</span> {secondary.name}</h1>
            <p className="impar-serif mt-7 max-w-4xl text-2xl leading-snug text-[#f1e2e6] sm:text-3xl">{combination.summary}</p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-2">
            <article className="rounded-[2rem] border border-[#6d2136]/12 bg-white/75 p-7 sm:p-9">
              <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#792540]">Arquétipo predominante</p>
              <h2 className="impar-serif mt-3 text-5xl text-[#391b25]">{primary.name}</h2>
              <p className="mt-4 text-base leading-7 text-[#735f65]">{primary.tagline}</p>
              <div className="mt-6 flex flex-wrap gap-2">{primary.strengths.map((item) => <span key={item} className="rounded-full bg-[#f1e6e5] px-3 py-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[#6e263b]">{item}</span>)}</div>
              <p className="mt-6 text-sm leading-6 text-[#78666b]">É a força que tende a conduzir suas escolhas, sua maneira de interpretar situações e o tipo de valor que você naturalmente comunica.</p>
            </article>
            <article className="rounded-[2rem] border border-[#6d2136]/12 bg-[#efe3e3] p-7 sm:p-9">
              <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#792540]">Arquétipo secundário</p>
              <h2 className="impar-serif mt-3 text-5xl text-[#391b25]">{secondary.name}</h2>
              <p className="mt-4 text-base leading-7 text-[#735f65]">{secondary.tagline}</p>
              <div className="mt-6 flex flex-wrap gap-2">{secondary.strengths.map((item) => <span key={item} className="rounded-full bg-white/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[#6e263b]">{item}</span>)}</div>
              <p className="mt-6 text-sm leading-6 text-[#78666b]">É a força que dá personalidade à expressão do predominante e altera o modo como ele chega às pessoas.</p>
            </article>
          </div>
        </section>

        <section className="border-y border-[#6d2136]/10 bg-[#f0e7e4]">
          <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
              <div><div className="flex items-center gap-2 text-[#792540]"><Sparkles className="size-4"/><p className="text-[10px] font-bold uppercase tracking-[.22em]">Sua assinatura</p></div><h2 className="impar-serif mt-4 text-4xl leading-tight text-[#321920] sm:text-5xl">{combination.title}</h2><p className="mt-5 text-base leading-7 text-[#725e64]">{combination.direction}</p></div>
              <div className="grid gap-4">
                {pillarCards.map(({ icon: Icon, title, primary: primaryText, secondary: secondaryText }) => <article key={title} className="rounded-2xl border border-[#6d2136]/12 bg-[#f8f5f2] p-6"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-[#6a1d34] text-white"><Icon className="size-4"/></span><h3 className="impar-serif text-2xl text-[#3f222b]">Comunicação {title}</h3></div><p className="mt-5 text-sm leading-6 text-[#6e5a60]"><strong className="text-[#4b2732]">{primary.name}:</strong> {primaryText}</p><p className="mt-3 text-sm leading-6 text-[#6e5a60]"><strong className="text-[#4b2732]">{secondary.name}:</strong> {secondaryText}</p></article>)}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="grid gap-5 md:grid-cols-2">
            <article className="rounded-[2rem] bg-[#4b1122] p-7 text-white sm:p-9"><Sparkles className="size-5 text-[#e2bec7]"/><p className="mt-5 text-[10px] font-bold uppercase tracking-[.22em] text-[#dcb8c1]">Potência da combinação</p><h2 className="impar-serif mt-3 text-3xl">Quando as duas forças trabalham juntas.</h2><p className="mt-5 text-sm leading-7 text-[#ead9de]">{primary.tagline} Ao receber a influência de {secondary.name}, sua expressão {secondary.secondaryExpression}. Essa soma pode ampliar diferenciação e coerência quando aparece de forma intencional nos três pilares.</p></article>
            <article className="rounded-[2rem] border border-[#6d2136]/15 bg-white/75 p-7 sm:p-9"><CircleAlert className="size-5 text-[#7a2941]"/><p className="mt-5 text-[10px] font-bold uppercase tracking-[.22em] text-[#792540]">Ponto de atenção</p><h2 className="impar-serif mt-3 text-3xl text-[#3d2029]">Quando a força vira excesso.</h2><p className="mt-5 text-sm leading-7 text-[#745f66]">{combination.tension}</p><p className="mt-4 text-sm leading-7 text-[#745f66]"><strong className="text-[#4d2c36]">Sombra de {primary.name}:</strong> {primary.shadow}</p><p className="mt-3 text-sm leading-7 text-[#745f66]"><strong className="text-[#4d2c36]">Sombra de {secondary.name}:</strong> {secondary.shadow}</p></article>
          </div>
        </section>

        <section className="bg-[#efe5e2]">
          <div className="mx-auto w-full max-w-5xl px-5 py-14 text-center sm:px-8 sm:py-20">
            <p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#792540]">Direção final</p>
            <h2 className="impar-serif mt-4 text-4xl leading-tight text-[#321920] sm:text-5xl">Você não precisa performar um arquétipo. Precisa comunicar com intenção aquilo que já é coerente com você.</h2>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-[#725e64]">{primary.direction} {secondary.direction}</p>
            <a href="https://www.instagram.com/daniricco/" target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex h-14 items-center gap-3 rounded-full bg-[#681b31] px-7 text-xs font-bold uppercase tracking-[.14em] text-white transition hover:bg-[#4d1124]">Continuar no universo IMPAR® <ArrowRight className="size-4"/></a>
          </div>
        </section>
      </main>
    </PublicFrame>
  )
}