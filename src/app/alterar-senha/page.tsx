"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react"
import { FEATURES } from "@/lib/auth-config"
import { useAuth } from "@/components/auth-provider"

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user, loading, refresh } = useAuth()
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [show, setShow] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")
  const [done, setDone] = React.useState(false)

  React.useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [loading, user, router])

  const checks = [
    ["12+ caracteres", newPassword.length >= 12],
    ["letra maiúscula", /[A-Z]/.test(newPassword)],
    ["letra minúscula", /[a-z]/.test(newPassword)],
    ["número", /[0-9]/.test(newPassword)],
    ["símbolo", /[^A-Za-z0-9]/.test(newPassword)],
  ] as const
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError("")
    setDone(false)

    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Não foi possível alterar a senha.")

      setDone(true)
      await refresh()
      const first = FEATURES.find((feature) => user?.permissions.includes(feature.key))
      window.setTimeout(() => {
        router.replace(first?.href || "/")
        router.refresh()
      }, 650)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível alterar a senha.")
    } finally {
      setSaving(false)
    }
  }
  return (
    <main className="grid min-h-screen place-items-center bg-[#090909] px-4 py-10 text-white">
      <div className="w-full max-w-[460px]">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-[#ff6a00]/30 bg-[#ff6a00]/[.08]">
            <KeyRound className="size-5 text-[#ff6a00]"/>
          </div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[.24em] text-[#ff6a00]">DANI RICCO</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-.03em]">Alterar senha</h1>
          <p className="mt-2 text-sm text-zinc-500">
            {user?.mustChangePassword
              ? "Defina uma nova senha para continuar usando o painel."
              : "Atualize sua senha de acesso ao painel."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/[.08] bg-white/[.025] p-6 shadow-2xl">
          <PasswordField label="Senha atual" value={currentPassword} onChange={setCurrentPassword} show={show}/>
          <PasswordField label="Nova senha" value={newPassword} onChange={setNewPassword} show={show}/>
          <PasswordField label="Confirmar nova senha" value={confirmPassword} onChange={setConfirmPassword} show={show}/>
          <button
            type="button"
            onClick={() => setShow((current) => !current)}
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300"
          >
            {show ? <EyeOff className="size-3.5"/> : <Eye className="size-3.5"/>}
            {show ? "Ocultar senhas" : "Mostrar senhas"}
          </button>

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/[.06] bg-black/20 p-3">
            {checks.map(([label, ok]) => (
              <div key={label} className={"flex items-center gap-2 text-[11px] " + (ok ? "text-emerald-400" : "text-zinc-600")}>
                <Check className="size-3"/>
                {label}
              </div>
            ))}
          </div>

          {error && <div className="rounded-lg border border-red-500/20 bg-red-500/[.06] px-3 py-2 text-xs text-red-300">{error}</div>}
          {done && <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[.06] px-3 py-2 text-xs text-emerald-300">Senha atualizada com sucesso.</div>}

          <button
            type="submit"
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ff6a00] text-sm font-semibold text-black transition hover:bg-[#ff7b22] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <LoaderCircle className="size-4 animate-spin"/>}
            Salvar nova senha
          </button>
        </form>
      </div>
    </main>
  )
}
function PasswordField({
  label,
  value,
  onChange,
  show,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  show: boolean
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-500">{label}</span>
      <input
        autoComplete={label === "Senha atual" ? "current-password" : "new-password"}
        type={show ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm outline-none transition focus:border-[#ff6a00]/60"
      />
    </label>
  )
}
