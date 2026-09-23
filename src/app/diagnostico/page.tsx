import { Suspense } from "react"
import { Clock3, Eye, MessageCircleMore, MoveUpRight, ShieldCheck } from "lucide-react"
import { PublicFrame } from "@/components/diagnostico/public-frame"
import { DiagnosticStartForm } from "@/components/diagnostico/start-form"

export const metadata = {
  title: "Diagnóstico Arquetípico IMPAR® | Dani Ricco",
  description: "Descubra a força arquetípica que conduz sua presença, comunicação e forma de ser percebida.",
}

export default function DiagnosticHomePage() {
  return (
    <PublicFrame>
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute -right-32 top-10 size-[34rem] rounded-full border border-[#6d2136]/8"/><div className="absolute -right-16 top-24 size-[24rem] rounded-full border border-[#6d2136]/8"/>
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 py-12 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#742039]">Diagnóstico Arquetípico IMPAR®</p>
              <h1 className="impar-serif mt-5 max-w-3xl text-5xl leading-[.98] text-[#2d171e] sm:text-7xl">Sua presença já comunica. Descubra qual força conduz essa mensagem.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#715e63] sm:text-lg">Um diagnóstico inspirado na teoria dos arquétipos de Jung e aplicado à comunicação, presença e posicionamento pelo Método IMPAR®.</p>
              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#6d2136]/10 bg-white/60 p-4"><Eye className="size-5 text-[#77243d]"/><p className="mt-3 text-sm font-bold text-[#3c252c]">Visual</p><p className="mt-1 text-xs leading-5 text-[#8a747a]">O que sua imagem comunica antes da fala.</p></div>
                <div className="rounded-2xl border border-[#6d2136]/10 bg-white/60 p-4"><MessageCircleMore className="size-5 text-[#77243d]"/><p className="mt-3 text-sm font-bold text-[#3c252c]">Verbal</p><p className="mt-1 text-xs leading-5 text-[#8a747a]">Como sua linguagem constrói percepção e valor.</p></div>
                <div className="rounded-2xl border border-[#6d2136]/10 bg-white/60 p-4"><MoveUpRight className="size-5 text-[#77243d]"/><p className="mt-3 text-sm font-bold text-[#3c252c]">Comportamental</p><p className="mt-1 text-xs leading-5 text-[#8a747a]">Como sua postura sustenta a primeira impressão.</p></div>
              </div>
              <div className="mt-8 flex flex-wrap gap-5 text-xs text-[#79666b]"><span className="flex items-center gap-2"><Clock3 className="size-4 text-[#7b2940]"/> Aproximadamente 6 minutos</span><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#7b2940]"/> Resultado predominante imediato</span></div>
            </div>
            <Suspense fallback={<div className="min-h-[520px] rounded-[2rem] border border-[#6d2136]/12 bg-white/70" />}>
              <DiagnosticStartForm />
            </Suspense>
          </div>
        </section>

        <section className="border-y border-[#6d2136]/10 bg-[#f1e9e6]">
          <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
            <p className="text-center text-[10px] font-bold uppercase tracking-[.25em] text-[#7a2a41]">A aplicação estratégica por trás do diagnóstico</p>
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#6d2136]/10 bg-[#6d2136]/10 sm:grid-cols-5">
              {[['22 anos','de estudo e aplicação'],['+5.000','profissionais'],['+1.000','horas presenciais'],['11+ países','de repertório'],['+3MM','contas alcançadas']].map(([value,label]) => <div key={label} className="bg-[#f8f5f2] p-5 text-center"><p className="impar-serif text-3xl text-[#591a2d]">{value}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-[#887178]">{label}</p></div>)}
            </div>
            <p className="mx-auto mt-7 max-w-3xl text-center text-sm leading-6 text-[#7a676c]">O objetivo não é encaixar você em uma fórmula. É identificar padrões de comunicação que já existem e transformá-los em mais intenção, coerência e valor percebido.</p>
          </div>
        </section>
      </main>
    </PublicFrame>
  )
}