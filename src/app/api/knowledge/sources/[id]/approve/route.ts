import { NextResponse } from "next/server"
import { currentSession } from "@/lib/auth-server"
import { approveKnowledgeSourceWithAudit } from "@/lib/knowledge-db"
import { canApproveKnowledge } from "@/lib/knowledge-governance"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await currentSession()
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  if (!canApproveKnowledge(session.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  try {
    const { id } = await context.params
    const approved = await approveKnowledgeSourceWithAudit({
      sourceId: id,
      actorIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: request.headers.get("user-agent"),
      requestId: request.headers.get("x-vercel-id") || request.headers.get("x-request-id") || crypto.randomUUID(),
      actor: {
        userId: session.sub,
        username: session.username,
        displayName: session.displayName,
        role: session.role,
      },
    })
    return NextResponse.json({ ok: true, ...approved })
  } catch (error) {
    if (error instanceof Error && error.message === "SOURCE_NOT_FOUND") {
      return NextResponse.json({ error: "Memória não encontrada." }, { status: 404 })
    }
    console.error("knowledge source approval failed", error)
    return NextResponse.json({ error: "Não foi possível aprovar a memória." }, { status: 500 })
  }
}
