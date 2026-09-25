"use client"

import Link from "next/link"

export default function NoAccessPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#090909] px-4 text-white">
      <div className="max-w-md text-center">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#ff6a00]">DANI RICCO</p>
        <h1 className="mt-3 text-2xl font-semibold">Acesso não liberado</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          Seu usuário está ativo, mas este módulo não está liberado para o seu perfil.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/[.04]"
        >
          Voltar ao login
        </Link>
      </div>
    </main>
  )
}
