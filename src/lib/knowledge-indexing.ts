import { cloneAI } from "@/lib/clone-ai"
import { chunkKnowledgeText, type KnowledgeChunkDraft } from "@/lib/knowledge-chunking"
import {
  ensureKnowledgeSchema,
  recordKnowledgeIngestionEvent,
} from "@/lib/knowledge-db"
import { getSql } from "@/lib/db"
import type { KnowledgeIngestionMode } from "@/lib/knowledge-governance"
import { analyzeQuestionnaireChunks } from "@/lib/questionnaire-analysis"

const EMBEDDING_DIMENSIONS = 1536
const MAX_RETRIEVAL_CANDIDATES = 32

type SourceRow = {
  id: string
  project_id: string
  title: string
  extracted_text: string | null
  metadata: Record<string, unknown>
  authority_type: string
  authority_weight: number
  lifecycle_status: string
}

type RetrievalRow = {
  chunk_id: string
  source_id: string
  title: string
  kind: string
  original_filename: string | null
  content: string
  section_title: string | null
  source_metadata: Record<string, unknown>
  chunk_metadata: Record<string, unknown>
  authority_type: string
  authority_weight: number
  lexical_score?: number
  semantic_similarity?: number
}

export type RetrievedKnowledge = {
  id: string
  chunkId: string
  title: string
  kind: string
  original_filename: string | null
  extracted_text: string
  metadata: Record<string, unknown>
  score: number
  lexicalScore: number
  semanticSimilarity: number | null
}

function vectorLiteral(values: number[]) {
  return "[" + values.join(",") + "]"
}

function embeddingModelFor(source: "openai" | "vercel-gateway") {
  return source === "openai"
    ? process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"
    : process.env.AI_GATEWAY_EMBEDDING_MODEL || "openai/text-embedding-3-small"
}

async function embedValues(values: string[], request?: Request) {
  if (!values.length) return null
  const ai = cloneAI(request)
  if (!ai) return null
  const model = embeddingModelFor(ai.source)
  const vectors: number[][] = []

  for (let start = 0; start < values.length; start += 32) {
    const batch = values.slice(start, start + 32)
    const response = await ai.client.embeddings.create({
      model,
      input: batch,
    })
    const ordered = [...response.data].sort((a, b) => a.index - b.index)
    for (const item of ordered) {
      if (item.embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(`INVALID_EMBEDDING_DIMENSIONS:${item.embedding.length}`)
      }
      vectors.push(item.embedding)
    }
  }

  if (vectors.length !== values.length) throw new Error("EMBEDDING_COUNT_MISMATCH")
  return { model, vectors }
}

function chunkEmbeddingInput(source: SourceRow, chunk: KnowledgeChunkDraft) {
  const question = typeof chunk.metadata.question === "string"
    ? `Pergunta: ${chunk.metadata.question}\n`
    : ""
  return `${source.title}\n${question}${chunk.content}`.slice(0, 12000)
}

export async function indexKnowledgeSource(input: {
  sourceId: string
  request?: Request
  ingestionMode?: KnowledgeIngestionMode
}) {
  await ensureKnowledgeSchema()
  const sql = getSql()
  const rows = await sql`
    SELECT id, project_id, title, extracted_text, metadata,
           authority_type, authority_weight, lifecycle_status
    FROM dani_knowledge_sources
    WHERE id = ${input.sourceId}
    LIMIT 1
  `
  const source = (rows as unknown as SourceRow[])[0]
  if (!source) throw new Error("SOURCE_NOT_FOUND")

  const markStage = async (
    stage: string,
    status: "started" | "completed" | "warning" | "failed",
    details: Record<string, unknown> = {},
  ) => {
    await recordKnowledgeIngestionEvent({ sourceId: source.id, stage, status, details })
    if (status === "started") {
      await sql`
        UPDATE dani_knowledge_sources
        SET indexing_status = ${stage}
        WHERE id = ${source.id}
      `
    }
    console.info("[DANI_KNOWLEDGE]", JSON.stringify({
      sourceId: source.id,
      stage,
      status,
      ...details,
    }))
  }

  const text = source.extracted_text?.trim() || ""
  if (!text) {
    await markStage("extract", "warning", { reason: "no_text" })
    await sql`
      UPDATE dani_knowledge_sources
      SET indexing_status = 'no_text', indexed_at = NOW()
      WHERE id = ${source.id}
    `
    return { status: "no_text", chunks: 0, embedded: 0 }
  }

  await markStage("chunking", "started", { characters: text.length })

  const mode = input.ingestionMode ||
    (source.metadata?.ingestionMode === "questionnaire" ? "questionnaire" : "standard")
  const drafts = chunkKnowledgeText(text, mode)
  await markStage("chunking", "completed", {
    mode,
    chunks: drafts.length,
    questionnaireUnits: drafts.filter((item) => item.metadata.questionnaire === true).length,
  })

  let questionnaireAnalyses: Awaited<ReturnType<typeof analyzeQuestionnaireChunks>>["items"] = []
  if (mode === "questionnaire") {
    await markStage("analysis", "started", { chunks: drafts.length })
    const analysisRun = await analyzeQuestionnaireChunks(drafts, input.request)
    questionnaireAnalyses = analysisRun.items

    if (!analysisRun.aiAvailable) {
      await markStage("analysis", "failed", {
        analyzed: questionnaireAnalyses.length,
        successfulBatches: analysisRun.successfulBatches,
        failedBatches: analysisRun.failedBatches,
        reason: "ai_unavailable",
      })
      await sql`
        UPDATE dani_knowledge_sources
        SET indexing_status = 'analysis_failed'
        WHERE id = ${source.id}
      `
      throw new Error("QUESTIONNAIRE_AI_ANALYSIS_UNAVAILABLE")
    }

    await markStage("analysis", "completed", {
      analyzed: questionnaireAnalyses.length,
      reviewRequired: questionnaireAnalyses.filter((item) => item.needsHumanReview).length,
      highGuidance: questionnaireAnalyses.filter((item) => item.guidanceStrength === "high").length,
    })
  }

  await markStage("embedding", "started", { chunks: drafts.length })
  let embeddingPack: Awaited<ReturnType<typeof embedValues>> = null
  let embeddingWarning: string | null = null
  try {
    embeddingPack = await embedValues(
      drafts.map((chunk) => chunkEmbeddingInput(source, chunk)),
      input.request,
    )
  } catch (error) {
    embeddingWarning = error instanceof Error ? error.message : "EMBEDDING_FAILED"
    console.error("knowledge embedding fallback", error)
  }
  await markStage(
    "embedding",
    embeddingPack ? "completed" : mode === "questionnaire" ? "failed" : "warning",
    {
      embedded: embeddingPack?.vectors.length || 0,
      model: embeddingPack?.model || null,
      warning: embeddingWarning,
    },
  )

  if (mode === "questionnaire" && !embeddingPack) {
    await sql`
      UPDATE dani_knowledge_sources
      SET indexing_status = 'embedding_failed'
      WHERE id = ${source.id}
    `
    throw new Error("QUESTIONNAIRE_EMBEDDING_UNAVAILABLE")
  }

  await markStage("persistence", "started", { chunks: drafts.length })
  const now = new Date().toISOString()
  const queries = sql.transaction((tx) => {
    const statements = [
      tx`DELETE FROM dani_knowledge_chunks WHERE source_id = ${source.id}`,
    ]
    drafts.forEach((chunk, index) => {
      const analysis = questionnaireAnalyses[index]
      const metadata = {
        ...chunk.metadata,
        ...(analysis || {}),
        authorityType: source.authority_type,
        authorityWeight: Number(source.authority_weight),
        lifecycleStatus: source.lifecycle_status,
      }
      const embedding = embeddingPack?.vectors[index]
      const embeddingText = embedding ? vectorLiteral(embedding) : null
      statements.push(tx`
        INSERT INTO dani_knowledge_chunks (
          id, source_id, project_id, ordinal, section_title, content,
          metadata, embedding, embedding_model
        ) VALUES (
          ${crypto.randomUUID()}, ${source.id}, ${source.project_id}, ${chunk.ordinal},
          ${chunk.sectionTitle}, ${chunk.content}, ${JSON.stringify(metadata)}::jsonb,
          CAST(${embeddingText} AS vector), ${embedding ? embeddingPack?.model || null : null}
        )
      `)
    })
    statements.push(tx`
      UPDATE dani_knowledge_sources
      SET indexing_status = ${embeddingPack ? "ready" : "lexical_only"},
          indexed_at = NOW(),
          metadata = metadata || ${JSON.stringify({
            ingestionMode: mode,
            indexedAt: now,
            indexedChunks: drafts.length,
            embeddingModel: embeddingPack?.model || null,
            embeddingWarning,
          })}::jsonb
      WHERE id = ${source.id}
    `)
    return statements
  })
  await queries
  await markStage("persistence", "completed", {
    chunks: drafts.length,
    embedded: embeddingPack?.vectors.length || 0,
  })
  await markStage(
    source.lifecycle_status === "review_required" ? "review" : "activation",
    "completed",
    {
      lifecycleStatus: source.lifecycle_status,
      cloneEligible: source.lifecycle_status === "active",
    },
  )

  return {
    status: embeddingPack ? "ready" : "lexical_only",
    chunks: drafts.length,
    embedded: embeddingPack?.vectors.length || 0,
    embeddingModel: embeddingPack?.model || null,
    warning: embeddingWarning,
    reviewRequired: source.lifecycle_status === "review_required",
  }
}

async function queryEmbedding(query: string, request?: Request) {
  try {
    const result = await embedValues([query.slice(0, 8000)], request)
    return result?.vectors[0] || null
  } catch (error) {
    console.error("query embedding fallback", error)
    return null
  }
}

function candidateKey(row: RetrievalRow) {
  return row.chunk_id
}

function normalizeLexical(score: number) {
  if (!Number.isFinite(score) || score <= 0) return 0
  return 1 - Math.exp(-Math.min(score, 5) * 4)
}

function normalizeSemantic(score: number | undefined) {
  if (!Number.isFinite(score)) return 0
  const value = Number(score)
  return Math.max(0, Math.min(1, (value - 0.35) / 0.65))
}

function rankCandidate(row: RetrievalRow, hasSemantic: boolean) {
  const lexical = normalizeLexical(Number(row.lexical_score || 0))
  const semantic = normalizeSemantic(row.semantic_similarity)
  const authority = Math.max(0, Math.min(1, Number(row.authority_weight || 0.5)))
  const score = hasSemantic
    ? lexical * 0.4 + semantic * 0.5 + authority * 0.1
    : lexical * 0.78 + authority * 0.22
  return { lexical, semantic, authority, score }
}

export async function retrieveCloneHybrid(
  query: string,
  request?: Request,
  limit = 10,
): Promise<RetrievedKnowledge[]> {
  await ensureKnowledgeSchema()
  const sql = getSql()
  const trimmed = query.trim()
  if (!trimmed) return []

  const lexicalRows = await sql.query(
    `SELECT c.id AS chunk_id, s.id AS source_id, s.title, s.kind, s.original_filename,
            c.content, c.section_title, s.metadata AS source_metadata,
            c.metadata AS chunk_metadata, s.authority_type, s.authority_weight,
            ts_rank_cd(
              to_tsvector('simple', COALESCE(c.section_title, '') || ' ' || c.content || ' ' || COALESCE(c.metadata::text, '')),
              websearch_to_tsquery('simple', $1)
            ) AS lexical_score
       FROM dani_knowledge_chunks c
       JOIN dani_knowledge_sources s ON s.id = c.source_id
       JOIN dani_knowledge_projects p ON p.id = s.project_id
      WHERE p.clone_scope = 'global'
        AND s.lifecycle_status = 'active'
        AND (s.valid_from IS NULL OR s.valid_from <= NOW())
        AND (s.valid_to IS NULL OR s.valid_to > NOW())
        AND to_tsvector('simple', COALESCE(c.section_title, '') || ' ' || c.content || ' ' || COALESCE(c.metadata::text, ''))
            @@ websearch_to_tsquery('simple', $1)
      ORDER BY lexical_score DESC, s.created_at DESC
      LIMIT $2`,
    [trimmed, MAX_RETRIEVAL_CANDIDATES],
  ) as unknown as RetrievalRow[]

  const embedding = await queryEmbedding(trimmed, request)
  let semanticRows: RetrievalRow[] = []
  if (embedding) {
    const vector = vectorLiteral(embedding)
    semanticRows = await sql.query(
      `SELECT c.id AS chunk_id, s.id AS source_id, s.title, s.kind, s.original_filename,
              c.content, c.section_title, s.metadata AS source_metadata,
              c.metadata AS chunk_metadata, s.authority_type, s.authority_weight,
              1 - (c.embedding <=> CAST($1 AS vector)) AS semantic_similarity
         FROM dani_knowledge_chunks c
         JOIN dani_knowledge_sources s ON s.id = c.source_id
         JOIN dani_knowledge_projects p ON p.id = s.project_id
        WHERE p.clone_scope = 'global'
          AND s.lifecycle_status = 'active'
          AND c.embedding IS NOT NULL
          AND (s.valid_from IS NULL OR s.valid_from <= NOW())
          AND (s.valid_to IS NULL OR s.valid_to > NOW())
        ORDER BY c.embedding <=> CAST($1 AS vector)
        LIMIT $2`,
      [vector, MAX_RETRIEVAL_CANDIDATES],
    ) as unknown as RetrievalRow[]
  }

  const legacyRows = await sql.query(
    `SELECT ('legacy:' || s.id) AS chunk_id, s.id AS source_id, s.title, s.kind,
            s.original_filename, LEFT(s.extracted_text, 2200) AS content,
            NULL::text AS section_title, s.metadata AS source_metadata,
            '{}'::jsonb AS chunk_metadata, s.authority_type, s.authority_weight,
            ts_rank_cd(
              to_tsvector('simple', COALESCE(s.title, '') || ' ' || COALESCE(s.extracted_text, '') || ' ' || COALESCE(s.metadata::text, '')),
              websearch_to_tsquery('simple', $1)
            ) AS lexical_score
       FROM dani_knowledge_sources s
       JOIN dani_knowledge_projects p ON p.id = s.project_id
      WHERE p.clone_scope = 'global'
        AND s.lifecycle_status = 'active'
        AND s.extracted_text IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM dani_knowledge_chunks c WHERE c.source_id = s.id)
        AND to_tsvector('simple', COALESCE(s.title, '') || ' ' || COALESCE(s.extracted_text, '') || ' ' || COALESCE(s.metadata::text, ''))
            @@ websearch_to_tsquery('simple', $1)
      ORDER BY lexical_score DESC, s.created_at DESC
      LIMIT $2`,
    [trimmed, Math.min(MAX_RETRIEVAL_CANDIDATES, 16)],
  ) as unknown as RetrievalRow[]

  const merged = new Map<string, RetrievalRow>()
  for (const row of [...lexicalRows, ...semanticRows, ...legacyRows]) {
    const key = candidateKey(row)
    const current = merged.get(key)
    if (!current) {
      merged.set(key, row)
      continue
    }
    merged.set(key, {
      ...current,
      lexical_score: Math.max(Number(current.lexical_score || 0), Number(row.lexical_score || 0)),
      semantic_similarity: Math.max(Number(current.semantic_similarity || -1), Number(row.semantic_similarity || -1)),
    })
  }

  const hasSemantic = Boolean(embedding)
  return [...merged.values()]
    .map((row) => {
      const ranking = rankCandidate(row, hasSemantic)
      return { row, ranking }
    })
    .filter(({ row, ranking }) => {
      const semantic = Number(row.semantic_similarity || 0)
      const lexical = Number(row.lexical_score || 0)
      if (hasSemantic) {
        return ranking.score >= 0.22 && (lexical > 0 || semantic >= 0.52)
      }
      return lexical > 0 && ranking.score >= 0.18
    })
    .sort((a, b) => b.ranking.score - a.ranking.score)
    .slice(0, Math.max(1, Math.min(limit, 20)))
    .map(({ row, ranking }) => ({
      id: row.source_id,
      chunkId: row.chunk_id,
      title: row.title,
      kind: row.kind,
      original_filename: row.original_filename,
      extracted_text: row.content,
      metadata: {
        ...(row.source_metadata || {}),
        chunk: row.chunk_metadata || {},
        sectionTitle: row.section_title,
        authorityType: row.authority_type,
        authorityWeight: Number(row.authority_weight),
      },
      score: ranking.score,
      lexicalScore: ranking.lexical,
      semanticSimilarity: row.semantic_similarity === undefined
        ? null
        : Number(row.semantic_similarity),
    }))
}
