import { put } from "@vercel/blob"
import { randomUUID } from "node:crypto"

const MAX_BYTES = 5_000_000
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"])

function extensionFor(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg"
  if (mimeType === "image/png") return "png"
  if (mimeType === "image/avif") return "avif"
  return "webp"
}

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())
}

export async function uploadPublicImage(
  bytes: Uint8Array | ArrayBuffer,
  mimeType: string,
  namespace = "imersao",
) {
  if (!isBlobConfigured()) throw new Error("BLOB_READ_WRITE_TOKEN não configurado.")
  if (!ALLOWED.has(mimeType)) throw new Error("Formato de imagem não suportado.")

  const size = bytes instanceof ArrayBuffer ? bytes.byteLength : bytes.byteLength
  if (size <= 0 || size > MAX_BYTES) throw new Error("A imagem deve ter até 5 MB após otimização.")

  const pathname = `${namespace}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extensionFor(mimeType)}`
  const body = Buffer.from(bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes)
  const blob = await put(pathname, body, {
    access: "public",
    addRandomSuffix: false,
    contentType: mimeType,
  })

  return {
    url: blob.url,
    pathname: blob.pathname,
    byteSize: size,
    mimeType,
  }
}