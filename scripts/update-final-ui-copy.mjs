import fs from "node:fs"
import { neon } from "@neondatabase/serverless"
const envText=fs.readFileSync(".env.local","utf8")
const match=envText.match(/^DATABASE_URL=(.*)$/m)
if(!match) throw new Error("DATABASE_URL ausente")
const sql=neon(match[1].trim().replace(/^["']|["']$/g,""))
const rows=await sql`SELECT draft,published FROM imersao_content_documents WHERE slug='imersao' LIMIT 1`
if(!rows.length) throw new Error("Documento não encontrado")
function patch(doc){
  if(!doc) return doc
  const next=structuredClone(doc)
  if(next.hero) next.hero.cta="Viver essa experiência"
  for(const offer of next.offers||[]){
    offer.items=(offer.items||[]).map((item)=>item
      .replace("Escolha seu lugar no mapa de assentos — 3 primeiras fileiras","Escolha seu lugar no mapa de assentos: 3 primeiras fileiras")
      .replace("Escolha seu lugar no mapa de assentos — 4ª fileira","Escolha seu lugar no mapa de assentos: 4ª fileira")
      .replace("Escolha seu lugar no mapa de assentos — 5ª fileira","Escolha seu lugar no mapa de assentos: 5ª fileira")
    )
  }
  next.updatedAt=new Date().toISOString()
  return next
}
const draft=patch(rows[0].draft), published=patch(rows[0].published)
await sql`UPDATE imersao_content_documents SET draft=${JSON.stringify(draft)}::jsonb,published=${JSON.stringify(published)}::jsonb,revision=revision+1,published_revision=CASE WHEN published IS NULL THEN published_revision ELSE revision+1 END,published_at=CASE WHEN published IS NULL THEN published_at ELSE NOW() END,updated_at=NOW() WHERE slug='imersao'`
console.log("content updated")
