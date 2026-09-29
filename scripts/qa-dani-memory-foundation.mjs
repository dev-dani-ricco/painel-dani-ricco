import fs from "node:fs/promises"
import path from "node:path"
import { randomBytes, scrypt as scryptCallback } from "node:crypto"
import { promisify } from "node:util"
import nextEnv from "@next/env"
import { neon } from "@neondatabase/serverless"
import { chromium } from "playwright"

nextEnv.loadEnvConfig(process.cwd())
const sql = neon(process.env.DATABASE_URL)
const scrypt = promisify(scryptCallback)
const stamp = Date.now().toString(36)
const marker = "QA_DANI_MEMORY_" + stamp.toUpperCase()
const username = "QA_MEM_" + stamp.toUpperCase()
const password = "Qa!Memory" + stamp + "9#"
const salt = randomBytes(16).toString("hex")
const hash = (await scrypt(password, salt, 64)).toString("hex")
const userId = "qa-memory-" + stamp
const baseUrl = process.env.QA_BASE_URL?.replace(/\/+$/, "")
const shareUrl = process.env.QA_SHARE_URL
if (!baseUrl) throw new Error("QA_BASE_URL_REQUIRED")

const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
]
let executablePath
for (const candidate of chromeCandidates) {
  try { await fs.access(candidate); executablePath = candidate; break } catch {}
}

await sql.query(
  "INSERT INTO panel_users (id, username, display_name, role, password_salt, password_hash, active, must_change_password) VALUES ($1,$2,$3,$4,$5,$6,TRUE,FALSE)",
  [userId, username, "QA Dani Memory", "admin", salt, hash],
)

let browser
let sourceId
try {
  browser = await chromium.launch({ headless: true, executablePath })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  if (shareUrl) await page.goto(shareUrl, { waitUntil: "domcontentloaded" })
  await page.goto(baseUrl + "/login", { waitUntil: "domcontentloaded" })
  await page.getByLabel("Usuário").fill(username)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole("button", { name: /Entrar/ }).click()
  await page.waitForURL((url) => url.pathname === "/", { timeout: 20000 })

  await page.goto(baseUrl + "/inteligencia", { waitUntil: "domcontentloaded" })
  await page.getByText("Ensinar o clone", { exact: true }).waitFor({ state: "visible" })
  await page.getByText("Memória comum", { exact: true }).click()
  await page.getByText("Questionário · revisar antes", { exact: true }).click()
  await page.getByText("O questionário será separado", { exact: false }).waitFor({ state: "visible" })

  const questionnaire = [
    `Pergunta 1: Como validar uma decisão ${marker}?`,
    "Resposta: Prefiro uma decisão sustentada por evidência explícita e contexto suficiente.",
    "",
    `Pergunta 2: O que evitar ao usar ${marker}?`,
    "Resposta: Evitar transformar uma interpretação automática em regra sem revisão humana.",
    "",
    `Pergunta 3: Quando ${marker} pode orientar o clone?`,
    "Resposta: Apenas depois da análise e de uma aprovação consciente da memória.",
  ].join("\n")

  await page.getByLabel("Ensinar o clone com uma nova memória").fill(questionnaire)
  const analyze = page.getByRole("button", { name: /Analisar/ })
  await analyze.click()
  await page.getByText("Questionário analisado e indexado", { exact: false }).waitFor({ timeout: 180000 })

  const sourcePayload = await page.evaluate(async ({ userMarker }) => {
    const response = await fetch("/api/knowledge/sources?projectId=dani-clone", { cache: "no-store" })
    if (!response.ok) throw new Error("SOURCE_LIST_FAILED")
    const body = await response.json()
    return body.sources.find((item) =>
      item.metadata?.contributor === userMarker && item.metadata?.ingestionMode === "questionnaire"
    ) || null
  }, { userMarker: username })
  if (!sourcePayload) throw new Error("QUESTIONNAIRE_SOURCE_NOT_FOUND")
  sourceId = sourcePayload.id

  const status = await page.evaluate(async (id) => {
    const response = await fetch(`/api/knowledge/sources/${id}/status`, { cache: "no-store" })
    if (!response.ok) throw new Error("STATUS_FETCH_FAILED")
    return response.json()
  }, sourceId)

  if (status.source.lifecycle_status !== "review_required") throw new Error("QUESTIONNAIRE_NOT_QUARANTINED")
  if (Number(status.chunks) < 3) throw new Error("QUESTIONNAIRE_CHUNKS_MISSING")
  const completedStages = status.events.filter((event) => event.status === "completed").map((event) => event.stage)
  for (const stage of ["received", "chunking", "analysis", "persistence", "review"]) {
    if (!completedStages.includes(stage)) throw new Error("INGESTION_STAGE_MISSING:" + stage)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload({ waitUntil: "domcontentloaded" })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (overflow > 2) throw new Error("DANI_MEMORY_MOBILE_OVERFLOW")

  console.log("QA_DANI_MEMORY_UI=PASS")
  console.log("QA_DANI_MEMORY_QUARANTINE=PASS")
  console.log("QA_DANI_MEMORY_CHUNKS=" + status.chunks)
  console.log("QA_DANI_MEMORY_EMBEDDED=" + status.embedded)
  console.log("QA_DANI_MEMORY_INDEXING=" + status.source.indexing_status)
  console.log("QA_DANI_MEMORY_STAGES=" + status.events.map((event) => `${event.stage}:${event.status}`).join(","))
  console.log("QA_DANI_MEMORY_MOBILE=PASS")
  console.log("QA_DANI_MEMORY_FOUNDATION=PASS")
} finally {
  if (browser) await browser.close().catch(() => undefined)
  if (sourceId) await sql.query("DELETE FROM dani_knowledge_sources WHERE id = $1", [sourceId]).catch(() => undefined)
  await sql.query("DELETE FROM panel_users WHERE id = $1", [userId]).catch(() => undefined)
}
