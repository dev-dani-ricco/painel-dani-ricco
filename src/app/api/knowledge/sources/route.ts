import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import {
  createKnowledgeSource,
  listCloneSources,
  listKnowledgeSources,
  recordKnowledgeIngestionEvent,
} from "@/lib/knowledge-db"
import { classifyCloneContent } from "@/lib/clone-classification"
import { currentSession } from "@/lib/auth-server"
import {
  authorityWeight,
  canApproveKnowledge,
  canContributeKnowledge,
  defaultAuthorityForUser,
  lifecycleForIngestion,
  normalizeAuthorityType,
  type KnowledgeIngestionMode,
} from "@/lib/knowledge-governance"
import { indexKnowledgeSource } from "@/lib/knowledge-indexing"
import {
  classifyKnowledgeKind,
  processKnowledgeFile,
} from "@/lib/knowledge-processing"
import { storeKnowledgeFile } from "@/lib/knowledge-storage"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 300

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

function ingestionMode(value: unknown): KnowledgeIngestionMode {
  return value === "questionnaire" ? "questionnaire" : "standard"
}

function resolvedAuthority(
  requested: unknown,
  session: NonNullable<Awaited<ReturnType<typeof currentSession>>>,
) {
  const fallback = defaultAuthorityForUser(session.username)
  if (!canApproveKnowledge(session.role) && session.username.toUpperCase() !== "DANI") {
    return fallback
  }
  return normalizeAuthorityType(requested, fallback)
}

async function indexSource(
  sourceId: string,
  request: Request,
  mode: KnowledgeIngestionMode,
) {
  try {
    return await indexKnowledgeSource({ sourceId, request, ingestionMode: mode })
  } catch (error) {
    console.error("knowledge indexing failed", error)
    return {
      status: "failed",
      chunks: 0,
      embedded: 0,
      warning: error instanceof Error ? error.message : "INDEXING_FAILED",
    }
  }
}

export async function GET(request: Request) {
  const session = await currentSession()
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
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
  const session = await currentSession()
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  if (!canContributeKnowledge(session.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  try {
    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const body = await request.json() as {
        projectId?: string
        title?: string
        content?: string
        kind?: "note" | "audio"
        sourceMode?: "direct-memory" | "browser-audio-transcript"
        ingestionMode?: KnowledgeIngestionMode
        authorityType?: string
        supersedesSourceId?: string
      }
      const projectId = body.projectId?.trim() || "dani-clone"
      const content = body.content?.trim()
      if (!content) return NextResponse.json({ error: "CONTENT_REQUIRED" }, { status: 400 })

      const mode = ingestionMode(body.ingestionMode)
      const authorityType = resolvedAuthority(body.authorityType, session)
      const classification = await classifyCloneContent({
        request,
        text: content,
        title: body.title?.trim() || content.slice(0, 80),
      })
      const kind = body.kind === "audio" ? "audio" : "note"
      const sourceMode = body.sourceMode === "browser-audio-transcript"
        ? "browser-audio-transcript"
        : "direct-memory"
      const lifecycleStatus = lifecycleForIngestion(mode)

      const source = await createKnowledgeSource({
        projectId,
        kind,
        title: body.title?.trim() || content.slice(0, 80),
        status: "ready",
        extractedText: content,
        authorityType,
        authorityWeight: authorityWeight(authorityType),
        lifecycleStatus,
        supersedesSourceId: body.supersedesSourceId?.trim() || null,
        metadata: {
          processor: kind === "audio" ? "browser-speech-recognition" : "operator-note",
          ...classification,
          contributor: session.username,
          contributorName: session.displayName || null,
          sourceMode,
          ingestionMode: mode,
          reviewStatus: lifecycleStatus === "review_required" ? "pending" : "not_required",
        },
      })
      await recordKnowledgeIngestionEvent({
        sourceId: source.id,
        stage: "received",
        status: "completed",
        details: {
          mode,
          kind,
          characters: content.length,
          authorityType,
          lifecycleStatus,
        },
      })
      const indexing = await indexSource(source.id, request, mode)
      if (mode === "questionnaire" && indexing.status === "failed") {
        return NextResponse.json({
          error: "QUESTIONNAIRE_PROCESSING_UNAVAILABLE",
          message: "O questionário foi preservado em revisão, mas a análise por IA não está disponível. Ele não foi ativado no clone.",
          source,
          indexing,
        }, { status: 503 })
      }
      return NextResponse.json({ source, indexing }, { status: 201 })
    }

    const form = await request.formData()
    const projectId = String(form.get("projectId") || "dani-clone").trim() || "dani-clone"
    const mode = ingestionMode(form.get("ingestionMode"))
    const authorityType = resolvedAuthority(form.get("authorityType"), session)
    const supersedesSourceId = String(form.get("supersedesSourceId") || "").trim() || null
    const file = form.get("file")
    if (!(file instanceof File)) return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 })
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

    const classification = await classifyCloneContent({
      request,
      text: processed.extractedText || "",
      title: file.name,
    })
    const lifecycleStatus = lifecycleForIngestion(mode)
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
      authorityType,
      authorityWeight: authorityWeight(authorityType),
      lifecycleStatus,
      supersedesSourceId,
      metadata: {
        storageProvider: stored.provider,
        processor: processed.processor,
        warning: processed.warning ?? null,
        ...classification,
        contributor: session.username,
        contributorName: session.displayName || null,
        sourceMode: "uploaded-source",
        ingestionMode: mode,
        reviewStatus: lifecycleStatus === "review_required" ? "pending" : "not_required",
      },
    })
    await recordKnowledgeIngestionEvent({
      sourceId: source.id,
      stage: "received",
      status: "completed",
      details: {
        mode,
        kind: source.kind,
        bytes: file.size,
        authorityType,
        lifecycleStatus,
        storageProvider: stored.provider,
      },
    })
    await recordKnowledgeIngestionEvent({
      sourceId: source.id,
      stage: "extraction",
      status: processed.extractedText ? "completed" : "warning",
      details: {
        processor: processed.processor,
        characters: processed.extractedText?.length || 0,
        warning: processed.warning ?? null,
      },
    })
    const indexing = processed.extractedText
      ? await indexSource(source.id, request, mode)
      : { status: "no_text", chunks: 0, embedded: 0, warning: processed.warning ?? null }

    if (mode === "questionnaire" && indexing.status === "failed") {
      return NextResponse.json({
        error: "QUESTIONNAIRE_PROCESSING_UNAVAILABLE",
        message: "O questionário foi preservado em revisão, mas a análise por IA não está disponível. Ele não foi ativado no clone.",
        source,
        indexing,
      }, { status: 503 })
    }

    return NextResponse.json({
      source,
      indexing,
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
