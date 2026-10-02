import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { uploadPublicImage } from "@/lib/blob-storage"
import { ensureImersaoContentSchema, getSql } from "@/lib/db"

export const runtime = "nodejs"

function parseDataUrl(value: string) {
  const match = value.match(/^data:(image\/(?:jpeg|png|webp|avif));base64,(.+)$/)
  if (!match) return null
  return { mimeType: match[1], base64: match[2] }
}

export async function POST(request: Request) {
  await ensureImersaoContentSchema()
  const body = await request.json() as { dataUrl?: string; name?: string }
  if (!body.dataUrl) return NextResponse.json({ error: "Imagem ausente." }, { status: 400 })

  const parsed = parseDataUrl(body.dataUrl)
  if (!parsed) return NextResponse.json({ error: "Formato de imagem não suportado." }, { status: 415 })

  const bytes = Buffer.from(parsed.base64, "base64")
  if (bytes.length === 0 || bytes.length > 5_000_000) {
    return NextResponse.json({ error: "Imagem acima de 5 MB após otimização." }, { status: 413 })
  }

  try {
    const result = await uploadPublicImage(bytes, parsed.mimeType, "page-studio")
    const id = randomUUID()
    const sql = getSql()
    await sql`
      INSERT INTO imersao_media_assets (id, slot, name, url, pathname, mime_type, byte_size)
      VALUES (${id}, 'page-builder', ${(body.name || "").slice(0, 180)},
        ${result.url}, ${result.pathname}, ${result.mimeType}, ${result.byteSize})
    `
    return NextResponse.json({ id, ...result }, { status: 201 })
  } catch (error) {
    console.error("page_builder_asset_upload_failed", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Não foi possível salvar a imagem.",
    }, { status: 502 })
  }
}
