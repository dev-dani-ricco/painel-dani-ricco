import { neon } from "@neondatabase/serverless"

let sqlClient: ReturnType<typeof neon> | null = null
let schemaPromise: Promise<void> | null = null
let projectSchemaPromise: Promise<void> | null = null
let ecosystemSchemaPromise: Promise<void> | null = null
let pageBuilderSchemaPromise: Promise<void> | null = null
let imersaoContentSchemaPromise: Promise<void> | null = null

export function getSql() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL não configurada")

  sqlClient ??= neon(connectionString)
  return sqlClient
}

export function ensureDashboardSchema() {
  if (!schemaPromise) {
    const sql = getSql()
    schemaPromise = sql`
      CREATE TABLE IF NOT EXISTS launch_workspaces (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        revision INTEGER NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.then(() => undefined)
  }

  return schemaPromise
}
export function ensureProjectSchema() {
  if (!projectSchemaPromise) {
    const sql = getSql()
    projectSchemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS launch_projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          objective TEXT NOT NULL DEFAULT '',
          success_criteria TEXT NOT NULL DEFAULT '',
          priority TEXT NOT NULL DEFAULT 'Média',
          project_type TEXT NOT NULL DEFAULT 'Lançamento',
          status TEXT NOT NULL DEFAULT 'Planejamento',
          responsibles JSONB NOT NULL DEFAULT '[]'::jsonb,
          start_date DATE,
          target_date DATE,
          workspace_id TEXT NOT NULL UNIQUE,
          stages JSONB NOT NULL DEFAULT '[]'::jsonb,
          cards JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_by TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`ALTER TABLE launch_projects ADD COLUMN IF NOT EXISTS success_criteria TEXT NOT NULL DEFAULT ''`
      await sql`ALTER TABLE launch_projects ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'Média'`
    })()
  }

  return projectSchemaPromise
}

export function ensureEcosystemSchema() {
  if (!ecosystemSchemaPromise) {
    const sql = getSql()
    ecosystemSchemaPromise = sql`
      CREATE TABLE IF NOT EXISTS dani_ecosystem_assets (
        key TEXT PRIMARY KEY,
        eyebrow TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        url TEXT NOT NULL,
        category TEXT NOT NULL,
        source TEXT NOT NULL,
        preview_image TEXT NOT NULL,
        preview_alt TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 100,
        product TEXT NOT NULL DEFAULT '',
        project_id TEXT,
        responsible TEXT NOT NULL DEFAULT 'Não definido',
        status TEXT NOT NULL DEFAULT 'active',
        analytics JSONB NOT NULL DEFAULT '{"provider":"","connected":false,"note":"A VALIDAR"}'::jsonb,
        integration JSONB NOT NULL DEFAULT '{"provider":"","connected":false,"note":"A VALIDAR"}'::jsonb,
        health TEXT NOT NULL DEFAULT 'unknown',
        health_checked_at TIMESTAMPTZ,
        notes TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.then(() => undefined)
  }

  return ecosystemSchemaPromise
}


export function ensurePageBuilderSchema() {
  if (!pageBuilderSchemaPromise) {
    const sql = getSql()
    pageBuilderSchemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS page_builder_documents (
          slug TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          draft JSONB NOT NULL,
          published JSONB,
          revision INTEGER NOT NULL DEFAULT 1,
          published_revision INTEGER,
          published_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS page_builder_assets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL DEFAULT '',
          mime_type TEXT NOT NULL,
          byte_size INTEGER NOT NULL,
          data BYTEA NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
    })()
  }

  return pageBuilderSchemaPromise
}


export function ensureImersaoContentSchema() {
  if (!imersaoContentSchemaPromise) {
    const sql = getSql()
    imersaoContentSchemaPromise = sql`
      CREATE TABLE IF NOT EXISTS imersao_content_documents (
        slug TEXT PRIMARY KEY,
        draft JSONB NOT NULL,
        published JSONB,
        revision INTEGER NOT NULL DEFAULT 1,
        published_revision INTEGER,
        published_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.then(() => undefined)
  }

  return imersaoContentSchemaPromise
}