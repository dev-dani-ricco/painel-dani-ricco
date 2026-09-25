"use client"

import * as React from "react"
import { LoaderCircle, ShieldCheck, UserCog } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FeatureKey, PanelRole } from "@/lib/auth-config"

type User = {
  id: string
  username: string
  displayName: string
  role: PanelRole
  active: boolean
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

  function update(id: string, patch: Partial<User>) {
    setUsers((current) => current.map((user) => user.id === id ? { ...user, ...patch } : user))
  }

  function toggleFeature(user: User, feature: FeatureKey) {
    const next = user.permissions.includes(feature)
      ? user.permissions.filter((item) => item !== feature)
      : [...user.permissions, feature]
    update(user.id, { permissions: next })
  }
  return <Card className="border-white/[.08] bg-card py-0">
    <CardHeader className="border-b border-white/[.06] p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/[.06]">
          <UserCog className="size-4 text-primary"/>
        </div>
        <div>
          <CardTitle className="text-base">Usuários e acessos</CardTitle>
          <CardDescription>Libere módulos individualmente para cada login.</CardDescription>
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
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const allowed = user.permissions.includes(feature.key)
              return <label key={feature.key} className={"flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition " + (allowed ? "border-primary/20 bg-primary/[.05] text-zinc-200" : "border-white/[.06] text-zinc-600")}>
                <input type="checkbox" checked={allowed} onChange={() => toggleFeature(user, feature.key)}/>
                <span>{feature.label}</span>
              </label>
            })}
          </div>

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
}
