"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { FeatureKey, PanelRole } from "@/lib/auth-config"

export type AuthUser = {
  sub: string
  username: string
  displayName: string
  role: PanelRole
  permissions: FeatureKey[]
  mustChangePassword: boolean
  exp: number
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  has: (feature: FeatureKey) => boolean
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [loading, setLoading] = React.useState(true)

  const refresh = React.useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" })
      if (!response.ok) {
        setUser(null)
        return
      }
      const body = await response.json()
      setUser(body.user ?? null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const timer = window.setTimeout(() => { void refresh() }, 0)
    return () => window.clearTimeout(timer)
  }, [refresh])
  const has = React.useCallback(
    (feature: FeatureKey) => Boolean(user?.permissions.includes(feature)),
    [user],
  )

  const logout = React.useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined)
    router.push("/login")
    router.refresh()
  }, [router])

  const value = React.useMemo(
    () => ({ user, loading, has, logout, refresh }),
    [user, loading, has, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider")
  return context
}
