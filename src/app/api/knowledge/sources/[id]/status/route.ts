import { NextResponse } from "next/server"
import { currentSession } from "@/lib/auth-server"
import { getKnowledgeSourceIngestionStatus } from "@/lib/knowledge-db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await currentSession()
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  try {
    const { id } = await context.params
    const status = await getKnowledgeSourceIngestionStatus(id)
    return NextResponse.json(status)
  } catch (error) {
    if (error instanceof Error && error.message === "SOURCE_NOT_FOUND") {
      return NextResponse.json({ error: "Memória não encontrada." }, { status: 404 })
    }
    console.error("knowledge ingestion status failed", error)
    return NextResponse.json({ error: "STATUS_UNAVAILABLE" }, { status: 500 })
  }
}
