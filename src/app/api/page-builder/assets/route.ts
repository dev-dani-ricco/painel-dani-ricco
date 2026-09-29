import { NextResponse } from "next/server"
import { uploadPublicImage } from "@/lib/blob-storage"

export const runtime = "nodejs"

function parseDataUrl(value: string) {
  const match = value.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return { mimeType: match[1], base64: match[2] }
}

export async function POST(request: Request) {
  const body = await request.json() as { dataUrl?: string; name?: string }
  if (!body.dataUrl) return NextResponse.json({ error: "Imagem ausente." }, { status: 400 })

  const parsed = parseDataUrl(body.dataUrl)
  if (!parsed || !parsed.mimeType.startsWith("image/")) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 })
  }

  const bytes = Buffer.from(parsed.base64, "base64")
  if (bytes.length > 5_000_000) {
    return NextResponse.json({ error: "Imagem acima de 5 MB após otimização." }, { status: 413 })
  }

  try {
    const result = await uploadPublicImage(bytes, parsed.mimeType, "page-studio")
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("page_builder_asset_upload_failed", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Não foi possível salvar a imagem.",
    }, { status: 502 })
  }
}