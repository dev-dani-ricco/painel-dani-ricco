import { NextResponse } from "next/server"
import { isAppData } from "@/lib/data-schema"
import { ensureDashboardSchema, getSql } from "@/lib/db"
import { initialData } from "@/lib/initial-data"

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

export async function GET() {
  try {
    await ensureDashboardSchema()
    const sql = getSql()
    const inserted = await sql`
      INSERT INTO launch_workspaces (id, data)
      VALUES ('dani-ricco-main', ${JSON.stringify(initialData)}::jsonb)
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    ` as Array<{ id: string }>
    const rows = await sql`
      SELECT data, revision, updated_at
      FROM launch_workspaces
      WHERE id = 'dani-ricco-main'
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
      isNew: inserted.length > 0,
    })
  } catch (error) {
    return databaseError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const body: unknown = await request.json()
    const data = body && typeof body === "object" && "data" in body
      ? (body as { data: unknown }).data
      : body

    if (!isAppData(data)) {
      return NextResponse.json({ error: "Formato de dados inválido." }, { status: 400 })
    }

    await ensureDashboardSchema()
    const sql = getSql()
    const rows = await sql`
      INSERT INTO launch_workspaces (id, data)
      VALUES ('dani-ricco-main', ${JSON.stringify(data)}::jsonb)
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
    })
  } catch (error) {
    return databaseError(error)
  }
}
