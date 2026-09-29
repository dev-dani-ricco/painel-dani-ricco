import { NextResponse } from "next/server"
import { uploadPublicImage } from "@/lib/blob-storage"

export const runtime = "nodejs"

export async function POST(request: Request) {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: "Não foi possível ler o arquivo." }, { status: 400 })
  }

  const file = form.get("file")
  if (!(file instanceof File) || !file.type.startsWith("image/") || file.size === 0) {
    return NextResponse.json({ error: "Envie uma imagem válida." }, { status: 400 })
  }

  if (file.size > 5_000_000) {
    return NextResponse.json({ error: "A imagem otimizada deve ter no máximo 5 MB." }, { status: 413 })
  }

  try {
    const result = await uploadPublicImage(await file.arrayBuffer(), file.type, "imersao")
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("imersao_asset_upload_failed", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Não foi possível salvar a imagem.",
    }, { status: 502 })
  }
}