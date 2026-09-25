import { NextResponse } from "next/server"
import { isAppData } from "@/lib/data-schema"
import { ensureDashboardSchema, ensureProjectSchema, getSql } from "@/lib/db"
import { initialData } from "@/lib/initial-data"
import { DEFAULT_PROJECT_ID, DEFAULT_PROJECT_STAGES } from "@/lib/project-data"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type WorkspaceRow = {
  data: unknown
  revision: number
  updated_at: string
}

function databaseError(error: unknown) {
  console.error("Falha ao acessar o banco do painel:", error)
  return NextResponse.json(
    { error: "Banco de dados indisponível. O painel continuará usando o cache local." },
    { status: 503 },
  )
}

async function resolveWorkspace(projectId: string) {
  await Promise.all([ensureDashboardSchema(), ensureProjectSchema()])
  const sql = getSql()

  await sql`
    INSERT INTO launch_workspaces (id, data)
    VALUES ('dani-ricco-main', ${JSON.stringify(initialData)}::jsonb)
    ON CONFLICT (id) DO NOTHING
  `

  await sql`
    INSERT INTO launch_projects (
      id, name, description, objective, project_type, status, responsibles,
      start_date, target_date, workspace_id, stages, cards, created_by
    ) VALUES (
      ${DEFAULT_PROJECT_ID}, 'Presença de Alto Valor', '', '',
      'Lançamento', 'Em preparação', '["Dani Ricco"]'::jsonb,
      '2026-08-01', '2026-11-12', 'dani-ricco-main',
      ${JSON.stringify(DEFAULT_PROJECT_STAGES)}::jsonb, '[]'::jsonb, 'system'
    )
    ON CONFLICT (id) DO NOTHING
  `

  const rows = await sql`
    SELECT workspace_id
    FROM launch_projects
    WHERE id = ${projectId}
    LIMIT 1
  ` as Array<{ workspace_id: string }>

  return rows[0]?.workspace_id ?? null
}

export async function GET(request: Request) {
  try {
    const projectId = new URL(request.url).searchParams.get("projectId") || DEFAULT_PROJECT_ID
    const workspaceId = await resolveWorkspace(projectId)
    if (!workspaceId) return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 })

    const sql = getSql()
    const rows = await sql`
      SELECT data, revision, updated_at
      FROM launch_workspaces
      WHERE id = ${workspaceId}
      LIMIT 1
    ` as WorkspaceRow[]
    const row = rows[0]

    if (!row || !isAppData(row.data)) {
      return NextResponse.json({ error: "Os dados salvos são inválidos." }, { status: 500 })
    }

    return NextResponse.json({
      data: row.data,
      revision: row.revision,
      updatedAt: row.updated_at,
      projectId,
    })
  } catch (error) {
    return databaseError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as { data?: unknown; projectId?: string }
    const data = body?.data ?? body
    const projectId = body?.projectId || DEFAULT_PROJECT_ID

    if (!isAppData(data)) {
      return NextResponse.json({ error: "Formato de dados inválido." }, { status: 400 })
    }

    const workspaceId = await resolveWorkspace(projectId)
    if (!workspaceId) return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 })

    const sql = getSql()
    const rows = await sql`
      INSERT INTO launch_workspaces (id, data)
      VALUES (${workspaceId}, ${JSON.stringify(data)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        revision = launch_workspaces.revision + 1,
        updated_at = NOW()
      RETURNING revision, updated_at
    ` as Array<{ revision: number; updated_at: string }>

    return NextResponse.json({
      ok: true,
      revision: rows[0]?.revision ?? 1,
      updatedAt: rows[0]?.updated_at,
      projectId,
    })
  } catch (error) {
    return databaseError(error)
  }
}
