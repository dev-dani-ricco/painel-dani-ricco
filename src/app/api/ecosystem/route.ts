import { NextResponse } from "next/server"
import { currentSession } from "@/lib/auth-server"
import { ensureEcosystemSchema, getSql } from "@/lib/db"
import {
  DANI_ECOSYSTEM_RESOURCES,
  type DaniEcosystemConnection,
  type DaniEcosystemHealth,
  type DaniEcosystemResource,
} from "@/lib/dani-ecosystem"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type EcosystemRow = {
  key: string
  eyebrow: string
  title: string
  description: string
  url: string
  category: DaniEcosystemResource["category"]
  source: DaniEcosystemResource["source"]
  preview_image: string
  preview_alt: string
  sort_order: number
  product: string
  project_id: string | null
  responsible: string
  status: DaniEcosystemResource["status"]
  analytics: DaniEcosystemConnection
  integration: DaniEcosystemConnection
  health: DaniEcosystemHealth
  health_checked_at: string | null
  notes: string
  updated_at: string
}

function canEdit(role: string) {
  return role === "owner" || role === "admin" || role === "editor" || role === "system"
}
function toResource(row: EcosystemRow): DaniEcosystemResource {
  return {
    key: row.key,
    eyebrow: row.eyebrow,
    title: row.title,
    description: row.description,
    url: row.url,
    category: row.category,
    source: row.source,
    previewImage: row.preview_image,
    previewAlt: row.preview_alt,
    sortOrder: row.sort_order,
    product: row.product,
    projectId: row.project_id,
    responsible: row.responsible,
    status: row.status,
    analytics: row.analytics,
    integration: row.integration,
    health: row.health,
    healthCheckedAt: row.health_checked_at,
    notes: row.notes,
    updatedAt: row.updated_at,
  }
}

async function ensureSeedAssets() {
  await ensureEcosystemSchema()
  const sql = getSql()

  for (const asset of DANI_ECOSYSTEM_RESOURCES) {
    await sql`
      INSERT INTO dani_ecosystem_assets (
        key, eyebrow, title, description, url, category, source, preview_image, preview_alt,
        sort_order, product, project_id, responsible, status, analytics, integration, health, notes
      ) VALUES (
        ${asset.key}, ${asset.eyebrow}, ${asset.title}, ${asset.description}, ${asset.url},
        ${asset.category}, ${asset.source}, ${asset.previewImage}, ${asset.previewAlt},
        ${asset.sortOrder}, ${asset.product}, ${asset.projectId}, ${asset.responsible}, ${asset.status},
        ${JSON.stringify(asset.analytics)}::jsonb, ${JSON.stringify(asset.integration)}::jsonb,
        ${asset.health}, ${asset.notes}
      )
      ON CONFLICT (key) DO UPDATE SET
        eyebrow = EXCLUDED.eyebrow,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        url = EXCLUDED.url,
        category = EXCLUDED.category,
        source = EXCLUDED.source,
        preview_image = EXCLUDED.preview_image,
        preview_alt = EXCLUDED.preview_alt,
        sort_order = EXCLUDED.sort_order
    `
  }
}

async function readAssets() {
  const sql = getSql()
  const rows = await sql`
    SELECT key, eyebrow, title, description, url, category, source, preview_image, preview_alt,
           sort_order, product, project_id, responsible, status, analytics, integration, health,
           health_checked_at, notes, updated_at
    FROM dani_ecosystem_assets
    WHERE status <> 'archived'
    ORDER BY sort_order ASC, title ASC
  ` as EcosystemRow[]
  return rows.map(toResource)
}

async function checkHealth(url: string): Promise<DaniEcosystemHealth> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4500)
  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "TI-Broker-Dani-Panel-Health/1.0" },
    })

    if (response.status === 405) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "TI-Broker-Dani-Panel-Health/1.0" },
      })
    }
    if (response.status >= 200 && response.status < 400) return "online"
    if (response.status >= 400 && response.status < 500) return "degraded"
    return "offline"
  } catch {
    return "offline"
  } finally {
    clearTimeout(timer)
  }
}

export async function GET() {
  const session = await currentSession()
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  try {
    await ensureSeedAssets()
    return NextResponse.json({ assets: await readAssets() })
  } catch (error) {
    console.error("Falha ao carregar inventário do ecossistema:", error)
    return NextResponse.json({ error: "Falha ao carregar o ecossistema." }, { status: 503 })
  }
}

export async function POST(request: Request) {
  const session = await currentSession()
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  if (!canEdit(session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  const body = await request.json().catch(() => ({})) as { action?: string }
  if (body.action !== "refresh-health") {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 })
  }

  try {
    await ensureSeedAssets()
    const sql = getSql()
    const rows = await sql`
      SELECT key, url FROM dani_ecosystem_assets WHERE status <> 'archived' ORDER BY sort_order ASC
    ` as Array<{ key: string; url: string }>
    const checked = await Promise.all(rows.map(async (row) => ({
      key: row.key,
      health: await checkHealth(row.url),
    })))

    for (const item of checked) {
      await sql`
        UPDATE dani_ecosystem_assets
        SET health = ${item.health}, health_checked_at = NOW(), updated_at = NOW()
        WHERE key = ${item.key}
      `
    }

    return NextResponse.json({ assets: await readAssets(), checkedAt: new Date().toISOString() })
  } catch (error) {
    console.error("Falha ao verificar saúde do ecossistema:", error)
    return NextResponse.json({ error: "Falha ao verificar o ecossistema." }, { status: 503 })
  }
}
