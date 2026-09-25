import { NextResponse } from "next/server"
import { FEATURES, type FeatureKey, type PanelRole } from "@/lib/auth-config"
import { listUsers, updateUserAccess } from "@/lib/auth-db"
import { canManageUsers, currentSession } from "@/lib/auth-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function adminSession() {
  const session = await currentSession()
  if (!session || !canManageUsers(session.role)) return null
  return session
}

export async function GET() {
  const session = await adminSession()
  if (!session) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  return NextResponse.json({ users: await listUsers(), features: FEATURES })
}
export async function PATCH(request: Request) {
  const session = await adminSession()
  if (!session) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  try {
    const body = await request.json() as {
      userId?: string
      role?: PanelRole
      active?: boolean
      mustChangePassword?: boolean
      permissions?: FeatureKey[]
    }
    if (!body.userId) {
      return NextResponse.json({ error: "USER_REQUIRED" }, { status: 400 })
    }

    if (body.permissions && !Array.isArray(body.permissions)) {
      return NextResponse.json({ error: "INVALID_PERMISSIONS" }, { status: 400 })
    }
    const user = await updateUserAccess({
      userId: body.userId,
      role: body.role,
      active: body.active,
      mustChangePassword: body.mustChangePassword,
      permissions: body.permissions,
    })
    return NextResponse.json({ user })
  } catch (error) {
    console.error("user access update failed", error)
    return NextResponse.json({ error: "USER_UPDATE_FAILED" }, { status: 500 })
  }
}
