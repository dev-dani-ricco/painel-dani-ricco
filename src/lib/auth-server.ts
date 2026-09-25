import { cookies } from "next/headers"
import { SESSION_COOKIE, verifySession } from "@/lib/auth-session"

export async function currentSession() {
  const store = await cookies()
  return verifySession(store.get(SESSION_COOKIE)?.value)
}

export async function requireSession() {
  const session = await currentSession()
  if (!session) throw new Error("UNAUTHENTICATED")
  return session
}

export function canManageUsers(role: string) {
  return role === "owner" || role === "admin" || role === "system"
}
