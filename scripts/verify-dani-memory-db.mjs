import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL_MISSING")
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
const extension = await sql.query(`
  SELECT EXISTS(
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) AS enabled
`)
const tables = await sql.query(`
  SELECT tablename
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('dani_knowledge_chunks', 'dani_knowledge_ingestion_events')
  ORDER BY tablename
`)
const columns = await sql.query(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'dani_knowledge_sources'
    AND column_name IN (
      'authority_type', 'authority_weight', 'lifecycle_status', 'version',
      'supersedes_source_id', 'approved_by', 'approved_at',
      'valid_from', 'valid_to', 'indexed_at', 'indexing_status'
    )
  ORDER BY column_name
`)
const scopes = await sql.query(`
  SELECT COUNT(*) FILTER (WHERE clone_scope = 'global')::int AS globals,
         COUNT(*) FILTER (WHERE clone_scope = 'project')::int AS projects
  FROM dani_knowledge_projects
`)

const result = {
  vectorEnabled: Boolean(extension[0]?.enabled),
  tables: tables.map((row) => row.tablename),
  governanceColumns: columns.length,
  cloneScopes: scopes[0],
}
console.log(JSON.stringify(result))

const ok = result.vectorEnabled
  && result.tables.length === 2
  && result.governanceColumns === 11
  && Number(result.cloneScopes?.globals || 0) >= 2

process.exit(ok ? 0 : 2)
