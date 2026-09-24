import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import {
  createKnowledgeSource,
  listKnowledgeSources,
} from "@/lib/knowledge-db"
import {
  classifyKnowledgeKind,
  processKnowledgeFile,
} from "@/lib/knowledge-processing"
import { storeKnowledgeFile } from "@/lib/knowledge-storage"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

export async function GET(request: Request) {
  try {
    const projectId = new URL(request.url).searchParams.get("projectId")?.trim()
    if (!projectId) return NextResponse.json({ error: "PROJECT_REQUIRED" }, { status: 400 })
    const sources = await listKnowledgeSources(projectId)
    return NextResponse.json({ sources })
  } catch (error) {
    console.error("knowledge sources GET failed", error)
    return NextResponse.json({ error: "KNOWLEDGE_DATABASE_UNAVAILABLE" }, { status: 503 })
  }
}
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const body = await request.json() as {
        projectId?: string
        title?: string
        content?: string
      }
      const projectId = body.projectId?.trim()
      const content = body.content?.trim()
      if (!projectId || !content) {
        return NextResponse.json({ error: "PROJECT_AND_CONTENT_REQUIRED" }, { status: 400 })
      }
      const source = await createKnowledgeSource({
        projectId,
        kind: "note",
        title: body.title?.trim() || content.slice(0, 80),
        status: "ready",
        extractedText: content,
        metadata: { processor: "operator-note" },
      })
      return NextResponse.json({ source }, { status: 201 })
    }

    const form = await request.formData()
    const projectId = String(form.get("projectId") || "").trim()
    const file = form.get("file")
    if (!projectId || !(file instanceof File)) {
      return NextResponse.json({ error: "PROJECT_AND_FILE_REQUIRED" }, { status: 400 })
    }
    if (!file.size) return NextResponse.json({ error: "EMPTY_FILE" }, { status: 400 })
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "FILE_TOO_LARGE", maxBytes: MAX_UPLOAD_BYTES }, { status: 413 })
    }

    const sourceId = randomUUID()
    const stored = await storeKnowledgeFile({ projectId, sourceId, file })
    let processed
    try {
      processed = await processKnowledgeFile(file)
    } catch (error) {
      console.error("knowledge file processing failed", error)
      processed = {
        extractedText: null,
        status: "stored" as const,
        processor: "failed",
        warning: error instanceof Error ? error.name : "PROCESSING_FAILED",
      }
    }

    const source = await createKnowledgeSource({
      id: sourceId,
      projectId,
      kind: classifyKnowledgeKind(file),
      title: file.name,
      originalFilename: file.name,
      mimeType: file.type || null,
      sizeBytes: file.size,
      storagePath: stored.path,
      status: processed.status,
      extractedText: processed.extractedText,
      metadata: {
        storageProvider: stored.provider,
        processor: processed.processor,
        warning: processed.warning ?? null,
      },
    })
    return NextResponse.json({
      source,
      processing: {
        status: processed.status,
        processor: processed.processor,
        warning: processed.warning ?? null,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("knowledge sources POST failed", error)
    return NextResponse.json({ error: "SOURCE_CREATE_FAILED" }, { status: 500 })
  }
}
