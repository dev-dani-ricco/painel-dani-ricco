import { createHash, randomUUID } from "node:crypto"
import { getSql } from "@/lib/db"
import type {
  KnowledgeAuthorityType,
  KnowledgeLifecycleStatus,
} from "@/lib/knowledge-governance"

let knowledgeSchemaPromise: Promise<void> | null = null

export type KnowledgeProject = {
  id: string
  slug: string
  name: string
  description: string | null
  clone_scope: "global" | "project"
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
  metadata: Record<string, unknown>
  authority_type: string
  authority_weight: number
  lifecycle_status: string
  version: number
  supersedes_source_id: string | null
  approved_by: string | null
  approved_at: string | null
  valid_from: string | null
  valid_to: string | null
  indexed_at: string | null
  indexing_status: string
  created_at: string
}
export function ensureKnowledgeSchema() {
  if (knowledgeSchemaPromise) return knowledgeSchemaPromise
  const sql = getSql()
  knowledgeSchemaPromise = (async () => {
    await sql`
      CREATE EXTENSION IF NOT EXISTS vector
    `
    await sql`
      CREATE TABLE IF NOT EXISTS dani_knowledge_projects (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        clone_scope TEXT NOT NULL DEFAULT 'project',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    await sql`
      ALTER TABLE dani_knowledge_projects
      ADD COLUMN IF NOT EXISTS clone_scope TEXT NOT NULL DEFAULT 'project'
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
        authority_type TEXT NOT NULL DEFAULT 'external_reference',
        authority_weight DOUBLE PRECISION NOT NULL DEFAULT 0.6,
        lifecycle_status TEXT NOT NULL DEFAULT 'active',
        version INTEGER NOT NULL DEFAULT 1,
        supersedes_source_id TEXT,
        approved_by TEXT,
        approved_at TIMESTAMPTZ,
        valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        valid_to TIMESTAMPTZ,
        indexed_at TIMESTAMPTZ,
        indexing_status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    await sql`ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS authority_type TEXT NOT NULL DEFAULT 'external_reference'`
    await sql`ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS authority_weight DOUBLE PRECISION NOT NULL DEFAULT 0.6`
    await sql`ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS lifecycle_status TEXT NOT NULL DEFAULT 'active'`
    await sql`ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1`
    await sql`ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS supersedes_source_id TEXT`
    await sql`ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS approved_by TEXT`
    await sql`ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ`
    await sql`ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    await sql`ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS valid_to TIMESTAMPTZ`
    await sql`ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS indexed_at TIMESTAMPTZ`
    await sql`ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS indexing_status TEXT NOT NULL DEFAULT 'pending'`
    await sql`
      CREATE TABLE IF NOT EXISTS dani_knowledge_chunks (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL REFERENCES dani_knowledge_sources(id) ON DELETE CASCADE,
        project_id TEXT NOT NULL REFERENCES dani_knowledge_projects(id) ON DELETE CASCADE,
        ordinal INTEGER NOT NULL,
        section_title TEXT,
        content TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        embedding vector(1536),
        embedding_model TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(source_id, ordinal)
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
      CREATE TABLE IF NOT EXISTS dani_knowledge_ingestion_events (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL REFERENCES dani_knowledge_sources(id) ON DELETE CASCADE,
        stage TEXT NOT NULL,
        status TEXT NOT NULL,
        details JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    await sql`
      CREATE INDEX IF NOT EXISTS dani_knowledge_ingestion_events_source_idx
      ON dani_knowledge_ingestion_events(source_id, created_at)
    `
    await sql`
      CREATE TABLE IF NOT EXISTS dani_knowledge_audit (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        source_id TEXT NOT NULL,
        source_title TEXT NOT NULL,
        source_kind TEXT NOT NULL,
        source_project_id TEXT NOT NULL,
        source_original_filename TEXT,
        source_mime_type TEXT,
        source_storage_path TEXT,
        source_size_bytes BIGINT,
        source_content_length INTEGER NOT NULL DEFAULT 0,
        source_content_sha256 TEXT,
        source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        source_created_at TIMESTAMPTZ,
        actor_user_id TEXT NOT NULL,
        actor_username TEXT NOT NULL,
        actor_display_name TEXT,
        actor_role TEXT NOT NULL,
        actor_ip TEXT,
        user_agent TEXT,
        request_id TEXT,
        reason TEXT NOT NULL,
        confirmation_text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    await sql`
      ALTER TABLE dani_knowledge_audit ADD COLUMN IF NOT EXISTS actor_ip TEXT
    `
    await sql`
      ALTER TABLE dani_knowledge_audit ADD COLUMN IF NOT EXISTS user_agent TEXT
    `
    await sql`
      ALTER TABLE dani_knowledge_audit ADD COLUMN IF NOT EXISTS request_id TEXT
    `
    await sql`
      CREATE INDEX IF NOT EXISTS dani_knowledge_audit_created_idx
      ON dani_knowledge_audit(created_at DESC)
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
    await sql`
      CREATE INDEX IF NOT EXISTS dani_knowledge_chunks_source_idx
      ON dani_knowledge_chunks(source_id, ordinal)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS dani_knowledge_chunks_fts_idx
      ON dani_knowledge_chunks
      USING GIN (
        to_tsvector(
          'simple',
          COALESCE(section_title, '') || ' ' || content || ' ' || COALESCE(metadata::text, '')
        )
      )
    `
    await sql`
      CREATE INDEX IF NOT EXISTS dani_knowledge_chunks_embedding_hnsw_idx
      ON dani_knowledge_chunks
      USING hnsw (embedding vector_cosine_ops)
      WHERE embedding IS NOT NULL
    `
    const seeds = [
      ["dani-clone", "dani-clone", "Clone da Dani", "Memória central compartilhada do ecossistema Dani Ricco.", "global"],
      ["dani-institucional", "dani-institucional", "Dani Ricco · Institucional", "Método IMPAR, posicionamento, comunicação e repertório institucional.", "global"],
      ["painel-dani", "painel-dani", "Painel Dani Ricco", "Conhecimento operacional do painel, lançamento e produtos digitais.", "project"],
      ["impar-outfit", "impar-outfit", "IMPAR OUTFIT", "Conhecimento autorizado para o Universo ÍMPAR e seus produtos.", "project"],
    ] as const
    for (const [id, slug, name, description, cloneScope] of seeds) {
      await sql`
        INSERT INTO dani_knowledge_projects (id, slug, name, description, clone_scope)
        VALUES (${id}, ${slug}, ${name}, ${description}, ${cloneScope})
        ON CONFLICT (id) DO UPDATE
        SET clone_scope = EXCLUDED.clone_scope
      `
    }
  })()
  return knowledgeSchemaPromise
}

export async function listKnowledgeProjects(): Promise<KnowledgeProject[]> {
  await ensureKnowledgeSchema()
  const rows = await getSql()`
    SELECT id, slug, name, description, clone_scope
    FROM dani_knowledge_projects
    ORDER BY name
  `
  return rows as unknown as KnowledgeProject[]
}
export async function createKnowledgeProject(input: { name: string; slug: string; description?: string }) {
  await ensureKnowledgeSchema()
  const id = input.slug
  const rows = await getSql()`
    INSERT INTO dani_knowledge_projects (id, slug, name, description, clone_scope)
    VALUES (${id}, ${input.slug}, ${input.name}, ${input.description ?? null}, 'project')
    RETURNING id, slug, name, description, clone_scope
  ` as KnowledgeProject[]
  return rows[0]
}

export async function listKnowledgeSources(projectId: string): Promise<KnowledgeSource[]> {
  await ensureKnowledgeSchema()
  const rows = await getSql()`
    SELECT id, project_id, kind, title, original_filename, mime_type,
           size_bytes, storage_path, status, extracted_text, metadata,
           authority_type, authority_weight, lifecycle_status, version,
           supersedes_source_id, approved_by, approved_at, valid_from, valid_to,
           indexed_at, indexing_status, created_at
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
  authorityType?: KnowledgeAuthorityType
  authorityWeight?: number
  lifecycleStatus?: KnowledgeLifecycleStatus
  version?: number
  supersedesSourceId?: string | null
  validFrom?: string | null
  validTo?: string | null
}) {
  await ensureKnowledgeSchema()
  const id = input.id ?? randomUUID()
  const rows = await getSql()`
    INSERT INTO dani_knowledge_sources (
      id, project_id, kind, title, original_filename, mime_type,
      size_bytes, storage_path, status, extracted_text, metadata,
      authority_type, authority_weight, lifecycle_status, version,
      supersedes_source_id, valid_from, valid_to
    ) VALUES (
      ${id}, ${input.projectId}, ${input.kind}, ${input.title},
      ${input.originalFilename ?? null}, ${input.mimeType ?? null},
      ${input.sizeBytes ?? null}, ${input.storagePath ?? null},
      ${input.status ?? "ready"}, ${input.extractedText ?? null},
      ${JSON.stringify(input.metadata ?? {})}::jsonb,
      ${input.authorityType ?? "external_reference"},
      ${Math.max(0, Math.min(1, Number(input.authorityWeight ?? 0.6)))},
      ${input.lifecycleStatus ?? "active"},
      ${Math.max(1, Number(input.version ?? 1))},
      ${input.supersedesSourceId ?? null},
      COALESCE(${input.validFrom ?? null}::timestamptz, NOW()),
      ${input.validTo ?? null}
    )
    RETURNING id, project_id, kind, title, original_filename, mime_type,
              size_bytes, storage_path, status, extracted_text, metadata,
              authority_type, authority_weight, lifecycle_status, version,
              supersedes_source_id, approved_by, approved_at, valid_from, valid_to,
              indexed_at, indexing_status, created_at
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

export type KnowledgeIngestionEvent = {
  id: string
  source_id: string
  stage: string
  status: "started" | "completed" | "warning" | "failed"
  details: Record<string, unknown>
  created_at: string
}

export async function recordKnowledgeIngestionEvent(input: {
  sourceId: string
  stage: string
  status: KnowledgeIngestionEvent["status"]
  details?: Record<string, unknown>
}) {
  await ensureKnowledgeSchema()
  const id = randomUUID()
  await getSql()`
    INSERT INTO dani_knowledge_ingestion_events (id, source_id, stage, status, details)
    VALUES (
      ${id},
      ${input.sourceId},
      ${input.stage},
      ${input.status},
      ${JSON.stringify(input.details ?? {})}::jsonb
    )
  `
  return id
}

export async function listKnowledgeIngestionEvents(sourceId: string) {
  await ensureKnowledgeSchema()
  const rows = await getSql()`
    SELECT id, source_id, stage, status, details, created_at
    FROM dani_knowledge_ingestion_events
    WHERE source_id = ${sourceId}
    ORDER BY created_at ASC
  `
  return rows as unknown as KnowledgeIngestionEvent[]
}

export async function getKnowledgeSourceIngestionStatus(sourceId: string) {
  await ensureKnowledgeSchema()
  const sql = getSql()
  const sourceRows = await sql`
    SELECT id, project_id, kind, title, original_filename, mime_type,
           size_bytes, storage_path, status, extracted_text, metadata,
           authority_type, authority_weight, lifecycle_status, version,
           supersedes_source_id, approved_by, approved_at, valid_from, valid_to,
           indexed_at, indexing_status, created_at
    FROM dani_knowledge_sources
    WHERE id = ${sourceId}
    LIMIT 1
  `
  const source = (sourceRows as unknown as KnowledgeSource[])[0]
  if (!source) throw new Error("SOURCE_NOT_FOUND")

  const counts = await sql`
    SELECT COUNT(*)::int AS chunks,
           COUNT(*) FILTER (WHERE embedding IS NOT NULL)::int AS embedded
    FROM dani_knowledge_chunks
    WHERE source_id = ${sourceId}
  ` as Array<{ chunks: number; embedded: number }>

  return {
    source,
    chunks: Number(counts[0]?.chunks || 0),
    embedded: Number(counts[0]?.embedded || 0),
    events: await listKnowledgeIngestionEvents(sourceId),
  }
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

export async function listCloneSources(limit = 120): Promise<KnowledgeSource[]> {
  await ensureKnowledgeSchema()
  const rows = await getSql()`
    SELECT s.id, s.project_id, s.kind, s.title, s.original_filename, s.mime_type,
           s.size_bytes, s.storage_path, s.status, s.extracted_text, s.metadata,
           s.authority_type, s.authority_weight, s.lifecycle_status, s.version,
           s.supersedes_source_id, s.approved_by, s.approved_at, s.valid_from, s.valid_to,
           s.indexed_at, s.indexing_status, s.created_at
    FROM dani_knowledge_sources s
    JOIN dani_knowledge_projects p ON p.id = s.project_id
    WHERE p.clone_scope = 'global'
    ORDER BY s.created_at DESC
    LIMIT ${limit}
  `
  return rows as unknown as KnowledgeSource[]
}

export async function retrieveClone(query: string, limit = 10) {
  await ensureKnowledgeSchema()
  const sql = getSql()
  const rows = await sql`
    SELECT s.id, s.title, s.kind, s.original_filename, s.extracted_text, s.metadata,
           ts_rank_cd(
             to_tsvector(
               'simple',
               COALESCE(s.title, '') || ' ' ||
               COALESCE(s.extracted_text, '') || ' ' ||
               COALESCE(s.metadata::text, '')
             ),
             websearch_to_tsquery('simple', ${query})
           ) AS score
    FROM dani_knowledge_sources s
    JOIN dani_knowledge_projects p ON p.id = s.project_id
    WHERE p.clone_scope = 'global'
      AND s.lifecycle_status = 'active'
      AND s.extracted_text IS NOT NULL
      AND to_tsvector(
            'simple',
            COALESCE(s.title, '') || ' ' ||
            COALESCE(s.extracted_text, '') || ' ' ||
            COALESCE(s.metadata::text, '')
          ) @@ websearch_to_tsquery('simple', ${query})
    ORDER BY score DESC, s.created_at DESC
    LIMIT ${limit}
  ` as Array<{
    id: string
    title: string
    kind: string
    original_filename: string | null
    extracted_text: string
    metadata: Record<string, unknown>
    score: number
  }>
  return rows
}

export async function getCloneCoverage() {
  await ensureKnowledgeSchema()
  const rows = await getSql()`
    SELECT COALESCE(s.metadata->>'topic', 'unclassified') AS topic, COUNT(*)::int AS count
    FROM dani_knowledge_sources s
    JOIN dani_knowledge_projects p ON p.id = s.project_id
    WHERE p.clone_scope = 'global'
      AND s.lifecycle_status = 'active'
    GROUP BY COALESCE(s.metadata->>'topic', 'unclassified')
  ` as Array<{ topic: string; count: number }>

  const coverage: Record<string, number> = {}
  for (const row of rows) coverage[row.topic] = Number(row.count)
  return coverage
}


export type KnowledgeAuditEntry = {
  id: string
  action: "delete" | "approve"
  source_id: string
  source_title: string
  source_kind: string
  source_project_id: string
  source_original_filename: string | null
  source_mime_type: string | null
  source_size_bytes: number | null
  source_content_length: number
  source_content_sha256: string | null
  source_metadata: Record<string, unknown>
  source_created_at: string | null
  actor_user_id: string
  actor_username: string
  actor_display_name: string | null
  actor_role: string
  actor_ip: string | null
  user_agent: string | null
  request_id: string | null
  reason: string
  confirmation_text: string
  created_at: string
}

export async function listKnowledgeAudit(limit = 100): Promise<KnowledgeAuditEntry[]> {
  await ensureKnowledgeSchema()
  const rows = await getSql()`
    SELECT id, action, source_id, source_title, source_kind, source_project_id,
           source_original_filename, source_mime_type, source_storage_path, source_size_bytes,
           source_content_length, source_content_sha256, source_metadata,
           source_created_at, actor_user_id, actor_username, actor_display_name,
           actor_role, actor_ip, user_agent, request_id, reason, confirmation_text, created_at
    FROM dani_knowledge_audit
    ORDER BY created_at DESC
    LIMIT ${Math.max(1, Math.min(limit, 250))}
  `
  return rows as unknown as KnowledgeAuditEntry[]
}

export async function approveKnowledgeSourceWithAudit(input: {
  sourceId: string
  actor: {
    userId: string
    username: string
    displayName?: string | null
    role: string
  }
  actorIp?: string | null
  userAgent?: string | null
  requestId?: string | null
}) {
  await ensureKnowledgeSchema()
  const sql = getSql()
  const rows = await sql`
    SELECT id, project_id, kind, title, original_filename, mime_type,
           size_bytes, storage_path, status, extracted_text, metadata,
           authority_type, authority_weight, lifecycle_status, version,
           supersedes_source_id, approved_by, approved_at, valid_from, valid_to,
           indexed_at, indexing_status, created_at
    FROM dani_knowledge_sources
    WHERE id = ${input.sourceId}
    LIMIT 1
  `
  const source = (rows as unknown as KnowledgeSource[])[0]
  if (!source) throw new Error("SOURCE_NOT_FOUND")
  if (source.lifecycle_status === "active") {
    return { auditId: null, source }
  }

  const text = source.extracted_text ?? ""
  const contentHash = text
    ? createHash("sha256").update(text, "utf8").digest("hex")
    : null
  const auditId = randomUUID()

  await sql.transaction((tx) => [
    tx`
      INSERT INTO dani_knowledge_audit (
        id, action, source_id, source_title, source_kind, source_project_id,
        source_original_filename, source_mime_type, source_storage_path, source_size_bytes,
        source_content_length, source_content_sha256, source_metadata,
        source_created_at, actor_user_id, actor_username, actor_display_name,
        actor_role, actor_ip, user_agent, request_id, reason, confirmation_text
      ) VALUES (
        ${auditId}, 'approve', ${source.id}, ${source.title}, ${source.kind},
        ${source.project_id}, ${source.original_filename}, ${source.mime_type},
        ${source.storage_path}, ${source.size_bytes}, ${text.length}, ${contentHash},
        ${JSON.stringify(source.metadata ?? {})}::jsonb, ${source.created_at},
        ${input.actor.userId}, ${input.actor.username}, ${input.actor.displayName ?? null},
        ${input.actor.role}, ${input.actorIp ?? null}, ${input.userAgent ?? null},
        ${input.requestId ?? null}, 'Memória revisada e liberada para orientar o clone.',
        'APROVADO'
      )
    `,
    tx`
      UPDATE dani_knowledge_sources
      SET lifecycle_status = 'active',
          approved_by = ${input.actor.username},
          approved_at = NOW(),
          metadata = metadata || '{"reviewStatus":"approved"}'::jsonb
      WHERE id = ${source.id}
    `,
  ])

  const updated = await sql`
    SELECT id, project_id, kind, title, original_filename, mime_type,
           size_bytes, storage_path, status, extracted_text, metadata,
           authority_type, authority_weight, lifecycle_status, version,
           supersedes_source_id, approved_by, approved_at, valid_from, valid_to,
           indexed_at, indexing_status, created_at
    FROM dani_knowledge_sources
    WHERE id = ${source.id}
    LIMIT 1
  `

  return { auditId, source: (updated as unknown as KnowledgeSource[])[0] }
}

export async function deleteKnowledgeSourceWithAudit(input: {
  sourceId: string
  actor: {
    userId: string
    username: string
    displayName?: string | null
    role: string
  }
  reason: string
  confirmationText: string
  actorIp?: string | null
  userAgent?: string | null
  requestId?: string | null
}) {
  await ensureKnowledgeSchema()
  const sql = getSql()
  const rows = await sql`
    SELECT id, project_id, kind, title, original_filename, mime_type,
           size_bytes, storage_path, status, extracted_text, metadata, created_at
    FROM dani_knowledge_sources
    WHERE id = ${input.sourceId}
    LIMIT 1
  `
  const source = (rows as unknown as KnowledgeSource[])[0]
  if (!source) throw new Error("SOURCE_NOT_FOUND")

  const text = source.extracted_text ?? ""
  const contentHash = text
    ? createHash("sha256").update(text, "utf8").digest("hex")
    : null
  const auditId = randomUUID()

  await sql.transaction((tx) => [
    tx`
      INSERT INTO dani_knowledge_audit (
        id, action, source_id, source_title, source_kind, source_project_id,
        source_original_filename, source_mime_type, source_storage_path, source_size_bytes,
        source_content_length, source_content_sha256, source_metadata,
        source_created_at, actor_user_id, actor_username, actor_display_name,
        actor_role, actor_ip, user_agent, request_id, reason, confirmation_text
      ) VALUES (
        ${auditId}, 'delete', ${source.id}, ${source.title}, ${source.kind},
        ${source.project_id}, ${source.original_filename}, ${source.mime_type},
        ${source.storage_path}, ${source.size_bytes}, ${text.length}, ${contentHash},
        ${JSON.stringify(source.metadata ?? {})}::jsonb, ${source.created_at},
        ${input.actor.userId}, ${input.actor.username},
        ${input.actor.displayName ?? null}, ${input.actor.role},
        ${input.actorIp ?? null}, ${input.userAgent ?? null}, ${input.requestId ?? null},
        ${input.reason}, ${input.confirmationText}
      )
    `,
    tx`
      UPDATE dani_knowledge_messages
      SET source_ids = source_ids - ${source.id}
      WHERE source_ids ? ${source.id}
    `,
    tx`
      DELETE FROM dani_knowledge_sources
      WHERE id = ${source.id}
    `,
  ])

  return {
    auditId,
    deletedSource: {
      id: source.id,
      title: source.title,
      kind: source.kind,
      projectId: source.project_id,
      storagePath: source.storage_path,
    },
  }
}
