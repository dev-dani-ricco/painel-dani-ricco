import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { uploadPublicImage } from "@/lib/blob-storage"
import { ensureImersaoContentSchema, getSql } from "@/lib/db"

export const runtime = "nodejs"

const SUPPORTED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"])

function safeSlot(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "misc"
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 80) || "misc"
}

function positiveInt(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null
  const number = Number.parseInt(value, 10)
  return Number.isFinite(number) && number > 0 ? number : null
}

export async function GET(request: Request) {
  await ensureImersaoContentSchema()
  const slot = new URL(request.url).searchParams.get("slot")
  const sql = getSql()
  const rows = slot
    ? await sql`
        SELECT id, slot, name, url, pathname, mime_type, byte_size, width, height, created_at
        FROM imersao_media_assets WHERE slot = ${slot}
        ORDER BY created_at DESC LIMIT 24
      `
    : await sql`
        SELECT id, slot, name, url, pathname, mime_type, byte_size, width, height, created_at
        FROM imersao_media_assets ORDER BY created_at DESC LIMIT 60
      `
  return NextResponse.json({ assets: rows })
}
export async function POST(request: Request) {
  await ensureImersaoContentSchema()
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: "Upload inválido." }, { status: 400 })
  }

  const file = form.get("file")
  if (!(file instanceof File) || !SUPPORTED.has(file.type) || file.size === 0) {
    return NextResponse.json({ error: "Envie uma imagem JPG, PNG, WebP ou AVIF." }, { status: 400 })
  }
  if (file.size > 5_000_000) {
    return NextResponse.json({ error: "A imagem deve ter no máximo 5 MB após otimização." }, { status: 413 })
  }

  const slot = safeSlot(form.get("slot"))
  const width = positiveInt(form.get("width"))
  const height = positiveInt(form.get("height"))

  try {
    const result = await uploadPublicImage(await file.arrayBuffer(), file.type, `imersao/${slot}`)
    const id = randomUUID()
    const sql = getSql()
    await sql`
      INSERT INTO imersao_media_assets (
        id, slot, name, url, pathname, mime_type, byte_size, width, height
      )
      VALUES (
        ${id}, ${slot}, ${file.name.slice(0, 180)},
        ${result.url}, ${result.pathname}, ${result.mimeType}, ${result.byteSize}, ${width}, ${height}
      )
    `
    return NextResponse.json({
      asset: {
        id, slot, name: file.name, url: result.url, pathname: result.pathname,
        mimeType: result.mimeType, byteSize: result.byteSize, width, height,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("imersao_media_upload_failed", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Não foi possível salvar a imagem.",
    }, { status: 502 })
  }
}
