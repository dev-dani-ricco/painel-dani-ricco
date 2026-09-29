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
const uniqueTerm = ("nortecore" + stamp).toLowerCase()
const username = "QA_CORE_" + stamp.toUpperCase()
const password = "Qa!Core" + stamp + "9#"
const salt = randomBytes(16).toString("hex")
const hash = (await scrypt(password, salt, 64)).toString("hex")
const userId = "qa-core-" + stamp
const baseUrl = process.env.QA_BASE_URL?.replace(/\/+$/, "")
const shareUrl = process.env.QA_SHARE_URL
const expectNoModel = process.env.QA_EXPECT_NO_MODEL === "1"
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
  [userId, username, "QA Dani Core", "admin", salt, hash],
)

let browser
let sourceId
try {

  browser = await chromium.launch({ headless: true, executablePath })
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
  const page = await context.newPage()

  if (shareUrl) await page.goto(shareUrl, { waitUntil: "domcontentloaded" })
  await page.goto(baseUrl + "/login", { waitUntil: "domcontentloaded" })
  await page.getByLabel("Usuário").waitFor({ state: "visible" })
  await page.waitForTimeout(700)
  await page.getByLabel("Usuário").click()
  await page.getByLabel("Usuário").pressSequentially(username, { delay: 5 })
  await page.locator('input[type="password"]').click()
  await page.locator('input[type="password"]').pressSequentially(password, { delay: 5 })
  const loginButton = page.getByRole("button", { name: /Entrar/ })
  if (!(await loginButton.isEnabled())) throw new Error("LOGIN_NOT_READY")
  await loginButton.click()
  await page.waitForURL((url) => url.pathname === "/", { timeout: 20000 })

  await page.goto(baseUrl + "/inteligencia", { waitUntil: "domcontentloaded" })
  await page.getByText("Ensinar o clone", { exact: true }).waitFor({ state: "visible" })
  await page.getByText("Memória comum", { exact: true }).click()

  await page.getByText("Questionário · revisar antes", { exact: true }).click()

  const questionnaire = [
    "Pergunta 1: Como uma decisão deve ser tratada neste teste?",
    `Resposta: A resposta original deve permanecer como evidência primária auditável ${uniqueTerm}.`,
    "",
    "Pergunta 2: O que acontece se nenhum modelo estiver disponível?",
    "Resposta: A memória deve ser estruturada, pesquisável e permanecer em revisão sem depender de um provedor.",
    "",
    "Pergunta 3: Quando esse conteúdo passa a orientar o clone?",
    "Resposta: Somente depois de revisão humana e aprovação explícita.",
  ].join("\n")

  await page.getByLabel("Ensinar o clone com uma nova memória").fill(questionnaire)
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/knowledge/sources") &&
      response.request().method() === "POST",
    { timeout: 180000 },
  )
  await page.getByRole("button", { name: /Analisar/ }).click()

  const response = await responsePromise
  const body = await response.json()
  if (response.status() !== 201) {
    throw new Error("QUESTIONNAIRE_HTTP_STATUS:" + response.status())
  }

  sourceId = body.source?.id
  if (!sourceId) throw new Error("QUESTIONNAIRE_SOURCE_ID_MISSING")

  const status = await page.evaluate(async (id) => {
    const response = await fetch(`/api/knowledge/sources/${id}/status`, { cache: "no-store" })
    if (!response.ok) throw new Error("STATUS_FETCH_FAILED:" + response.status)
    return response.json()
  }, sourceId)

  if (status.source.lifecycle_status !== "review_required") {
    throw new Error("QUESTIONNAIRE_NOT_QUARANTINED")
  }
  if (!["lexical_only", "ready"].includes(status.source.indexing_status)) {
    throw new Error("QUESTIONNAIRE_NOT_INDEXED:" + status.source.indexing_status)
  }
  if (Number(status.chunks) < 3) throw new Error("QUESTIONNAIRE_CHUNKS_MISSING")

  const completed = new Set(
    status.events.filter((event) => event.status === "completed").map((event) => event.stage),
  )
  for (const stage of ["received", "chunking", "analysis", "persistence", "review"]) {
    if (!completed.has(stage)) throw new Error("INGESTION_STAGE_MISSING:" + stage)
  }

  const embeddingEvent = status.events.find(
    (event) => event.stage === "embedding" && ["completed", "warning"].includes(event.status),
  )
  if (!embeddingEvent) throw new Error("EMBEDDING_MUST_BE_OPTIONAL")

  const analysisEvent = status.events.find(
    (event) => event.stage === "analysis" && event.status === "completed",
  )
  if (!analysisEvent) throw new Error("ANALYSIS_EVENT_MISSING")
  const analysisMode = analysisEvent.details?.analysisMode
  if (!["deterministic", "model-enriched"].includes(analysisMode)) {
    throw new Error("INVALID_ANALYSIS_MODE:" + analysisMode)
  }
  if (expectNoModel && analysisMode !== "deterministic") {
    throw new Error("MODEL_SHOULD_NOT_BE_REQUIRED")
  }

  const chunkRows = await sql.query(
    "SELECT content FROM dani_knowledge_chunks WHERE source_id = $1 ORDER BY ordinal",
    [sourceId],
  )
  if (!chunkRows.some((row) => String(row.content || "").toLowerCase().includes(uniqueTerm))) {
    throw new Error("QUESTIONNAIRE_TEXT_NOT_PERSISTED")
  }

  const chat = await page.evaluate(async (message) => {
    const response = await fetch("/api/knowledge/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
    if (!response.ok) throw new Error("CHAT_CHECK_FAILED:" + response.status)
    return response.json()
  }, uniqueTerm)
  if (chat.sources?.some((item) => item.id === sourceId)) {
    throw new Error("REVIEW_REQUIRED_SOURCE_LEAKED_INTO_CLONE")
  }

  const approved = await page.evaluate(async (id) => {
    const response = await fetch(`/api/knowledge/sources/${id}/approve`, { method: "POST" })
    if (!response.ok) throw new Error("APPROVAL_FAILED:" + response.status)
    return response.json()
  }, sourceId)
  if (approved.source?.lifecycle_status !== "active") {
    throw new Error("APPROVAL_DID_NOT_ACTIVATE_SOURCE")
  }

  const activeChat = await page.evaluate(async (message) => {
    const response = await fetch("/api/knowledge/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
    if (!response.ok) throw new Error("ACTIVE_CHAT_FAILED:" + response.status)
    return response.json()
  }, uniqueTerm)
  if (!activeChat.sources?.some((item) => item.id === sourceId)) {
    throw new Error("APPROVED_SOURCE_NOT_RETRIEVED")
  }
  if (expectNoModel && activeChat.engine !== "dani-core-local") {
    throw new Error("LOCAL_ENGINE_NOT_USED:" + activeChat.engine)
  }
  if (expectNoModel && !String(activeChat.answer || "").includes("Modo CORE local")) {
    throw new Error("LOCAL_GROUNDED_ANSWER_NOT_USED")
  }

  const embeddingRows = await sql.query(
    "SELECT embedding_model FROM dani_knowledge_chunks WHERE source_id = $1 ORDER BY ordinal",
    [sourceId],
  )
  if (!embeddingRows.every((row) => row.embedding_model === "ti-broker-local-hash-v1")) {
    throw new Error("LOCAL_EMBEDDING_MODEL_NOT_PERSISTED")
  }

  console.log("QA_DANI_CORE_HTTP=PASS")
  console.log("QA_DANI_CORE_CHUNKS=" + status.chunks)
  console.log("QA_DANI_CORE_EMBEDDED=" + status.embedded)
  console.log("QA_DANI_CORE_INDEXING=" + status.source.indexing_status)
  console.log("QA_DANI_CORE_ANALYSIS_MODE=" + analysisMode)

  console.log("QA_DANI_CORE_EMBEDDING_STAGE=" + embeddingEvent.status)
  console.log("QA_DANI_CORE_PERSISTENCE=PASS")
  console.log("QA_DANI_CORE_QUARANTINE=PASS")
  console.log("QA_DANI_CORE_PROVIDER_INDEPENDENCE=PASS")
} finally {
  if (browser) await browser.close().catch(() => undefined)
  if (sourceId) {
    await sql.query("DELETE FROM dani_knowledge_sources WHERE id = $1", [sourceId])
      .catch(() => undefined)
  }
  await sql.query("DELETE FROM panel_users WHERE id = $1", [userId])
    .catch(() => undefined)
}

