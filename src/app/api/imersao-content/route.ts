import { NextResponse } from "next/server"
import { ensureImersaoContentSchema, getSql } from "@/lib/db"
import {
  createDefaultImmersaoContent,
  normalizeImmersaoContent,
  type ImmersaoContentDocument,
} from "@/lib/imersao-content"

type Row = {
  draft: ImmersaoContentDocument
  published: ImmersaoContentDocument | null
  revision: number
  published_revision: number | null
  published_at: string | null
  updated_at: string
}

function validDocument(value: unknown): value is ImmersaoContentDocument {
  if (!value || typeof value !== "object") return false
  const doc = value as Partial<ImmersaoContentDocument>
  return doc.version === 1 && doc.slug === "imersao" && Boolean(doc.hero) && Boolean(doc.about) &&
    Array.isArray(doc.carousel) && Array.isArray(doc.learning) && Array.isArray(doc.included) &&
    Array.isArray(doc.offers) && Array.isArray(doc.faq)
}

export async function GET() {
  await ensureImersaoContentSchema()
  const sql = getSql()
  const rows = await sql`
    SELECT draft, published, revision, published_revision, published_at, updated_at
    FROM imersao_content_documents
    WHERE slug = 'imersao'
    LIMIT 1
  ` as unknown as Row[]

  if (!rows.length) {
    const draft = createDefaultImmersaoContent()
    return NextResponse.json({
      draft,
      published: null,
      revision: 0,
      publishedRevision: null,
      publishedAt: null,
      updatedAt: null,
      isNew: true,
    })
  }

  const row = rows[0]
  return NextResponse.json({
    draft: normalizeImmersaoContent(row.draft),
    published: row.published ? normalizeImmersaoContent(row.published) : null,
    revision: row.revision,
    publishedRevision: row.published_revision,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    isNew: false,
  })
}

export async function PUT(request: Request) {
  await ensureImersaoContentSchema()
  const body = await request.json() as {
    document?: ImmersaoContentDocument
    action?: "save" | "publish"
  }

  if (!validDocument(body.document)) {
    return NextResponse.json({ error: "Conteúdo inválido." }, { status: 400 })
  }

  const document: ImmersaoContentDocument = {
    ...normalizeImmersaoContent(body.document),
    updatedAt: new Date().toISOString(),
  }
  const sql = getSql()

  if (body.action === "publish") {
    const rows = await sql`
      INSERT INTO imersao_content_documents (
        slug, draft, published, revision, published_revision, published_at, updated_at
      )
      VALUES (
        'imersao',
        ${JSON.stringify(document)}::jsonb,
        ${JSON.stringify(document)}::jsonb,
        1,
        1,
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        draft = EXCLUDED.draft,
        published = EXCLUDED.published,
        revision = imersao_content_documents.revision + 1,
        published_revision = imersao_content_documents.revision + 1,
        published_at = NOW(),
        updated_at = NOW()
      RETURNING revision, published_revision, published_at, updated_at
    ` as unknown as Array<{
      revision: number
      published_revision: number | null
      published_at: string | null
      updated_at: string
    }>

    return NextResponse.json({ ok: true, action: "publish", ...rows[0] })
  }

  const rows = await sql`
    INSERT INTO imersao_content_documents (slug, draft, revision, updated_at)
    VALUES ('imersao', ${JSON.stringify(document)}::jsonb, 1, NOW())
    ON CONFLICT (slug) DO UPDATE SET
      draft = EXCLUDED.draft,
      revision = imersao_content_documents.revision + 1,
      updated_at = NOW()
    RETURNING revision, published_revision, published_at, updated_at
  ` as unknown as Array<{
    revision: number
    published_revision: number | null
    published_at: string | null
    updated_at: string
  }>

  return NextResponse.json({ ok: true, action: "save", ...rows[0] })
}