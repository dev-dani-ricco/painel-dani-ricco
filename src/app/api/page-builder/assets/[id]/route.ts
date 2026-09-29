import { NextResponse } from "next/server"
import { ensurePageBuilderSchema, getSql } from "@/lib/db"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await ensurePageBuilderSchema()
  const { id } = await context.params
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Asset inválido." }, { status: 400 })
  }

  const rows = await getSql()`
    SELECT mime_type, encode(data, 'base64') AS data_base64
    FROM page_builder_assets
    WHERE id = ${id}
    LIMIT 1
  ` as unknown as Array<{ mime_type: string; data_base64: string }>

  const row = rows[0]
  if (!row) return NextResponse.json({ error: "Asset não encontrado." }, { status: 404 })

  const bytes = Buffer.from(row.data_base64, "base64")
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": row.mime_type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
