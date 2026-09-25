import { NextResponse } from "next/server"
import { getEffectivePermissions, getUserByUsername } from "@/lib/auth-db"
import { verifyPassword } from "@/lib/auth-password"
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/auth-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json() as { username?: string; password?: string }
    const username = body.username?.trim()
    const password = body.password ?? ""
    if (!username || !password) {
      return NextResponse.json({ error: "Usuário e senha são obrigatórios." }, { status: 400 })
    }
    const user = await getUserByUsername(username)
    if (!user || !user.active) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password_salt, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 })
    }

    const permissions = await getEffectivePermissions(user.id, user.role)
    const token = await signSession({
      sub: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      permissions,
    })
    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        permissions,
      },
    })
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    })
    return response
  } catch (error) {
    console.error("panel login failed", error)
    return NextResponse.json({ error: "Não foi possível entrar no painel." }, { status: 500 })
  }
}
