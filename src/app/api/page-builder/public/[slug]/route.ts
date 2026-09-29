import { NextRequest, NextResponse } from "next/server"
import { ensurePageBuilderSchema, getSql } from "@/lib/db"

function normalizeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80)
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  await ensurePageBuilderSchema()
  const { slug: rawSlug } = await context.params
  const slug = normalizeSlug(rawSlug)
  const sql = getSql()

  const rows = await sql`
    SELECT title, published, published_revision, published_at
    FROM page_builder_documents
    WHERE slug = ${slug}
    LIMIT 1
  ` as unknown as Array<{
    title: string
    published: unknown
    published_revision: number | null
    published_at: string | null
  }>

  const response = rows.length && rows[0].published
    ? NextResponse.json({
        slug,
        title: rows[0].title,
        document: rows[0].published,
        revision: rows[0].published_revision,
        publishedAt: rows[0].published_at,
      })
    : NextResponse.json({ slug, document: null }, { status: 404 })

  response.headers.set("Access-Control-Allow-Origin", "*")
  response.headers.set("Cache-Control", "no-store, max-age=0")
  return response
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 })
  response.headers.set("Access-Control-Allow-Origin", "*")
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type")
  return response
}
