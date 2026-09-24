import Image from "next/image"
import { Suspense } from "react"
import { Clock3, ShieldCheck } from "lucide-react"
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
        <section className="relative overflow-hidden bg-[#59172a] text-[#f7efe9]">
          <div className="pointer-events-none absolute -left-8 top-6 select-none whitespace-nowrap text-[15vw] font-semibold leading-none tracking-[-.07em] text-white/[.035]">ARQUÉTIPOS</div>
          <div className="relative mx-auto grid min-h-[680px] w-full max-w-[1320px] grid-cols-1 lg:grid-cols-[1.06fr_.94fr]">
            <div className="flex flex-col justify-center px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="text-[10px] font-bold uppercase tracking-[.28em] text-[#d2a8b3]">Diagnóstico Arquetípico</span>
                <span className="h-px w-12 bg-[#bb8795]" />
                <span className="hidden text-[10px] uppercase tracking-[.24em] text-[#ead9dd] sm:inline">Método IMPAR®</span>
              </div>
              <h1 className="impar-serif mt-8 max-w-[760px] text-[44px] leading-[.98] sm:text-7xl lg:text-[78px]">
                A intenção da imagem começa pela força que conduz você.
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-[#ead8dc] sm:text-lg">
                Os arquétipos revelam padrões simbólicos que ajudam a compreender como você naturalmente influencia, se expressa e é percebida.
              </p>
              <div className="mt-9 flex flex-wrap gap-5 text-[10px] uppercase tracking-[.15em] text-[#d6bac1]">
                <span className="flex items-center gap-2"><Clock3 className="size-4" /> cerca de 6 minutos</span>
                <span className="flex items-center gap-2"><ShieldCheck className="size-4" /> resultado predominante imediato</span>
              </div>
              <div className="mt-14 grid max-w-2xl grid-cols-1 divide-y divide-white/15 border-y border-white/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {["Visual","Verbal","Comportamental"].map((item, index) => (
                  <div key={item} className="px-3 py-4 sm:px-5 sm:py-5">
                    <span className="block text-[9px] uppercase tracking-[.18em] text-[#c69aa6]">0{index + 1}</span>
                    <span className="impar-serif mt-2 block text-xl text-white sm:text-2xl">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative min-h-[520px] overflow-hidden border-t border-white/10 lg:min-h-full lg:border-l lg:border-t-0">
              <Image
                src="/dani/fan-front.jpg"
                alt="Dani Ricco"
                fill
                className="object-cover object-[center_25%]"
                sizes="(max-width: 1024px) 100vw, 47vw"
                priority
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(89,23,42,.28),transparent_45%),linear-gradient(0deg,rgba(89,23,42,.58),transparent_55%)]" />
              <div className="absolute bottom-8 left-8 right-8 border-t border-white/30 pt-4">
                <p className="text-[9px] uppercase tracking-[.22em] text-white/75">Presença · intenção · percepção</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f4efe8]">
          <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[.78fr_1.22fr] lg:px-10 lg:py-24">
            <div className="lg:pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#742039]">Como funciona</p>
              <h2 className="impar-serif mt-5 text-4xl leading-[1.03] text-[#2a191d] sm:text-5xl">Não é sobre escolher quem você gostaria de ser.</h2>
              <p className="mt-6 text-sm leading-7 text-[#75645f]">É sobre identificar padrões que já aparecem na sua estética, na forma como você fala, lidera, resolve problemas e cria conexão.</p>
              <div className="mt-9 divide-y divide-[#2a201e]/12 border-y border-[#2a201e]/12">
                {[
                  ["01","24 perguntas","Escolhas rápidas sobre situações reais do seu dia a dia."],
                  ["02","3 pilares","Visual, verbal e comportamental analisados em conjunto."],
                  ["03","12 arquétipos","Leitura comparativa para identificar sua força dominante."],
                ].map(([n,title,copy]) => (
                  <div key={n} className="grid grid-cols-[46px_1fr] gap-3 py-5">
                    <span className="impar-serif text-2xl text-[#9a7771]">{n}</span>
                    <div><p className="text-sm font-bold text-[#3f2d29]">{title}</p><p className="mt-1 text-xs leading-5 text-[#887670]">{copy}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <Suspense fallback={<div className="min-h-[560px] border border-[#2a201e]/10 bg-[#fbf8f4]" />}>
              <DiagnosticStartForm />
            </Suspense>
          </div>
        </section>

        <section className="bg-[#1a1614] text-white">
          <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:px-10 lg:py-20">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.26em] text-[#a77c88]">Método IMPAR®</p>
              <h2 className="impar-serif mt-5 text-4xl leading-tight sm:text-5xl">Arquétipo não é personagem.</h2>
            </div>
            <div>
              <p className="max-w-3xl text-sm leading-7 text-[#c8bbb5]">O objetivo não é encaixar você em uma fórmula estética. É reconhecer forças já presentes e transformá-las em uma comunicação mais intencional, coerente e valiosa.</p>
              <p className="mt-6 text-[10px] uppercase tracking-[.2em] text-[#8f7f79]">Baseado em referências arquetípicas de Carl Jung · aplicação estratégica Dani Ricco</p>
            </div>
          </div>
        </section>
      </main>
    </PublicFrame>
  )
}