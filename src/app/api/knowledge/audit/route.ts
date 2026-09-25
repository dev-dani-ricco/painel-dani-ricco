import { NextResponse } from "next/server"
import { currentSession } from "@/lib/auth-server"
import { listKnowledgeAudit } from "@/lib/knowledge-db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const AUDIT_USERS = new Set(["DANI", "TIBROKER"])

export async function GET(request: Request) {
  const session = await currentSession()
  if (!session) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  }

  if (!AUDIT_USERS.has(session.username.toUpperCase())) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  const limit = Number(new URL(request.url).searchParams.get("limit") || 100)
  const entries = await listKnowledgeAudit(limit)
  return NextResponse.json({ entries })
}
