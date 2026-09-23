import Link from "next/link"
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react"
import { getArchetype, type ArchetypeId } from "@/lib/archetypes"
import type { DiagnosticPillar } from "@/lib/diagnostic"

const pillarCopy: Record<DiagnosticPillar, { title: string; description: string }> = {
  visual: { title: "Visual", description: "O que é percebido antes mesmo de você falar." },
  verbal: { title: "Verbal", description: "A forma como suas palavras organizam percepção e valor." },
  comportamental: { title: "Comportamental", description: "O que sua postura confirma depois da primeira impressão." },
}

export function ResultFree({ sessionId, name, archetypeId, overallPercent, pillarPercents }: {
  sessionId: string
  name: string
  archetypeId: ArchetypeId
  overallPercent: number
  pillarPercents: Record<DiagnosticPillar, number>
}) {
  const archetype = getArchetype(archetypeId)
  const firstName = name.trim().split(/\s+/)[0] || name
  return (
    <main>
      <section className="relative overflow-hidden bg-[#521426] text-white">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_80%_20%,#d9abb6_0,transparent_38%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="text-[10px] font-semibold uppercase tracking-[.3em] text-[#e9cbd2]">Resultado do Diagnóstico Arquetípico IMPAR®</p>
          <p className="mt-8 text-sm text-[#e9cbd2]">{firstName}, sua força predominante é</p>
          <h1 className="impar-serif mt-2 text-6xl leading-none sm:text-8xl">{archetype.name}</h1>
          <p className="impar-serif mt-6 max-w-3xl text-2xl leading-snug text-[#f3e5e8] sm:text-3xl">{archetype.tagline}</p>
          <div className="mt-9 flex flex-wrap gap-2">
            {archetype.strengths.map((strength) => <span key={strength} className="rounded-full border border-white/20 bg-white/8 px-4 py-2 text-[11px] uppercase tracking-[.12em]">{strength}</span>)}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#792540]">Sua força natural</p>
            <h2 className="impar-serif mt-3 text-4xl leading-tight text-[#30171e]">{archetype.essence}</h2>
            <p className="mt-5 text-base leading-7 text-[#6f5a60]">Você tende a ser percebida como alguém {archetype.perception}. Quando essa energia está bem direcionada, ela aumenta a coerência entre o que você entrega e o valor que as pessoas conseguem perceber.</p>
            <div className="mt-6 rounded-2xl border border-[#6d2136]/12 bg-white/70 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a6d75]">Índice de expressão no teste</p>
              <div className="mt-3 flex items-end gap-3"><span className="impar-serif text-5xl text-[#682039]">{overallPercent}%</span><span className="pb-1 text-xs leading-5 text-[#8b767c]">dos sinais disponíveis para este arquétipo apareceram nas suas escolhas.</span></div>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#792540]">No Método IMPAR®</p>
            <h2 className="impar-serif mt-3 text-4xl leading-tight text-[#30171e]">Como essa força aparece na sua Comunicação de Impacto.</h2>
            <div className="mt-7 grid gap-4">
              {(Object.keys(pillarCopy) as DiagnosticPillar[]).map((pillar) => {
                const copy = pillarCopy[pillar]
                const detail = pillar === "visual" ? archetype.visual : pillar === "verbal" ? archetype.verbal : archetype.behavioral
                return <article key={pillar} className="rounded-2xl border border-[#6d2136]/12 bg-white/75 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold text-[#3c252c]">{copy.title}</p><p className="mt-1 text-xs text-[#9a858a]">{copy.description}</p></div><span className="impar-serif text-2xl text-[#702038]">{pillarPercents[pillar]}%</span></div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eadfe1]"><div className="h-full rounded-full bg-[#7a2941]" style={{ width: `${pillarPercents[pillar]}%` }} /></div>
                  <p className="mt-4 text-sm leading-6 text-[#715e63]">{detail}</p>
                </article>
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#6d2136]/10 bg-[#f1e8e7]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_.9fr] lg:items-center lg:py-20">
          <div>
            <div className="flex items-center gap-2 text-[#772640]"><Sparkles className="size-4"/><p className="text-[10px] font-bold uppercase tracking-[.22em]">Existe uma segunda força atuando na sua comunicação</p></div>
            <h2 className="impar-serif mt-4 text-4xl leading-tight text-[#321820] sm:text-5xl">Seu predominante mostra de onde vem sua força. O secundário revela como ela ganha personalidade.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#725e64]">É a combinação entre os dois que começa a revelar sua assinatura: como você deve construir presença, linguagem e comportamento sem virar uma personagem.</p>
            <Link href={`/mapa-arquetipico?session=${encodeURIComponent(sessionId)}`} className="mt-7 inline-flex h-14 items-center gap-3 rounded-full bg-[#65182f] px-7 text-xs font-bold uppercase tracking-[.14em] text-white transition hover:bg-[#4e1124]">Descobrir meu arquétipo secundário <ArrowRight className="size-4"/></Link>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-[#6d2136]/15 bg-white p-6 shadow-[0_28px_70px_rgba(74,25,40,.12)] sm:p-8">
            <div className="absolute inset-0 z-10 bg-white/28 backdrop-blur-[8px]" />
            <div className="relative select-none blur-[5px]">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8a6670]">Arquétipo secundário</p>
              <p className="impar-serif mt-4 text-5xl text-[#4e1b2b]">Sua segunda força</p>
              <p className="mt-5 text-sm leading-6 text-[#7a666c]">Esta energia modifica a forma como seu arquétipo predominante chega às pessoas e altera sua assinatura de comunicação.</p>
              <div className="mt-6 h-2 w-4/5 rounded-full bg-[#b98c99]"/><div className="mt-3 h-2 w-2/3 rounded-full bg-[#dac2c8]"/>
            </div>
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-[#671b31] text-white shadow-lg"><LockKeyhole className="size-5"/></span><p className="mt-4 text-sm font-bold uppercase tracking-[.15em] text-[#4e2531]">Resultado protegido</p><p className="mt-2 max-w-xs text-xs leading-5 text-[#7f6870]">A segunda força e a leitura da combinação fazem parte do Mapa Arquetípico IMPAR®.</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-5 py-12 text-center sm:px-8 sm:py-16">
        <p className="impar-serif text-3xl leading-snug text-[#3b2028]">“Sua imagem é a primeira evidência do seu valor. Mas é a coerência entre o que você mostra, diz e faz que sustenta essa percepção.”</p>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[.2em] text-[#7b2940]">Dani Ricco · Método IMPAR®</p>
      </section>
    </main>
  )
}