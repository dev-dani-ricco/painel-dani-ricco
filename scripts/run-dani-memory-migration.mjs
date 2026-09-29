import { readFile } from "node:fs/promises"
import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL_MISSING")
  process.exit(1)
}

const url = new URL("../db/migrations/20260928_dani_ai_memory_foundation.sql", import.meta.url)
const raw = await readFile(url, "utf8")
const statements = raw
  .split("-- statement-breakpoint")
  .map((statement) => statement.trim())
  .filter(Boolean)

const sql = neon(process.env.DATABASE_URL)
for (let index = 0; index < statements.length; index += 1) {
  await sql.query(statements[index])
  console.log(`MIGRATION_STEP ${index + 1}/${statements.length} OK`)
}

console.log("DANI_MEMORY_MIGRATION_OK")
