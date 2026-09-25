import { NextResponse } from "next/server"
import { getEffectivePermissions, getUserById, updateUserPassword } from "@/lib/auth-db"
import { hashPassword, passwordPolicyError, verifyPassword, verifyTemporaryPassword } from "@/lib/auth-password"
import { currentSession } from "@/lib/auth-server"
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/auth-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const session = await currentSession()
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  try {
    const body = await request.json() as {
      currentPassword?: string
      newPassword?: string
      confirmPassword?: string
    }

    const currentPassword = body.currentPassword ?? ""
    const newPassword = body.newPassword ?? ""
    const confirmPassword = body.confirmPassword ?? ""

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 })
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "As novas senhas não coincidem." }, { status: 400 })
    }

    const policyError = passwordPolicyError(newPassword)
    if (policyError) {
      return NextResponse.json({ error: policyError }, { status: 400 })
    }

    const user = await getUserById(session.sub)
    if (!user || !user.active) {
      return NextResponse.json({ error: "Usuário não disponível." }, { status: 404 })
    }

    const currentValid =
      verifyTemporaryPassword(currentPassword, user.must_change_password) ||
      await verifyPassword(
        currentPassword,
        user.password_salt,
        user.password_hash,
      )

    if (!currentValid) {
      return NextResponse.json({ error: "A senha atual está incorreta." }, { status: 400 })
    }

    const samePassword = await verifyPassword(
      newPassword,
      user.password_salt,
      user.password_hash,
    )
    if (samePassword) {
      return NextResponse.json({ error: "Escolha uma senha diferente da atual." }, { status: 400 })
    }

    const credentials = await hashPassword(newPassword)
    const updated = await updateUserPassword({
      userId: user.id,
      passwordSalt: credentials.salt,
      passwordHash: credentials.hash,
      mustChangePassword: false,
    })
    if (!updated) throw new Error("USER_NOT_FOUND")

    const permissions = await getEffectivePermissions(updated.id, updated.role)
    const token = await signSession({
      sub: updated.id,
      username: updated.username,
      displayName: updated.display_name,
      role: updated.role,
      permissions,
      mustChangePassword: false,
    })

    const response = NextResponse.json({ ok: true })
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    })
    return response
  } catch (error) {
    console.error("self password change failed", error)
    return NextResponse.json({ error: "Não foi possível alterar a senha." }, { status: 500 })
  }
}
