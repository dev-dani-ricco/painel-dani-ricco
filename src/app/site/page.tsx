import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PublicFrame } from "@/components/diagnostico/public-frame"

export const metadata = {
  title: "Dani Ricco | Comunicação de Impacto",
  description: "Imagem, comunicação e comportamento alinhados para ampliar valor percebido, autoridade e presença.",
}

const pillars = [
  ["I", "Visual", "A mensagem percebida antes mesmo da primeira palavra.", "Imagem, estética, presença e códigos visuais que traduzem valor."],
  ["II", "Verbal", "A linguagem que organiza percepção e autoridade.", "Tom, narrativa, clareza e intenção para ser compreendida à altura do que entrega."],
  ["III", "Comportamental", "A postura que confirma a primeira impressão.", "Gestos, decisões, liderança e coerência entre discurso e comportamento."],
]

export default function DaniRiccoSitePage() {
  return (
    <PublicFrame>
      <main>
        <section className="relative overflow-hidden bg-[#171311] text-[#f4efe8]">
          <div className="pointer-events-none absolute -left-8 top-14 select-none text-[22vw] font-semibold leading-none tracking-[-.08em] text-white/[.025]">IMPAR</div>
          <div className="relative mx-auto grid min-h-[740px] w-full max-w-[1320px] grid-cols-1 lg:grid-cols-[1.05fr_.95fr]">
            <div className="flex flex-col justify-center px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold uppercase tracking-[.28em] text-[#b9909b]">01</span>
                <span className="h-px w-12 bg-[#8e5b68]" />
                <span className="text-[10px] font-bold uppercase tracking-[.28em] text-[#d8c8c2]">Comunicação de Impacto</span>
              </div>
              <h1 className="impar-serif mt-9 max-w-[760px] text-[44px] leading-[.98] sm:text-7xl lg:text-[84px]">
                Não basta ser competente.
                <span className="block text-[#b77a8a]">É preciso comunicar essa competência.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-[#cbbcb6] sm:text-lg">
                Sua imagem é a primeira evidência do seu valor. Sua linguagem e seu comportamento decidem se essa percepção se sustenta.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="https://diagnostico.daniricco.com.br" className="inline-flex h-14 items-center gap-3 bg-[#f0e7df] px-7 text-[10px] font-bold uppercase tracking-[.17em] text-[#30161f] transition hover:bg-white">
                  Fazer diagnóstico arquetípico <ArrowRight className="size-4" />
                </Link>
                <a href="https://www.instagram.com/daniricco/" target="_blank" rel="noopener noreferrer" className="inline-flex h-14 items-center border border-white/20 px-7 text-[10px] font-bold uppercase tracking-[.17em] text-white transition hover:border-white/45">
                  Conhecer Dani Ricco
                </a>
              </div>
              <div className="mt-14 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-6 text-[9px] uppercase tracking-[.17em] text-[#8e7d77]">
                <span>Visual</span><span>Verbal</span><span>Comportamental</span><span>Método IMPAR®</span>
              </div>
            </div>

            <div className="relative min-h-[520px] overflow-hidden border-t border-white/10 lg:min-h-full lg:border-l lg:border-t-0">
              <Image
                src="/dani/portrait-serious.jpg"
                alt="Dani Ricco"
                fill
                className="object-cover object-[center_28%] saturate-[.85]"
                sizes="(max-width: 1024px) 100vw, 48vw"
                priority
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,19,17,.30),transparent_45%),linear-gradient(0deg,rgba(23,19,17,.42),transparent_55%)]" />
              <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between border-t border-white/25 pt-4 text-white">
                <span className="text-[9px] font-semibold uppercase tracking-[.25em]">Dani Ricco</span>
                <span className="impar-serif text-xl">Método IMPAR®</span>
              </div>
            </div>
          </div>
        </section>
        <section className="border-b border-[#2a201e]/10 bg-[#f4efe8]">
          <div className="mx-auto grid w-full max-w-[1320px] grid-cols-2 border-x border-[#2a201e]/10 sm:grid-cols-3 lg:grid-cols-5">
            {[["22 anos","de estudo e aplicação"],["+5.000","profissionais"],["+1.000","horas presenciais"],["11+","países de repertório"],["+3MM","contas alcançadas"]].map(([value,label]) => (
              <div key={label} className="border-l border-[#2a201e]/10 px-5 py-7 text-center sm:px-6">
                <p className="impar-serif text-3xl text-[#57192b] sm:text-4xl">{value}</p>
                <p className="mt-2 text-[9px] uppercase tracking-[.16em] text-[#776762]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#f4efe8]">
          <div className="mx-auto w-full max-w-[1320px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
            <div className="grid grid-cols-1 gap-10 border-b border-[#2a201e]/12 pb-12 lg:grid-cols-[.42fr_1fr] lg:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#742039]">02 · Método IMPAR®</p>
              </div>
              <div>
                <h2 className="impar-serif max-w-4xl text-4xl leading-[1.02] text-[#211917] sm:text-6xl">Sua presença comunica antes, durante e depois daquilo que você diz.</h2>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-[#756761]">O Método IMPAR® organiza essa comunicação em três pilares que precisam sustentar a mesma mensagem.</p>
              </div>
            </div>

            <div className="divide-y divide-[#2a201e]/12">
              {pillars.map(([number,title,lead,copy]) => (
                <article key={title} className="grid gap-5 py-8 sm:grid-cols-[80px_220px_1fr] sm:items-start sm:py-10">
                  <span className="impar-serif text-3xl text-[#9d7f78]">{number}</span>
                  <h3 className="impar-serif text-3xl text-[#311b20]">{title}</h3>
                  <div className="max-w-2xl">
                    <p className="text-sm font-semibold leading-6 text-[#4a3935]">{lead}</p>
                    <p className="mt-2 text-sm leading-6 text-[#85746e]">{copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-[#5a1729] text-[#f5eee8]">
          <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 lg:grid-cols-[.9fr_1.1fr]">
            <div className="relative min-h-[560px] overflow-hidden lg:min-h-[720px]">
              <Image
                src="/dani/fan-side.jpg"
                alt="Dani Ricco com leque"
                fill
                className="object-cover object-[center_28%]"
                sizes="(max-width: 1024px) 100vw, 46vw"
              />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(90,23,41,.48),transparent_55%)]" />
            </div>
            <div className="flex flex-col justify-center px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
              <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#d3aeb8]">03 · Presença com intenção</p>
              <blockquote className="impar-serif mt-7 max-w-2xl text-4xl leading-[1.04] sm:text-6xl">
                “Sua imagem é a primeira evidência do seu valor.”
              </blockquote>
              <p className="mt-7 max-w-xl text-sm leading-7 text-[#dfcdd1]">
                Mas a percepção não termina na aparência. Ela é confirmada — ou contradita — pela maneira como você fala, ocupa espaço, decide, se posiciona e conduz relações.
              </p>
              <div className="mt-10 border-t border-white/15 pt-7">
                <p className="text-[9px] uppercase tracking-[.22em] text-[#c49da8]">Dani Ricco · Método IMPAR®</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#1a1614] text-white">
          <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:px-10 lg:py-24">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#a77c88]">04 · Dani Ricco</p>
              <h2 className="impar-serif mt-6 text-4xl leading-[1.02] sm:text-6xl">Repertório que atravessa liderança, comportamento e comunicação.</h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              <p className="text-sm leading-7 text-[#c9bbb5]">Uma trajetória construída entre ambiente corporativo, liderança, educação e posicionamento profissional — transformada em método para profissionais que precisam ser percebidas à altura do que já construíram.</p>
              <div className="space-y-4 text-[10px] uppercase tracking-[.16em] text-[#a7958e]">
                <div className="border-b border-white/10 pb-4">Comunicação de Impacto</div>
                <div className="border-b border-white/10 pb-4">Método IMPAR®</div>
                <div className="border-b border-white/10 pb-4">Experiências presenciais</div>
                <div className="border-b border-white/10 pb-4">Posicionamento profissional</div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#f0e7df]">
          <div className="pointer-events-none absolute inset-x-0 top-0 select-none text-center text-[17vw] font-semibold leading-none tracking-[-.07em] text-[#6a1c32]/[.035]">IMPAR</div>
          <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-28">
            <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#742039]">Comece por você</p>
            <h2 className="impar-serif mt-6 text-4xl leading-[1.03] text-[#2d1a1e] sm:text-6xl">Descubra a força arquetípica que conduz sua presença.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[#75645f]">Um diagnóstico aplicado aos pilares visual, verbal e comportamental para transformar percepção em intenção.</p>
            <Link href="https://diagnostico.daniricco.com.br" className="mt-9 inline-flex h-14 items-center gap-3 bg-[#5a1729] px-8 text-[10px] font-bold uppercase tracking-[.17em] text-white transition hover:bg-[#43101f]">
              Iniciar diagnóstico <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>
    </PublicFrame>
  )
}