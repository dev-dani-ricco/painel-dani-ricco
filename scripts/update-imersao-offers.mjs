import fs from "node:fs"
import { neon } from "@neondatabase/serverless"

const envText = fs.readFileSync(".env.local", "utf8")
const match = envText.match(/^DATABASE_URL=(.*)$/m)
if (!match) throw new Error("DATABASE_URL ausente")
const connectionString = match[1].trim().replace(/^["']|["']$/g, "")
const sql = neon(connectionString)

const rows = await sql`
  SELECT draft, published
  FROM imersao_content_documents
  WHERE slug = 'imersao'
  LIMIT 1
`

if (!rows.length) throw new Error("Documento da imersão não encontrado")

function update(doc) {
  if (!doc) return doc
  const next = structuredClone(doc)
  const byId = Object.fromEntries((next.offers || []).map((offer) => [offer.id, offer]))

  Object.assign(byId.perola, {
    subtitle: "Assento premium + almoço + Happy Hour.",
    row: "Escolha seu lugar no mapa • 3 primeiras fileiras",
    price: "R$ 899,00",
    items: [
      "Escolha seu lugar no mapa de assentos — 3 primeiras fileiras",
      "Almoço em 3 tempos no local",
      "Happy Hour ao final + música ao vivo",
      "Imersão completa",
      "Material didático",
      "Brindes dos patrocinadores",
      "Criação de conteúdo",
      "Aula de etiqueta à mesa",
      "Networking mais próximo e direcionado",
    ],
  })

  Object.assign(byId.ouro, {
    subtitle: "Assento na 4ª fileira + Happy Hour.",
    row: "Escolha seu lugar no mapa • 4ª fileira",
    price: "R$ 799,00",
    items: [
      "Escolha seu lugar no mapa de assentos — 4ª fileira",
      "Happy Hour ao final + música ao vivo",
      "Imersão completa",
      "Material didático",
      "Brindes dos patrocinadores",
      "Dinâmicas e ativações",
      "Criação de conteúdo",
    ],
  })

  Object.assign(byId.prata, {
    subtitle: "Assento reservado na 5ª fileira.",
    row: "Escolha seu lugar no mapa • 5ª fileira",
    price: "R$ 699,00",
    items: [
      "Escolha seu lugar no mapa de assentos — 5ª fileira",
      "Imersão completa",
      "Material didático",
      "Brindes dos patrocinadores",
      "Dinâmicas e ativações",
      "Criação de conteúdo",
    ],
  })

  next.updatedAt = new Date().toISOString()
  return next
}

const draft = update(rows[0].draft)
const published = update(rows[0].published)

await sql`
  UPDATE imersao_content_documents
  SET
    draft = ${JSON.stringify(draft)}::jsonb,
    published = ${JSON.stringify(published)}::jsonb,
    revision = revision + 1,
    published_revision = CASE
      WHEN published IS NULL THEN published_revision
      ELSE revision + 1
    END,
    published_at = CASE
      WHEN published IS NULL THEN published_at
      ELSE NOW()
    END,
    updated_at = NOW()
  WHERE slug = 'imersao'
`

console.log("offers updated")
