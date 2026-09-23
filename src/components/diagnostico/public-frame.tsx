import Link from "next/link"

export function PublicFrame({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div className="impar-public min-h-screen bg-[#f8f5f2] text-[#241a1c]">
      <header className="border-b border-[#6d2136]/10 bg-[#f8f5f2]/95 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/diagnostico" className="group">
            <span className="block text-[11px] font-semibold uppercase tracking-[.32em] text-[#3d2028]">Dani Ricco</span>
            <span className="mt-1 block text-[9px] uppercase tracking-[.24em] text-[#8e737a]">Comunicação de Impacto</span>
          </Link>
          <div className="text-right">
            <span className="block text-[10px] font-semibold uppercase tracking-[.28em] text-[#6d2136]">Método IMPAR®</span>
            {!compact && <span className="mt-1 hidden text-[9px] uppercase tracking-[.2em] text-[#9b858a] sm:block">Visual · Verbal · Comportamental</span>}
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-[#6d2136]/10 bg-[#f4efeb]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-8 text-[10px] text-[#806d72] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© 2026 Dani Ricco · Método IMPAR®</span>
          <span>Ferramenta de autoconhecimento e comunicação. Não constitui avaliação psicológica.</span>
        </div>
      </footer>
    </div>
  )
}