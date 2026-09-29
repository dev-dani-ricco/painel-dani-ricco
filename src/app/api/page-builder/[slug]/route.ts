import { NextRequest, NextResponse } from "next/server"
import { ensurePageBuilderSchema, getSql } from "@/lib/db"
import { createDefaultImersaoDocument, type PageBuilderDocument } from "@/lib/page-builder"

function normalizeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80)
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  await ensurePageBuilderSchema()
  const { slug: rawSlug } = await context.params
  const slug = normalizeSlug(rawSlug)
  const sql = getSql()

  const rows = await sql`
    SELECT slug, title, draft, published, revision, published_revision, published_at, updated_at
    FROM page_builder_documents
    WHERE slug = ${slug}
    LIMIT 1
  ` as unknown as Array<{
    slug: string
    title: string
    draft: PageBuilderDocument
    published: PageBuilderDocument | null
    revision: number
    published_revision: number | null
    published_at: string | null
    updated_at: string
  }>

  if (!rows.length) {
    const draft = slug === "imersao"
      ? createDefaultImersaoDocument()
      : createDefaultImersaoDocument()
    draft.slug = slug
    draft.title = slug === "imersao" ? draft.title : "Nova página"
    return NextResponse.json({
      slug,
      title: draft.title,
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
    slug: row.slug,
    title: row.title,
    draft: row.draft,
    published: row.published,
    revision: row.revision,
    publishedRevision: row.published_revision,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    isNew: false,
  })
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  await ensurePageBuilderSchema()
  const { slug: rawSlug } = await context.params
  const slug = normalizeSlug(rawSlug)
  const body = await request.json() as {
    document?: PageBuilderDocument
    action?: "save" | "publish"
  }

  if (!body.document || body.document.slug !== slug) {
    return NextResponse.json({ error: "Documento inválido." }, { status: 400 })
  }

  const document = {
    ...body.document,
    slug,
    updatedAt: new Date().toISOString(),
  }

  const sql = getSql()
  const action = body.action === "publish" ? "publish" : "save"

  if (action === "publish") {
    const rows = await sql`
      INSERT INTO page_builder_documents (
        slug, title, draft, published, revision, published_revision, published_at, updated_at
      )
      VALUES (
        ${slug},
        ${document.title},
        ${JSON.stringify(document)}::jsonb,
        ${JSON.stringify(document)}::jsonb,
        1,
        1,
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        draft = EXCLUDED.draft,
        published = EXCLUDED.published,
        revision = page_builder_documents.revision + 1,
        published_revision = page_builder_documents.revision + 1,
        published_at = NOW(),
        updated_at = NOW()
      RETURNING revision, published_revision, published_at, updated_at
    ` as unknown as Array<{
      revision: number
      published_revision: number | null
      published_at: string | null
      updated_at: string
    }>
    return NextResponse.json({ ok: true, action, ...rows[0] })
  }

  const rows = await sql`
    INSERT INTO page_builder_documents (slug, title, draft, revision, updated_at)
    VALUES (
      ${slug},
      ${document.title},
      ${JSON.stringify(document)}::jsonb,
      1,
      NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      draft = EXCLUDED.draft,
      revision = page_builder_documents.revision + 1,
      updated_at = NOW()
    RETURNING revision, published_revision, published_at, updated_at
  ` as unknown as Array<{
    revision: number
    published_revision: number | null
    published_at: string | null
    updated_at: string
  }>

  return NextResponse.json({ ok: true, action, ...rows[0] })
}
