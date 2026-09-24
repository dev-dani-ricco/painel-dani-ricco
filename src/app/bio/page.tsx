import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, AtSign, Globe2, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Dani Ricco | Links",
  description: "Comunicação de Impacto, Método IMPAR® e caminhos para conhecer o trabalho de Dani Ricco.",
}

const links = [
  {
    href: "https://daniricco.com.br",
    eyebrow: "Site oficial",
    title: "Conheça Dani Ricco",
    description: "Trajetória, Método IMPAR® e Comunicação de Impacto.",
    icon: Globe2,
  },
  {
    href: "https://diagnostico.daniricco.com.br",
    eyebrow: "Experiência gratuita",
    title: "Diagnóstico Arquetípico IMPAR®",
    description: "Descubra a força predominante que conduz sua presença e comunicação.",
    icon: Sparkles,
  },
  {
    href: "https://www.instagram.com/daniricco/",
    eyebrow: "Instagram",
    title: "@daniricco",
    description: "Conteúdo, bastidores, experiências e conversas sobre presença e valor percebido.",
    icon: AtSign,
  },
]

export default function BioPage() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f2ebe4] text-[#2a191d]">
      <div className="pointer-events-none fixed inset-x-0 top-16 select-none text-center text-[27vw] font-semibold leading-none tracking-[-.08em] text-[#681b31]/[.035]">IMPAR</div>

      <div className="relative mx-auto flex min-h-screen w-full min-w-0 max-w-[760px] flex-col px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex items-center justify-between border-b border-[#3b2926]/12 pb-5">
          <Image src="/dani/logo-preta.png" alt="Dani Ricco" width={220} height={74} className="h-auto w-[150px] object-contain sm:w-[175px]" priority />
          <span className="text-[8px] font-semibold uppercase tracking-[.26em] text-[#7d6662]">Método IMPAR®</span>
        </div>

        <section className="mt-8 grid min-w-0 gap-7 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center">
          <div className="relative mx-auto aspect-[4/5] w-[180px] overflow-hidden border border-[#681b31]/12 sm:mx-0 sm:w-full">
            <Image src="/dani/book-portrait.jpg" alt="Dani Ricco" fill className="object-cover object-[48%_24%]" sizes="190px" priority />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.27em] text-[#792540]">Comunicação de Impacto</p>
            <h1 className="impar-serif mt-3 text-4xl leading-[1.02] sm:text-5xl">Dani Ricco</h1>
            <p className="mt-4 max-w-full break-words text-sm leading-6 text-[#6f5d58]">Transforma presença em comunicação de valor por meio do Método IMPAR® — alinhando os pilares visual, verbal e comportamental para profissionais que querem ser percebidas à altura do que já construíram.</p>
          </div>
        </section>

        <section className="mt-9 grid gap-3">
          {links.map(({ href, eyebrow, title, description, icon: Icon }) => (
            <Link key={href} href={href} target={href.includes("instagram.com") ? "_blank" : undefined} rel={href.includes("instagram.com") ? "noopener noreferrer" : undefined} className="group grid min-w-0 grid-cols-[38px_minmax(0,1fr)_16px] items-center gap-3 border border-[#4d322f]/12 bg-[#fbf8f4]/90 p-4 transition hover:border-[#681b31]/35 hover:bg-white sm:grid-cols-[42px_minmax(0,1fr)_18px] sm:gap-4 sm:p-5">
              <span className="flex size-10 items-center justify-center border border-[#681b31]/15 text-[#6b1d33]"><Icon className="size-4" /></span>
              <span className="min-w-0">
                <span className="block text-[8px] font-bold uppercase tracking-[.22em] text-[#9a817b]">{eyebrow}</span>
                <span className="impar-serif mt-1 block break-words text-[22px] leading-tight text-[#341b22] sm:text-2xl">{title}</span>
                <span className="mt-1.5 block break-words text-xs leading-5 text-[#7b6863]">{description}</span>
              </span>
              <ArrowUpRight className="size-4 text-[#8b6c73] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#681b31]" />
            </Link>
          ))}
        </section>

        <div className="mt-auto pt-12 text-center">
          <p className="impar-serif text-xl text-[#4d3036]">Ser IMPAR não é fórmula.</p>
          <p className="mt-1 text-[9px] uppercase tracking-[.18em] text-[#9a8580]">É comunicar o que é único com força, coerência e valor.</p>
        </div>
      </div>
    </main>
  )
}