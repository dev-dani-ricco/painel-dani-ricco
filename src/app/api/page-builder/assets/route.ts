import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { ensurePageBuilderSchema, getSql } from "@/lib/db"

export const runtime = "nodejs"

function parseDataUrl(value: string) {
  const match = value.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return { mimeType: match[1], base64: match[2] }
}

export async function POST(request: Request) {
  await ensurePageBuilderSchema()
  const body = await request.json() as { dataUrl?: string; name?: string }
  if (!body.dataUrl) return NextResponse.json({ error: "Imagem ausente." }, { status: 400 })

  const parsed = parseDataUrl(body.dataUrl)
  if (!parsed || !parsed.mimeType.startsWith("image/")) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 })
  }

  const bytes = Buffer.from(parsed.base64, "base64")
  if (bytes.length > 3_000_000) {
    return NextResponse.json({ error: "Imagem acima de 3 MB após otimização." }, { status: 413 })
  }

  const id = randomUUID()
  const sql = getSql()
  await sql`
    INSERT INTO page_builder_assets (id, name, mime_type, byte_size, data)
    VALUES (
      ${id},
      ${(body.name || "").slice(0, 180)},
      ${parsed.mimeType},
      ${bytes.length},
      decode(${parsed.base64}, 'base64')
    )
  `

  return NextResponse.json({
    id,
    url: `https://painel.daniricco.com.br/api/page-builder/assets/${id}`,
    mimeType: parsed.mimeType,
    byteSize: bytes.length,
  })
}
