import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { put } from "@vercel/blob"

export type StoredKnowledgeFile = {
  provider: "vercel-blob" | "local"
  path: string
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
  try {
    const blob = await put(pathname, args.file, {
      access: "private",
      addRandomSuffix: false,
    })
    return { provider: "vercel-blob", path: blob.pathname }
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error

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
