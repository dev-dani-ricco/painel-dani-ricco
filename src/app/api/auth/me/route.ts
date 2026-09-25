import { NextResponse } from "next/server"
import { getEffectivePermissions, getUserById } from "@/lib/auth-db"
import { currentSession } from "@/lib/auth-server"
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/auth-session"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await currentSession()
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 })

  const user = await getUserById(session.sub)
  if (!user || !user.active) {
    const response = NextResponse.json({ authenticated: false }, { status: 401 })
    response.cookies.delete(SESSION_COOKIE)
    return response
  }

  const permissions = await getEffectivePermissions(user.id, user.role)
  const refreshed = {
    sub: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    permissions,
    mustChangePassword: user.must_change_password,
  }
  const token = await signSession(refreshed)
  const response = NextResponse.json({
    authenticated: true,
    user: { ...refreshed, exp: session.exp },
  })
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  return response
}
