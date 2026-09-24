import Link from "next/link"
import { ArrowRight, Eye, MessageCircleMore, MoveUpRight } from "lucide-react"
import { PublicFrame } from "@/components/diagnostico/public-frame"

export const metadata = {
  title: "Dani Ricco | Comunicação de Impacto",
  description: "Imagem, comunicação e comportamento alinhados para ampliar valor percebido, autoridade e presença.",
}

export default function DaniRiccoSitePage() {
  return (
    <PublicFrame>
      <main>
        <section className="relative overflow-hidden bg-[#f8f5f2]">
          <div className="absolute -right-28 top-6 size-[38rem] rounded-full border border-[#6d2136]/8" />
          <div className="absolute -right-10 top-24 size-[26rem] rounded-full border border-[#6d2136]/8" />
          <div className="relative mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <p className="text-[10px] font-bold uppercase tracking-[.3em] text-[#742039]">Dani Ricco · Método IMPAR®</p>
            <h1 className="impar-serif mt-6 max-w-5xl text-5xl leading-[.98] text-[#2d171e] sm:text-7xl">
              Não basta ser competente. É preciso comunicar essa competência à altura do seu valor.
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-7 text-[#715e63] sm:text-lg">
              Comunicação de Impacto construída pela coerência entre imagem, linguagem e comportamento.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="https://diagnostico.daniricco.com.br" className="inline-flex h-14 items-center gap-3 rounded-full bg-[#681b31] px-7 text-xs font-bold uppercase tracking-[.14em] text-white transition hover:bg-[#4f1226]">
                Fazer diagnóstico arquetípico <ArrowRight className="size-4" />
              </Link>
              <a href="https://www.instagram.com/daniricco/" target="_blank" rel="noopener noreferrer" className="inline-flex h-14 items-center rounded-full border border-[#6d2136]/20 bg-white/70 px-7 text-xs font-bold uppercase tracking-[.14em] text-[#5c2737]">
                Conhecer Dani Ricco
              </a>
            </div>
          </div>
        </section>

        <section className="border-y border-[#6d2136]/10 bg-[#efe6e3]">
          <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
            <p className="text-[10px] font-bold uppercase tracking-[.26em] text-[#792540]">Comunicação de Impacto</p>
            <h2 className="impar-serif mt-4 max-w-4xl text-4xl leading-tight text-[#321920] sm:text-5xl">
              Sua presença comunica antes, durante e depois daquilo que você diz.
            </h2>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl bg-[#f8f5f2] p-6">
                <Eye className="size-5 text-[#772640]" />
                <h3 className="impar-serif mt-4 text-2xl text-[#3f222b]">Visual</h3>
                <p className="mt-2 text-sm leading-6 text-[#806d72]">A mensagem percebida antes mesmo de você falar.</p>
              </article>
              <article className="rounded-2xl bg-[#f8f5f2] p-6">
                <MessageCircleMore className="size-5 text-[#772640]" />
                <h3 className="impar-serif mt-4 text-2xl text-[#3f222b]">Verbal</h3>
                <p className="mt-2 text-sm leading-6 text-[#806d72]">A linguagem que organiza percepção, valor e autoridade.</p>
              </article>
              <article className="rounded-2xl bg-[#f8f5f2] p-6">
                <MoveUpRight className="size-5 text-[#772640]" />
                <h3 className="impar-serif mt-4 text-2xl text-[#3f222b]">Comportamental</h3>
                <p className="mt-2 text-sm leading-6 text-[#806d72]">A postura que confirma a mensagem depois da primeira impressão.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.26em] text-[#792540]">Método IMPAR®</p>
            <h2 className="impar-serif mt-4 text-4xl leading-tight text-[#321920] sm:text-5xl">Ser IMPAR não é fórmula.</h2>
            <p className="mt-5 text-base leading-7 text-[#745f66]">É comunicar o que é único com força, coerência e valor.</p>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#6d2136]/10 bg-[#6d2136]/10 sm:grid-cols-3">
            {[["22 anos","de estudo e aplicação"],["+5.000","profissionais"],["+1.000","horas presenciais"],["11+ países","de repertório"],["+3MM","contas alcançadas"],["IMPAR®","visual · verbal · comportamental"]].map(([value,label]) => (
              <div key={label} className="bg-[#f8f5f2] p-5 text-center">
                <p className="impar-serif text-2xl text-[#591a2d]">{value}</p>
                <p className="mt-1 text-[9px] uppercase tracking-[.12em] text-[#887178]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#4b1122] text-white">
          <div className="mx-auto w-full max-w-4xl px-5 py-16 text-center sm:px-8 sm:py-24">
            <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#ddbec6]">Comece pelo que já comunica sobre você</p>
            <h2 className="impar-serif mt-5 text-4xl leading-tight sm:text-6xl">
              Descubra a força arquetípica que conduz sua presença.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#e5d1d6]">
              Um diagnóstico aplicado à Comunicação de Impacto pelos pilares visual, verbal e comportamental.
            </p>
            <Link href="https://diagnostico.daniricco.com.br" className="mt-8 inline-flex h-14 items-center gap-3 rounded-full bg-white px-7 text-xs font-bold uppercase tracking-[.14em] text-[#511426] transition hover:bg-[#f6ecef]">
              Iniciar diagnóstico <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>
    </PublicFrame>
  )
}