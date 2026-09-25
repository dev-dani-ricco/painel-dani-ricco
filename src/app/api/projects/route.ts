import { NextResponse } from "next/server"
import { ensureDashboardSchema, ensureProjectSchema, getSql } from "@/lib/db"
import { initialData } from "@/lib/initial-data"
import { DEFAULT_PROJECT_ID, DEFAULT_PROJECT_STAGES, createProjectInitialData } from "@/lib/project-data"
import { currentSession } from "@/lib/auth-server"
import type { Project, ProjectCard, ProjectStage } from "@/lib/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type ProjectRow = {
  id: string
  name: string
  description: string
  objective: string
  success_criteria: string
  priority: "Alta" | "Média" | "Baixa"
  project_type: string
  status: string
  responsibles: string[]
  start_date: string | null
  target_date: string | null
  workspace_id: string
  stages: ProjectStage[]
  cards: ProjectCard[]
  created_at: string
  updated_at: string
}
function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    objective: row.objective,
    successCriteria: row.success_criteria || "",
    priority: row.priority || "Média",
    projectType: row.project_type,
    status: row.status,
    responsibles: Array.isArray(row.responsibles) ? row.responsibles : [],
    startDate: row.start_date || "",
    targetDate: row.target_date || "",
    workspaceId: row.workspace_id,
    stages: Array.isArray(row.stages) ? row.stages : [],
    cards: Array.isArray(row.cards) ? row.cards : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function ensureSeedProject() {
  await Promise.all([ensureProjectSchema(), ensureDashboardSchema()])
  const sql = getSql()
  await sql`
    INSERT INTO launch_workspaces (id, data)
    VALUES ('dani-ricco-main', ${JSON.stringify(initialData)}::jsonb)
    ON CONFLICT (id) DO NOTHING
  `
  await sql`
    INSERT INTO launch_projects (
      id, name, description, objective, success_criteria, priority, project_type, status, responsibles,
      start_date, target_date, workspace_id, stages, cards, created_by
    ) VALUES (
      ${DEFAULT_PROJECT_ID},
      'Presença de Alto Valor',
      'Projeto de estruturação, produção e lançamento do produto digital Presença de Alto Valor.',
      'Estruturar e executar o lançamento com visão integrada de produto, conteúdo, produção e entrega.',
      'Lançamento validado, entregue no prazo e com todas as frentes críticas aprovadas.',
      'Alta',
      'Lançamento',
      'Em preparação',
      ${JSON.stringify(["Dani Ricco"])}::jsonb,
      '2026-08-01',
      '2026-11-12',
      'dani-ricco-main',
      ${JSON.stringify(DEFAULT_PROJECT_STAGES)}::jsonb,
      '[]'::jsonb,
      'system'
    )
    ON CONFLICT (id) DO NOTHING
  `
}

function canEdit(role: string) {
  return role === "owner" || role === "admin" || role === "editor" || role === "system"
}

export async function GET() {
  const session = await currentSession()
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  await ensureSeedProject()
  const sql = getSql()
  const rows = await sql`
    SELECT id, name, description, objective, success_criteria, priority, project_type, status, responsibles,
           start_date::text, target_date::text, workspace_id, stages, cards,
           created_at, updated_at
    FROM launch_projects
    ORDER BY created_at ASC
  ` as ProjectRow[]

  return NextResponse.json({ projects: rows.map(toProject) })
}

export async function POST(request: Request) {
  const session = await currentSession()
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  if (!canEdit(session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  const body = await request.json() as {
    name?: string
    description?: string
    objective?: string
    successCriteria?: string
    priority?: "Alta" | "Média" | "Baixa"
    projectType?: string
    responsibles?: string[]
    startDate?: string
    targetDate?: string
    stages?: Array<{ name?: string }>
  }
  const name = body.name?.trim() || ""
  const objective = body.objective?.trim() || ""
  const successCriteria = body.successCriteria?.trim() || ""
  const priority = body.priority || "Média"
  const responsibles = (body.responsibles || []).map((item) => item.trim()).filter(Boolean)
  const stageNames = (body.stages || []).map((item) => item.name?.trim() || "").filter(Boolean)

  if (name.length < 3) return NextResponse.json({ error: "Informe o nome do projeto." }, { status: 400 })
  if (objective.length < 10) return NextResponse.json({ error: "Descreva o objetivo principal do projeto." }, { status: 400 })
  if (successCriteria.length < 10) return NextResponse.json({ error: "Defina um critério de sucesso para o projeto." }, { status: 400 })
  if (!["Alta", "Média", "Baixa"].includes(priority)) return NextResponse.json({ error: "Prioridade inválida." }, { status: 400 })
  if (!responsibles.length) return NextResponse.json({ error: "Informe ao menos um responsável." }, { status: 400 })
  if (!body.startDate || !body.targetDate) return NextResponse.json({ error: "Informe início e data-alvo." }, { status: 400 })
  if (stageNames.length < 2) return NextResponse.json({ error: "Crie ao menos duas etapas." }, { status: 400 })

  await ensureSeedProject()
  const sql = getSql()
  const id = crypto.randomUUID()
  const workspaceId = "project:" + id
  const stages: ProjectStage[] = stageNames.map((stageName, index) => ({
    id: crypto.randomUUID(),
    name: stageName,
    order: index + 1,
  }))
  const projectData = createProjectInitialData(name)
  await sql.transaction([
    sql`
      INSERT INTO launch_workspaces (id, data)
      VALUES (${workspaceId}, ${JSON.stringify(projectData)}::jsonb)
    `,
    sql`
      INSERT INTO launch_projects (
        id, name, description, objective, success_criteria, priority, project_type, status, responsibles,
        start_date, target_date, workspace_id, stages, cards, created_by
      ) VALUES (
        ${id}, ${name}, ${body.description?.trim() || ""}, ${objective},
        ${successCriteria}, ${priority}, ${body.projectType?.trim() || "Lançamento"}, 'Planejamento',
        ${JSON.stringify(responsibles)}::jsonb, ${body.startDate}, ${body.targetDate},
        ${workspaceId}, ${JSON.stringify(stages)}::jsonb, '[]'::jsonb, ${session.username}
      )
    `,
  ])

  const rows = await sql`
    SELECT id, name, description, objective, success_criteria, priority, project_type, status, responsibles,
           start_date::text, target_date::text, workspace_id, stages, cards,
           created_at, updated_at
    FROM launch_projects WHERE id = ${id} LIMIT 1
  ` as ProjectRow[]

  return NextResponse.json({ project: toProject(rows[0]) }, { status: 201 })
}
export async function PATCH(request: Request) {
  const session = await currentSession()
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  if (!canEdit(session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  const body = await request.json() as Partial<Project> & { id?: string }
  if (!body.id) return NextResponse.json({ error: "Projeto inválido." }, { status: 400 })

  await ensureSeedProject()
  const sql = getSql()
  const rows = await sql`
    UPDATE launch_projects SET
      name = COALESCE(${body.name ?? null}, name),
      description = COALESCE(${body.description ?? null}, description),
      objective = COALESCE(${body.objective ?? null}, objective),
      success_criteria = COALESCE(${body.successCriteria ?? null}, success_criteria),
      priority = COALESCE(${body.priority ?? null}, priority),
      project_type = COALESCE(${body.projectType ?? null}, project_type),
      status = COALESCE(${body.status ?? null}, status),
      responsibles = COALESCE(${body.responsibles ? JSON.stringify(body.responsibles) : null}::jsonb, responsibles),
      start_date = COALESCE(${body.startDate || null}::date, start_date),
      target_date = COALESCE(${body.targetDate || null}::date, target_date),
      stages = COALESCE(${body.stages ? JSON.stringify(body.stages) : null}::jsonb, stages),
      cards = COALESCE(${body.cards ? JSON.stringify(body.cards) : null}::jsonb, cards),
      updated_at = NOW()
    WHERE id = ${body.id}
    RETURNING id, name, description, objective, success_criteria, priority, project_type, status, responsibles,
              start_date::text, target_date::text, workspace_id, stages, cards,
              created_at, updated_at
  ` as ProjectRow[]

  if (!rows[0]) return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 })
  return NextResponse.json({ project: toProject(rows[0]) })
}
