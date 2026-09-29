CREATE EXTENSION IF NOT EXISTS vector;
-- statement-breakpoint
ALTER TABLE dani_knowledge_projects
  ADD COLUMN IF NOT EXISTS clone_scope TEXT NOT NULL DEFAULT 'project';
-- statement-breakpoint
ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS authority_type TEXT NOT NULL DEFAULT 'external_reference';
-- statement-breakpoint
ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS authority_weight DOUBLE PRECISION NOT NULL DEFAULT 0.6;
-- statement-breakpoint
ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS lifecycle_status TEXT NOT NULL DEFAULT 'active';
-- statement-breakpoint
ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
-- statement-breakpoint
ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS supersedes_source_id TEXT;
-- statement-breakpoint
ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS approved_by TEXT;
-- statement-breakpoint
ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
-- statement-breakpoint
ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW();
-- statement-breakpoint
ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS valid_to TIMESTAMPTZ;
-- statement-breakpoint
ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS indexed_at TIMESTAMPTZ;
-- statement-breakpoint
ALTER TABLE dani_knowledge_sources ADD COLUMN IF NOT EXISTS indexing_status TEXT NOT NULL DEFAULT 'pending';
-- statement-breakpoint
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
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS dani_knowledge_ingestion_events (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES dani_knowledge_sources(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS dani_knowledge_chunks_source_idx ON dani_knowledge_chunks(source_id, ordinal);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS dani_knowledge_chunks_fts_idx
  ON dani_knowledge_chunks
  USING GIN (to_tsvector('simple', COALESCE(section_title, '') || ' ' || content || ' ' || COALESCE(metadata::text, '')));
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS dani_knowledge_chunks_embedding_hnsw_idx
  ON dani_knowledge_chunks USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS dani_knowledge_ingestion_events_source_idx
  ON dani_knowledge_ingestion_events(source_id, created_at);
-- statement-breakpoint
UPDATE dani_knowledge_projects SET clone_scope = 'global' WHERE id IN ('dani-clone', 'dani-institucional');
-- statement-breakpoint
UPDATE dani_knowledge_projects SET clone_scope = 'project' WHERE id IN ('painel-dani', 'impar-outfit');
