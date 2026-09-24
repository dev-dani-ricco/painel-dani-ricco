import { NextResponse } from "next/server"
import { createKnowledgeProject, listKnowledgeProjects } from "@/lib/knowledge-db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const projects = await listKnowledgeProjects()
    return NextResponse.json({ projects })
  } catch (error) {
    console.error("knowledge projects GET failed", error)
    return NextResponse.json({ error: "KNOWLEDGE_DATABASE_UNAVAILABLE" }, { status: 503 })
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      name?: string
      slug?: string
      description?: string
    }
    const name = body.name?.trim()
    const slug = body.slug?.trim().toLowerCase()
    if (!name || !slug || !/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(slug)) {
      return NextResponse.json({ error: "INVALID_PROJECT" }, { status: 400 })
    }
    const project = await createKnowledgeProject({
      name,
      slug,
      description: body.description?.trim() || undefined,
    })
    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error("knowledge projects POST failed", error)
    return NextResponse.json({ error: "PROJECT_CREATE_FAILED" }, { status: 500 })
  }
}
