"use client"

import * as React from "react"
import { KeyRound, LoaderCircle, ShieldCheck, UserCog } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FEATURE_GROUPS, type FeatureKey, type PanelRole } from "@/lib/auth-config"

type User = {
  id: string
  username: string
  displayName: string
  role: PanelRole
  active: boolean
  mustChangePassword: boolean
  permissions: FeatureKey[]
}

type Feature = { key: FeatureKey; label: string; href: string }
const roles: Array<{ value: PanelRole; label: string }> = [
  { value: "owner", label: "Proprietária" },
  { value: "admin", label: "Administradora" },
  { value: "editor", label: "Editora" },
  { value: "reviewer", label: "Revisão" },
  { value: "system", label: "Sistema" },
]

export function AccessManagement() {
  const [users, setUsers] = React.useState<User[]>([])
  const [features, setFeatures] = React.useState<Feature[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState<string | null>(null)
  const [passwordUser, setPasswordUser] = React.useState<User | null>(null)
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [forceChange, setForceChange] = React.useState(true)
  const [passwordSaving, setPasswordSaving] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/users", { cache: "no-store" })
      if (!response.ok) throw new Error("Sem permissão para administrar acessos")
      const body = await response.json()
      setUsers(body.users || [])
      setFeatures(body.features || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar acessos")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function save(user: User) {
    setSaving(user.id)
    try {
      const response = await fetch("/api/auth/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          role: user.role,
          active: user.active,
          mustChangePassword: user.mustChangePassword,
          permissions: user.permissions,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Falha ao salvar usuário")
      setUsers((current) => current.map((item) => item.id === user.id ? body.user : item))
      toast.success("Acessos de " + user.username + " atualizados.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar acessos")
    } finally {
      setSaving(null)
    }
  }

  async function resetPassword() {
    if (!passwordUser) return
    setPasswordSaving(true)
    try {
      const response = await fetch("/api/auth/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: passwordUser.id,
          newPassword,
          confirmPassword,
          mustChangePassword: forceChange,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Falha ao redefinir senha")

      setUsers((current) => current.map((item) =>
        item.id === passwordUser.id
          ? { ...item, mustChangePassword: body.user.mustChangePassword }
          : item,
      ))
      toast.success("Senha de " + passwordUser.username + " redefinida.")
      setPasswordUser(null)
      setNewPassword("")
      setConfirmPassword("")
      setForceChange(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao redefinir senha")
    } finally {
      setPasswordSaving(false)
    }
  }

  function openPassword(user: User) {
    setPasswordUser(user)
    setNewPassword("")
    setConfirmPassword("")
    setForceChange(true)
  }

  function update(id: string, patch: Partial<User>) {
    setUsers((current) => current.map((user) => user.id === id ? { ...user, ...patch } : user))
  }

  function toggleFeature(user: User, feature: FeatureKey) {
    const next = user.permissions.includes(feature)
      ? user.permissions.filter((item) => item !== feature)
      : [...user.permissions, feature]
    update(user.id, { permissions: next })
  }
  return <><Card className="border-white/[.08] bg-card py-0">
    <CardHeader className="border-b border-white/[.06] p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/[.06]">
          <UserCog className="size-4 text-primary"/>
        </div>
        <div>
          <CardTitle className="text-base">Usuários e acessos</CardTitle>
          <CardDescription>Organize o acesso por área e abra somente o que cada pessoa realmente precisa usar.</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-6 sm:p-7">
      {loading ? <div className="flex items-center gap-2 py-8 text-sm text-zinc-500"><LoaderCircle className="size-4 animate-spin"/>Carregando usuários…</div> : <div className="space-y-5">
        {users.map((user) => <div key={user.id} className="rounded-xl border border-white/[.08] bg-black/15 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{user.displayName}</p>
                <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] tracking-wider text-zinc-500">{user.username}</span>
                {user.active && <ShieldCheck className="size-3.5 text-primary"/>}
                {user.mustChangePassword && (
                  <span className="rounded border border-amber-500/20 bg-amber-500/[.07] px-1.5 py-0.5 text-[9px] text-amber-300">
                    troca de senha pendente
                  </span>
                )}
              </div>
            </div>
            <Select value={user.role} onValueChange={(value) => update(user.id, { role: value as PanelRole })}>
              <SelectTrigger className="w-full lg:w-48"><SelectValue/></SelectTrigger>
              <SelectContent>{roles.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}</SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input type="checkbox" checked={user.active} onChange={(event) => update(user.id, { active: event.target.checked })}/>
              Usuário ativo
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={user.mustChangePassword}
                onChange={(event) => update(user.id, { mustChangePassword: event.target.checked })}
              />
              Exigir troca no próximo login
            </label>
            <Button type="button" variant="outline" size="sm" onClick={() => openPassword(user)}>
              <KeyRound/>
              Redefinir senha
            </Button>
          </div>
          <details className="group mt-4 overflow-hidden rounded-xl border border-white/[.07] bg-black/10">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-medium text-zinc-300 [&::-webkit-details-marker]:hidden">
              <span>Acessos por área</span>
              <span className="rounded-full border border-white/[.08] px-2 py-1 text-[10px] text-zinc-500">{user.permissions.length}/{features.length} liberados</span>
            </summary>
            <div className="space-y-4 border-t border-white/[.06] p-4">
              {FEATURE_GROUPS.map((group) => {
                const groupFeatures = group.features.map((key) => features.find((feature) => feature.key === key)).filter(Boolean) as Feature[]
                if (groupFeatures.length === 0) return null
                const allowedCount = groupFeatures.filter((feature) => user.permissions.includes(feature.key)).length
                return <section key={group.key} className="rounded-lg border border-white/[.06] bg-black/15 p-3">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">{group.label}</p>
                      <p className="mt-1 text-[10px] leading-4 text-zinc-600">{group.description}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-zinc-600">{allowedCount}/{groupFeatures.length}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {groupFeatures.map((feature) => {
                      const allowed = user.permissions.includes(feature.key)
                      return <label key={feature.key} className={"flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition " + (allowed ? "border-primary/20 bg-primary/[.05] text-zinc-200" : "border-white/[.06] text-zinc-600")}>
                        <input type="checkbox" checked={allowed} onChange={() => toggleFeature(user, feature.key)}/>
                        <span>{feature.label}</span>
                      </label>
                    })}
                  </div>
                </section>
              })}
            </div>
          </details>

          <div className="mt-4 flex justify-end">
            <Button size="sm" disabled={saving === user.id} onClick={() => void save(user)}>
              {saving === user.id && <LoaderCircle className="animate-spin"/>}
              Salvar acessos
            </Button>
          </div>
        </div>)}
      </div>}
    </CardContent>
  </Card>

  <Dialog open={Boolean(passwordUser)} onOpenChange={(open) => {
    if (!open && !passwordSaving) {
      setPasswordUser(null)
      setNewPassword("")
      setConfirmPassword("")
      setForceChange(true)
    }
  }}>
    <DialogContent className="border-white/10 bg-[#111] text-white sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Redefinir senha</DialogTitle>
        <DialogDescription>
          Defina uma nova senha para {passwordUser?.displayName || passwordUser?.username}.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <label className="block space-y-2 text-xs text-zinc-400">
          <span>Nova senha</span>
          <Input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Mínimo 12 caracteres"
          />
        </label>
        <label className="block space-y-2 text-xs text-zinc-400">
          <span>Confirmar nova senha</span>
          <Input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        <label className="flex items-start gap-2 rounded-lg border border-white/[.08] bg-black/20 p-3 text-xs text-zinc-400">
          <input
            className="mt-0.5"
            type="checkbox"
            checked={forceChange}
            onChange={(event) => setForceChange(event.target.checked)}
          />
          <span>
            Exigir que o usuário escolha outra senha no próximo login.
            <span className="mt-1 block text-[10px] text-zinc-600">
              Recomendado quando esta senha será enviada temporariamente.
            </span>
          </span>
        </label>
        <p className="text-[10px] leading-5 text-zinc-600">
          Regra: 12+ caracteres, maiúscula, minúscula, número e símbolo.
        </p>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={passwordSaving}
          onClick={() => setPasswordUser(null)}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={passwordSaving || !newPassword || !confirmPassword}
          onClick={() => void resetPassword()}
        >
          {passwordSaving && <LoaderCircle className="animate-spin"/>}
          Salvar nova senha
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  </>
}
