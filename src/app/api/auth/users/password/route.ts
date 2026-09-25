import { NextResponse } from "next/server"
import { getUserById, updateUserPassword } from "@/lib/auth-db"
import { hashPassword, passwordPolicyError } from "@/lib/auth-password"
import { canManageUsers, currentSession } from "@/lib/auth-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const session = await currentSession()
  if (!session || !canManageUsers(session.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  try {
    const body = await request.json() as {
      userId?: string
      newPassword?: string
      confirmPassword?: string
      mustChangePassword?: boolean
    }
    const userId = body.userId ?? ""
    const newPassword = body.newPassword ?? ""
    const confirmPassword = body.confirmPassword ?? ""

    if (!userId || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Preencha usuário, senha e confirmação." }, { status: 400 })
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "As senhas não coincidem." }, { status: 400 })
    }

    const policyError = passwordPolicyError(newPassword)
    if (policyError) {
      return NextResponse.json({ error: policyError }, { status: 400 })
    }

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })
    }
    const credentials = await hashPassword(newPassword)
    const updated = await updateUserPassword({
      userId,
      passwordSalt: credentials.salt,
      passwordHash: credentials.hash,
      mustChangePassword: body.mustChangePassword ?? true,
    })
    if (!updated) throw new Error("USER_NOT_FOUND")

    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        username: updated.username,
        mustChangePassword: updated.must_change_password,
      },
    })
  } catch (error) {
    console.error("admin password reset failed", error)
    return NextResponse.json({ error: "Não foi possível redefinir a senha." }, { status: 500 })
  }
}
