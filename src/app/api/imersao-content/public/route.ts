import { NextResponse } from "next/server"
import { ensureImersaoContentSchema, getSql } from "@/lib/db"
import type { ImmersaoContentDocument } from "@/lib/imersao-content"

type Row = {
  published: ImmersaoContentDocument | null
  published_revision: number | null
  published_at: string | null
}

export async function GET() {
  await ensureImersaoContentSchema()
  const rows = await getSql()`
    SELECT published, published_revision, published_at
    FROM imersao_content_documents
    WHERE slug = 'imersao'
    LIMIT 1
  ` as unknown as Row[]

  const row = rows[0]
  const response = row?.published
    ? NextResponse.json({
        document: row.published,
        revision: row.published_revision,
        publishedAt: row.published_at,
      })
    : NextResponse.json({ document: null }, { status: 404 })

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