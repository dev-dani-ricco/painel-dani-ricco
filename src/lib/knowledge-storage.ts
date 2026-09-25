import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { del, put } from "@vercel/blob"

export type StoredKnowledgeFile = {
  provider: "vercel-blob" | "local" | "ephemeral"
  path: string | null
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 180) || "upload"
}

export async function storeKnowledgeFile(args: {
  projectId: string
  sourceId: string
  file: File
}): Promise<StoredKnowledgeFile> {
  const pathname = `dani-knowledge/${safeName(args.projectId)}/${args.sourceId}-${safeName(args.file.name)}`
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)

  if (blobConfigured) {
    try {
      const blob = await put(pathname, args.file, {
        access: "private",
        addRandomSuffix: false,
      })
      return { provider: "vercel-blob", path: blob.pathname }
    } catch (error) {
      console.error("knowledge original archive failed", error)
      if (process.env.NODE_ENV === "production") {
        return { provider: "ephemeral", path: null }
      }
    }
  } else if (process.env.NODE_ENV === "production") {
    return { provider: "ephemeral", path: null }
  }

  {
    const root = join(process.cwd(), ".data", "dani-knowledge", safeName(args.projectId))
    await mkdir(root, { recursive: true })
    const target = join(root, `${args.sourceId}-${safeName(args.file.name)}`)
    await writeFile(target, Buffer.from(await args.file.arrayBuffer()))
    return {
      provider: "local",
      path: target,
    }
  }
}


export async function deleteStoredKnowledgeFile(path: string | null) {
  if (!path) return { deleted: false, reason: "NO_STORED_FILE" as const }
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)
  if (!blobConfigured) return { deleted: false, reason: "BLOB_NOT_CONFIGURED" as const }

  try {
    await del(path)
    return { deleted: true, reason: null }
  } catch (error) {
    console.error("knowledge original delete failed", error)
    return { deleted: false, reason: "BLOB_DELETE_FAILED" as const }
  }
}
