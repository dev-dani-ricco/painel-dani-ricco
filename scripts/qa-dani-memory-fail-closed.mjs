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
const username = "QA_FAIL_" + stamp.toUpperCase()
const password = "Qa!Fail" + stamp + "9#"
const salt = randomBytes(16).toString("hex")
const hash = (await scrypt(password, salt, 64)).toString("hex")
const userId = "qa-fail-" + stamp
const baseUrl = process.env.QA_BASE_URL?.replace(/\/+$/, "")
const shareUrl = process.env.QA_SHARE_URL
if (!baseUrl) throw new Error("QA_BASE_URL_REQUIRED")

const candidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
]
let executablePath
for (const candidate of candidates) {
  try { await fs.access(candidate); executablePath = candidate; break } catch {}
}

await sql.query(
  "INSERT INTO panel_users (id, username, display_name, role, password_salt, password_hash, active, must_change_password) VALUES ($1,$2,$3,$4,$5,$6,TRUE,FALSE)",
  [userId, username, "QA Fail Closed", "admin", salt, hash],
)

let browser
let sourceId
try {
  browser = await chromium.launch({ headless: true, executablePath })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  if (shareUrl) await page.goto(shareUrl, { waitUntil: "domcontentloaded" })
  await page.goto(baseUrl + "/login", { waitUntil: "domcontentloaded" })
  await page.getByLabel("Usuário").waitFor({ state: "visible" })
  await page.waitForTimeout(800)
  await page.getByLabel("Usuário").click()
  await page.getByLabel("Usuário").pressSequentially(username, { delay: 8 })
  await page.locator('input[type="password"]').click()
  await page.locator('input[type="password"]').pressSequentially(password, { delay: 8 })
  const loginButton = page.getByRole("button", { name: /Entrar/ })
  if (!(await loginButton.isEnabled())) throw new Error("LOGIN_FORM_DID_NOT_HYDRATE")
  await loginButton.click()
  await page.waitForURL((url) => url.pathname === "/", { timeout: 20000 })

  await page.goto(baseUrl + "/inteligencia", { waitUntil: "domcontentloaded" })
  await page.getByText("Ensinar o clone", { exact: true }).waitFor({ state: "visible" })
  await page.getByText("Memória comum", { exact: true }).click()
  await page.getByText("Questionário · revisar antes", { exact: true }).click()

  const questionnaire = [
    "Pergunta 1: Qual regra deve valer neste teste?",
    "Resposta: Uma interpretação automática nunca deve ser ativada sem análise e revisão.",
    "",
    "Pergunta 2: Quando o conteúdo pode orientar o clone?",
    "Resposta: Somente depois que o processamento estiver completo e a memória for aprovada.",
  ].join("\n")
  await page.getByLabel("Ensinar o clone com uma nova memória").fill(questionnaire)

  const responsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/knowledge/sources") && response.request().method() === "POST",
    { timeout: 180000 },
  )
  await page.getByRole("button", { name: /Analisar/ }).click()
  const response = await responsePromise
  const body = await response.json()
  sourceId = body.source?.id

  if (response.status() !== 503) throw new Error("FAIL_CLOSED_HTTP_STATUS:" + response.status())
  if (body.error !== "QUESTIONNAIRE_PROCESSING_UNAVAILABLE") throw new Error("FAIL_CLOSED_ERROR_CODE")
  if (!sourceId) throw new Error("FAIL_CLOSED_SOURCE_ID_MISSING")

  await page.getByText("não está disponível", { exact: false }).waitFor({ state: "visible", timeout: 10000 })
  const statusResponse = await context.request.get(baseUrl + `/api/knowledge/sources/${sourceId}/status`)
  if (!statusResponse.ok()) throw new Error("FAIL_CLOSED_STATUS_FETCH")
  const status = await statusResponse.json()
  if (status.source.lifecycle_status !== "review_required") throw new Error("FAIL_CLOSED_NOT_REVIEW_REQUIRED")
  if (status.source.indexing_status !== "analysis_failed") throw new Error("FAIL_CLOSED_WRONG_INDEX_STATUS:" + status.source.indexing_status)
  if (Number(status.chunks) !== 0) throw new Error("FAIL_CLOSED_SHOULD_NOT_PERSIST_CHUNKS")
  const failed = status.events.find((event) => event.stage === "analysis" && event.status === "failed")
  if (!failed) throw new Error("FAIL_CLOSED_ANALYSIS_EVENT_MISSING")

  console.log("QA_FAIL_CLOSED_HTTP=PASS")
  console.log("QA_FAIL_CLOSED_QUARANTINE=PASS")
  console.log("QA_FAIL_CLOSED_INDEXING=" + status.source.indexing_status)
  console.log("QA_FAIL_CLOSED_CHUNKS=" + status.chunks)
  console.log("QA_FAIL_CLOSED_EVENTS=" + status.events.map((event) => `${event.stage}:${event.status}`).join(","))
  console.log("QA_DANI_MEMORY_FAIL_CLOSED=PASS")
} finally {
  if (browser) await browser.close().catch(() => undefined)
  if (sourceId) await sql.query("DELETE FROM dani_knowledge_sources WHERE id = $1", [sourceId]).catch(() => undefined)
  await sql.query("DELETE FROM panel_users WHERE id = $1", [userId]).catch(() => undefined)
}
