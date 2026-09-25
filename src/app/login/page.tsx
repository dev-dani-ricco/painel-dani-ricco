"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react"
import { FEATURES, type FeatureKey } from "@/lib/auth-config"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Não foi possível entrar.")

      const permissions = body.user?.permissions as FeatureKey[] | undefined
      const first = FEATURES.find((feature) => permissions?.includes(feature.key))
      router.push(first?.href || "/sem-acesso")
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível entrar.")
    } finally {
      setLoading(false)
    }
  }
  return <main className="grid min-h-screen place-items-center bg-[#090909] px-4 text-white">
    <div className="w-full max-w-[420px]">
      <div className="mb-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-[#ff6a00]/30 bg-[#ff6a00]/[.08]">
          <LockKeyhole className="size-5 text-[#ff6a00]"/>
        </div>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[.24em] text-[#ff6a00]">DANI RICCO</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-.03em]">Painel de Lançamento</h1>
        <p className="mt-2 text-sm text-zinc-500">Acesso privado da equipe.</p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/[.08] bg-white/[.025] p-6 shadow-2xl">
        <label className="block">
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-500">Usuário</span>
          <input
            autoFocus
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value.toUpperCase())}
            className="h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm outline-none transition focus:border-[#ff6a00]/60"
            placeholder="DANI"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-500">Senha</span>
          <div className="relative">
            <input
              autoComplete="current-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 pr-11 text-sm outline-none transition focus:border-[#ff6a00]/60"
              placeholder="••••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-0 top-0 grid h-11 w-11 place-items-center text-zinc-600 hover:text-zinc-300"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}
            </button>
          </div>
        </label>

        {error && <div className="rounded-lg border border-red-500/20 bg-red-500/[.06] px-3 py-2 text-xs text-red-300">{error}</div>}
        <button
          disabled={!username || !password || loading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ff6a00] text-sm font-semibold text-black transition hover:bg-[#ff7b22] disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
        >
          {loading ? <LoaderCircle className="size-4 animate-spin"/> : <>Entrar <ArrowRight className="size-4"/></>}
        </button>
      </form>

      <p className="mt-5 text-center text-[10px] text-zinc-700">Acesso monitorado · Dani Ricco</p>
    </div>
  </main>
}
