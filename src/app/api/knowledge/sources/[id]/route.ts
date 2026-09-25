import { NextResponse } from "next/server"
import { currentSession } from "@/lib/auth-server"
import { deleteKnowledgeSourceWithAudit } from "@/lib/knowledge-db"
import { deleteStoredKnowledgeFile } from "@/lib/knowledge-storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DELETE_USERS = new Set(["DANI", "TIBROKER"])
const CONFIRMATION = "APAGAR MEMÓRIA"

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await currentSession()
  if (!session) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  }

  if (!DELETE_USERS.has(session.username.toUpperCase())) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  try {
    const { id } = await context.params
    const body = await request.json() as {
      reason?: string
      confirmationText?: string
    }

    const reason = body.reason?.trim() ?? ""
    const confirmationText = body.confirmationText?.trim().toUpperCase() ?? ""

    if (reason.length < 10) {
      return NextResponse.json(
        { error: "Explique o motivo da exclusão com pelo menos 10 caracteres." },
        { status: 400 },
      )
    }

    if (confirmationText !== CONFIRMATION) {
      return NextResponse.json(
        { error: 'Digite exatamente "APAGAR MEMÓRIA" para confirmar.' },
        { status: 400 },
      )
    }

    const deleted = await deleteKnowledgeSourceWithAudit({
      sourceId: id,
      actorIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: request.headers.get("user-agent"),
      requestId:
        request.headers.get("x-vercel-id") ||
        request.headers.get("x-request-id") ||
        crypto.randomUUID(),
      actor: {
        userId: session.sub,
        username: session.username,
        displayName: session.displayName,
        role: session.role,
      },
      reason,
      confirmationText,
    })

    const storage = await deleteStoredKnowledgeFile(deleted.deletedSource.storagePath)

    return NextResponse.json({
      ok: true,
      auditId: deleted.auditId,
      deleted: deleted.deletedSource,
      storage,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "SOURCE_NOT_FOUND") {
      return NextResponse.json({ error: "Memória não encontrada." }, { status: 404 })
    }
    console.error("knowledge source delete failed", error)
    return NextResponse.json(
      { error: "Não foi possível apagar a memória." },
      { status: 500 },
    )
  }
}
