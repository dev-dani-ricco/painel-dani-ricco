import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import {
  createKnowledgeSource,
  listCloneSources,
  listKnowledgeSources,
} from "@/lib/knowledge-db"
import { classifyCloneContent } from "@/lib/clone-classification"
import { currentSession } from "@/lib/auth-server"
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
    const sources = projectId
      ? await listKnowledgeSources(projectId)
      : await listCloneSources()
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
        kind?: "note" | "audio"
        sourceMode?: "direct-memory" | "browser-audio-transcript"
      }
      const projectId = body.projectId?.trim() || "dani-clone"
      const content = body.content?.trim()
      if (!content) {
        return NextResponse.json({ error: "CONTENT_REQUIRED" }, { status: 400 })
      }
      const session = await currentSession()
      const classification = await classifyCloneContent({
        request,
        text: content,
        title: body.title?.trim() || content.slice(0, 80),
      })
      const kind = body.kind === "audio" ? "audio" : "note"
      const sourceMode = body.sourceMode === "browser-audio-transcript"
        ? "browser-audio-transcript"
        : "direct-memory"
      const source = await createKnowledgeSource({
        projectId,
        kind,
        title: body.title?.trim() || content.slice(0, 80),
        status: "ready",
        extractedText: content,
        metadata: {
          processor: kind === "audio" ? "browser-speech-recognition" : "operator-note",
          ...classification,
          contributor: session?.username || null,
          contributorName: session?.displayName || null,
          sourceMode,
        },
      })
      return NextResponse.json({ source }, { status: 201 })
    }

    const form = await request.formData()
    const projectId = String(form.get("projectId") || "dani-clone").trim() || "dani-clone"
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 })
    }
    if (!file.size) return NextResponse.json({ error: "EMPTY_FILE" }, { status: 400 })
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "FILE_TOO_LARGE", maxBytes: MAX_UPLOAD_BYTES }, { status: 413 })
    }

    const sourceId = randomUUID()
    const stored = await storeKnowledgeFile({ projectId, sourceId, file })
    let processed
    try {
      processed = await processKnowledgeFile(file, request)
    } catch (error) {
      console.error("knowledge file processing failed", error)
      processed = {
        extractedText: null,
        status: "stored" as const,
        processor: "failed",
        warning: error instanceof Error ? error.name : "PROCESSING_FAILED",
      }
    }

    const session = await currentSession()
    const classification = await classifyCloneContent({
      request,
      text: processed.extractedText || "",
      title: file.name,
    })

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
        ...classification,
        contributor: session?.username || null,
        contributorName: session?.displayName || null,
        sourceMode: "uploaded-source",
      },
    })
    return NextResponse.json({
      source,
      processing: {
        status: processed.status,
        processor: processed.processor,
        warning: processed.warning ?? null,
        archivedOriginal: stored.provider !== "ephemeral",
        storageProvider: stored.provider,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("knowledge sources POST failed", error)
    return NextResponse.json({ error: "SOURCE_CREATE_FAILED" }, { status: 500 })
  }
}
