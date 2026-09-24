import Image from "next/image"
import Link from "next/link"

export function PublicFrame({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div className="impar-public min-h-screen">
      <header className="sticky top-0 z-50 border-b border-[#2a201e]/10 bg-[#f4efe8]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[86px] w-full max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="https://daniricco.com.br" aria-label="Dani Ricco — página inicial" className="block">
            <Image
              src="/dani/logo-preta.png"
              alt="Dani Ricco"
              width={210}
              height={72}
              className="h-auto w-[156px] object-contain sm:w-[188px]"
              priority
            />
          </Link>
          <div className="flex items-center gap-5 sm:gap-8">
            {!compact && (
              <nav className="hidden items-center gap-6 text-[10px] font-semibold uppercase tracking-[.2em] text-[#5b4944] md:flex">
                <Link href="https://daniricco.com.br" className="transition hover:text-[#6b1d33]">Dani Ricco</Link>
                <Link href="https://diagnostico.daniricco.com.br" className="transition hover:text-[#6b1d33]">Diagnóstico</Link>
              </nav>
            )}
            <div className="hidden border-l border-[#2a201e]/15 pl-5 text-right sm:block sm:pl-7">
              <span className="block text-[9px] font-semibold uppercase tracking-[.28em] text-[#6d2136]">Método IMPAR®</span>
              {!compact && <span className="mt-1 hidden text-[8px] uppercase tracking-[.18em] text-[#9b8580] sm:block">Comunicação de Impacto</span>}
            </div>
          </div>
        </div>
      </header>

      {children}

      <footer className="bg-[#171311] text-[#efe7df]">
        <div className="mx-auto grid w-full max-w-[1320px] gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-end lg:px-10">
          <div>
            <Image
              src="/dani/logo-branca.png"
              alt="Dani Ricco"
              width={250}
              height={86}
              className="h-auto w-[185px] object-contain"
            />
            <p className="mt-5 max-w-md text-xs leading-6 text-[#b9aaa4]">Comunicação de Impacto construída pelos pilares visual, verbal e comportamental.</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[9px] uppercase tracking-[.22em] text-[#8f7f79]">© 2026 Dani Ricco · Método IMPAR®</p>
            <p className="mt-2 max-w-lg text-[9px] leading-5 text-[#756a66]">Ferramentas de autoconhecimento e comunicação. Não constituem avaliação psicológica.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}