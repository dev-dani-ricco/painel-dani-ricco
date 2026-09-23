import { randomUUID } from "node:crypto"
import { getSql } from "@/lib/db"
import type { ArchetypeId } from "@/lib/archetypes"
import type { DiagnosticAnswers, DiagnosticScoreResult } from "@/lib/diagnostic"

let diagnosticSchemaPromise: Promise<void> | null = null

export type DiagnosticLeadInput = {
  name: string
  email: string
  whatsapp?: string
  profession?: string
  consent: boolean
  source?: string
  utm?: Record<string, string>
}

export type DiagnosticStoredResult = {
  id: string
  name: string
  email: string
  profession: string | null
  primaryArchetype: ArchetypeId
  secondaryArchetype: ArchetypeId
  tertiaryArchetype: ArchetypeId
  scores: DiagnosticScoreResult
  unlocked: boolean
  completedAt: string | null
}

export function ensureDiagnosticSchema() {
  if (!diagnosticSchemaPromise) {
    const sql = getSql()
    diagnosticSchemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS impar_archetype_diagnostics (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          whatsapp TEXT,
          profession TEXT,
          consent BOOLEAN NOT NULL DEFAULT FALSE,
          source TEXT,
          utm JSONB NOT NULL DEFAULT '{}'::jsonb,
          answers JSONB,
          scores JSONB,
          primary_archetype TEXT,
          secondary_archetype TEXT,
          tertiary_archetype TEXT,
          status TEXT NOT NULL DEFAULT 'started',
          unlocked BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          unlocked_at TIMESTAMPTZ
        )
      `
      await sql`CREATE INDEX IF NOT EXISTS impar_diag_email_idx ON impar_archetype_diagnostics (email)`
      await sql`CREATE INDEX IF NOT EXISTS impar_diag_primary_idx ON impar_archetype_diagnostics (primary_archetype)`
      await sql`CREATE INDEX IF NOT EXISTS impar_diag_created_idx ON impar_archetype_diagnostics (created_at DESC)`
    })()
  }
  return diagnosticSchemaPromise
}

export async function createDiagnosticSession(input: DiagnosticLeadInput) {
  await ensureDiagnosticSchema()
  const sql = getSql()
  const id = randomUUID()
  const utm = JSON.stringify(input.utm ?? {})
  await sql`
    INSERT INTO impar_archetype_diagnostics
      (id, name, email, whatsapp, profession, consent, source, utm)
    VALUES
      (${id}, ${input.name.trim()}, ${input.email.trim().toLowerCase()}, ${input.whatsapp?.trim() || null},
       ${input.profession?.trim() || null}, ${input.consent}, ${input.source || "diagnostico"}, ${utm}::jsonb)
  `
  return id
}

export async function saveDiagnosticResult(
  sessionId: string,
  answers: DiagnosticAnswers,
  result: DiagnosticScoreResult,
) {
  await ensureDiagnosticSchema()
  const sql = getSql()
  const rows = (await sql`
    UPDATE impar_archetype_diagnostics
    SET answers = ${JSON.stringify(answers)}::jsonb,
        scores = ${JSON.stringify(result)}::jsonb,
        primary_archetype = ${result.primary},
        secondary_archetype = ${result.secondary},
        tertiary_archetype = ${result.tertiary},
        status = 'completed',
        completed_at = NOW()
    WHERE id = ${sessionId}
    RETURNING id
  `) as unknown as Array<{ id: string }>
  if (!rows.length) throw new Error("Sessão de diagnóstico não encontrada")
}

export async function getDiagnosticResult(sessionId: string): Promise<DiagnosticStoredResult | null> {
  await ensureDiagnosticSchema()
  const sql = getSql()
  const rows = (await sql`
    SELECT id, name, email, profession, primary_archetype, secondary_archetype,
           tertiary_archetype, scores, unlocked, completed_at
    FROM impar_archetype_diagnostics
    WHERE id = ${sessionId} AND status = 'completed'
    LIMIT 1
  `) as unknown as Array<Record<string, unknown>>
  const row = rows[0]
  if (!row || !row.primary_archetype || !row.secondary_archetype || !row.tertiary_archetype || !row.scores) return null
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    profession: row.profession ? String(row.profession) : null,
    primaryArchetype: String(row.primary_archetype) as ArchetypeId,
    secondaryArchetype: String(row.secondary_archetype) as ArchetypeId,
    tertiaryArchetype: String(row.tertiary_archetype) as ArchetypeId,
    scores: row.scores as DiagnosticScoreResult,
    unlocked: Boolean(row.unlocked),
    completedAt: row.completed_at ? String(row.completed_at) : null,
  }
}

export async function unlockDiagnostic(sessionId: string) {
  await ensureDiagnosticSchema()
  const sql = getSql()
  const rows = (await sql`
    UPDATE impar_archetype_diagnostics
    SET unlocked = TRUE, unlocked_at = COALESCE(unlocked_at, NOW())
    WHERE id = ${sessionId} AND status = 'completed'
    RETURNING id
  `) as unknown as Array<{ id: string }>
  return rows.length > 0
}