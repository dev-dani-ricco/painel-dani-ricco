import { randomUUID } from "node:crypto"
import { getSql } from "@/lib/db"

let knowledgeSchemaPromise: Promise<void> | null = null

export type KnowledgeProject = {
  id: string
  slug: string
  name: string
  description: string | null
}

export type KnowledgeSource = {
  id: string
  project_id: string
  kind: "note" | "file" | "audio" | "image"
  title: string
  original_filename: string | null
  mime_type: string | null
  size_bytes: number | null
  storage_path: string | null
  status: string
  extracted_text: string | null
  created_at: string
}
export function ensureKnowledgeSchema() {
  if (knowledgeSchemaPromise) return knowledgeSchemaPromise
  const sql = getSql()
  knowledgeSchemaPromise = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS dani_knowledge_projects (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS dani_knowledge_sources (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES dani_knowledge_projects(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        original_filename TEXT,
        mime_type TEXT,
        size_bytes BIGINT,
        storage_path TEXT,
        status TEXT NOT NULL DEFAULT 'ready',
        extracted_text TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS dani_knowledge_messages (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES dani_knowledge_projects(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        source_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    await sql`
      CREATE INDEX IF NOT EXISTS dani_knowledge_sources_project_created_idx
      ON dani_knowledge_sources(project_id, created_at DESC)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS dani_knowledge_sources_fts_idx
      ON dani_knowledge_sources
      USING GIN (to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(extracted_text, '')))
    `
    const seeds = [
      ["dani-institucional", "dani-institucional", "Dani Ricco · Institucional", "Método IMPAR, posicionamento, comunicação e repertório institucional."],
      ["painel-dani", "painel-dani", "Painel Dani Ricco", "Conhecimento operacional do painel, lançamento e produtos digitais."],
      ["impar-outfit", "impar-outfit", "IMPAR OUTFIT", "Conhecimento autorizado para o Universo ÍMPAR e seus produtos."],
    ] as const
    for (const [id, slug, name, description] of seeds) {
      await sql`
        INSERT INTO dani_knowledge_projects (id, slug, name, description)
        VALUES (${id}, ${slug}, ${name}, ${description})
        ON CONFLICT (id) DO NOTHING
      `
    }
  })()
  return knowledgeSchemaPromise
}

export async function listKnowledgeProjects(): Promise<KnowledgeProject[]> {
  await ensureKnowledgeSchema()
  const rows = await getSql()`
    SELECT id, slug, name, description
    FROM dani_knowledge_projects
    ORDER BY name
  `
  return rows as unknown as KnowledgeProject[]
}
export async function createKnowledgeProject(input: { name: string; slug: string; description?: string }) {
  await ensureKnowledgeSchema()
  const id = input.slug
  const rows = await getSql()`
    INSERT INTO dani_knowledge_projects (id, slug, name, description)
    VALUES (${id}, ${input.slug}, ${input.name}, ${input.description ?? null})
    RETURNING id, slug, name, description
  ` as KnowledgeProject[]
  return rows[0]
}

export async function listKnowledgeSources(projectId: string): Promise<KnowledgeSource[]> {
  await ensureKnowledgeSchema()
  const rows = await getSql()`
    SELECT id, project_id, kind, title, original_filename, mime_type,
           size_bytes, storage_path, status, extracted_text, created_at
    FROM dani_knowledge_sources
    WHERE project_id = ${projectId}
    ORDER BY created_at DESC
    LIMIT 200
  `
  return rows as unknown as KnowledgeSource[]
}
export async function createKnowledgeSource(input: {
  id?: string
  projectId: string
  kind: KnowledgeSource["kind"]
  title: string
  originalFilename?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  storagePath?: string | null
  status?: string
  extractedText?: string | null
  metadata?: Record<string, unknown>
}) {
  await ensureKnowledgeSchema()
  const id = input.id ?? randomUUID()
  const rows = await getSql()`
    INSERT INTO dani_knowledge_sources (
      id, project_id, kind, title, original_filename, mime_type,
      size_bytes, storage_path, status, extracted_text, metadata
    ) VALUES (
      ${id}, ${input.projectId}, ${input.kind}, ${input.title},
      ${input.originalFilename ?? null}, ${input.mimeType ?? null},
      ${input.sizeBytes ?? null}, ${input.storagePath ?? null},
      ${input.status ?? "ready"}, ${input.extractedText ?? null},
      ${JSON.stringify(input.metadata ?? {})}::jsonb
    )
    RETURNING id, project_id, kind, title, original_filename, mime_type,
              size_bytes, storage_path, status, extracted_text, created_at
  ` as KnowledgeSource[]
  return rows[0]
}
export async function saveKnowledgeMessage(input: {
  projectId: string
  role: "user" | "assistant"
  content: string
  sourceIds?: string[]
}) {
  await ensureKnowledgeSchema()
  const id = randomUUID()
  await getSql()`
    INSERT INTO dani_knowledge_messages (id, project_id, role, content, source_ids)
    VALUES (${id}, ${input.projectId}, ${input.role}, ${input.content},
            ${JSON.stringify(input.sourceIds ?? [])}::jsonb)
  `
  return id
}

export async function retrieveKnowledge(projectId: string, query: string, limit = 8) {
  await ensureKnowledgeSchema()
  const sql = getSql()
  const rows = await sql`
    SELECT id, title, kind, original_filename, extracted_text,
           ts_rank_cd(
             to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(extracted_text, '')),
             websearch_to_tsquery('simple', ${query})
           ) AS score
    FROM dani_knowledge_sources
    WHERE project_id = ${projectId}
      AND extracted_text IS NOT NULL
      AND to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(extracted_text, ''))
          @@ websearch_to_tsquery('simple', ${query})
    ORDER BY score DESC, created_at DESC
    LIMIT ${limit}
  ` as Array<{
    id: string
    title: string
    kind: string
    original_filename: string | null
    extracted_text: string
    score: number
  }>

  if (rows.length) return rows

  const fallback = await sql`
    SELECT id, title, kind, original_filename, extracted_text, 0::float AS score
    FROM dani_knowledge_sources
    WHERE project_id = ${projectId} AND extracted_text IS NOT NULL
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return fallback as unknown as typeof rows
}
