import { NextResponse } from "next/server"
import { currentSession } from "@/lib/auth-server"
import { clonePromptFor, CLONE_DOMAINS } from "@/lib/clone-blueprint"
import { cloneAI } from "@/lib/clone-ai"
import { classifyCloneContent } from "@/lib/clone-classification"
import { createKnowledgeSource, getCloneCoverage, listCloneSources } from "@/lib/knowledge-db"
import {
  authorityWeight,
  canContributeKnowledge,
  defaultAuthorityForUser,
} from "@/lib/knowledge-governance"
import { indexKnowledgeSource } from "@/lib/knowledge-indexing"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 120

export async function GET(request: Request) {
  const session = await currentSession()
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  try {
    const engine = cloneAI(request)?.source || "dani-core-local"
    const [coverage, recent] = await Promise.all([
      getCloneCoverage(),
      listCloneSources(80),
    ])
    const offset = Number(new URL(request.url).searchParams.get("offset") || 0)
    const prompt = clonePromptFor({ username: session.username, coverage, offset })
    const coveredDomains = CLONE_DOMAINS.filter((domain) => (coverage[domain.key] || 0) > 0).length
    const totalMemories = recent.length
    const classified = recent.filter((item) => item.metadata?.topic).length
    const pendingReview = recent.filter((item) => item.lifecycle_status === "review_required").length

    return NextResponse.json({
      prompt,
      stats: {
        totalMemories,
        coveredDomains,
        totalDomains: CLONE_DOMAINS.length,
        classified,
        pendingReview,
        coveragePercent: Math.round((coveredDomains / CLONE_DOMAINS.length) * 100),
        engine,
      },
      recent: recent.slice(0, 10),
    })
  } catch (error) {
    console.error("clone pulse GET failed", error)
    return NextResponse.json({ error: "CLONE_STATUS_FAILED" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await currentSession()
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  if (!canContributeKnowledge(session.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  try {
    const body = await request.json() as {
      promptId?: string
      domain?: string
      domainLabel?: string
      question?: string
      answer?: string
      confidence?: number
    }
    const answer = body.answer?.trim()
    const domain = body.domain?.trim()
    if (!answer || !domain) {
      return NextResponse.json({ error: "ANSWER_AND_DOMAIN_REQUIRED" }, { status: 400 })
    }

    const classification = await classifyCloneContent({
      request,
      text: answer,
      title: body.question?.trim() || body.domainLabel || domain,
    })
    const authorityType = defaultAuthorityForUser(session.username)

    const source = await createKnowledgeSource({
      projectId: "dani-clone",
      kind: "note",
      title: body.question?.trim().slice(0, 120) || "Resposta contextual",
      status: "ready",
      extractedText: answer,
      authorityType,
      authorityWeight: authorityWeight(authorityType),
      lifecycleStatus: "active",
      metadata: {
        ...classification,
        topic: domain,
        topicLabel: body.domainLabel || classification.topicLabel || domain,
        confidence: Math.max(1, Math.min(10, Number(body.confidence) || classification.confidence || 7)),
        contributor: session.username,
        contributorName: session.displayName,
        promptId: body.promptId || null,
        sourceMode: "adaptive-question",
        ingestionMode: "standard",
        reviewStatus: "not_required",
      },
    })
    const indexing = await indexKnowledgeSource({
      sourceId: source.id,
      request,
      ingestionMode: "standard",
    }).catch((error) => {
      console.error("adaptive answer indexing failed", error)
      return { status: "failed", chunks: 0, embedded: 0 }
    })

    const coverage = await getCloneCoverage()
    return NextResponse.json({
      source,
      indexing,
      nextPrompt: clonePromptFor({ username: session.username, coverage }),
    }, { status: 201 })
  } catch (error) {
    console.error("clone pulse POST failed", error)
    return NextResponse.json({ error: "CLONE_ANSWER_FAILED" }, { status: 500 })
  }
}
