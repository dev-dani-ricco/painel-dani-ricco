import { neon } from "@neondatabase/serverless"

let sqlClient: ReturnType<typeof neon> | null = null
let schemaPromise: Promise<void> | null = null

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
