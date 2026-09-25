import fs from "node:fs/promises"
import path from "node:path"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { randomBytes, scrypt as scryptCallback } from "node:crypto"
import { promisify } from "node:util"
import nextEnv from "@next/env"
import { neon } from "@neondatabase/serverless"
import { chromium } from "playwright"

nextEnv.loadEnvConfig(process.cwd())
const sql = neon(process.env.DATABASE_URL)
const scrypt = promisify(scryptCallback)
const stamp = Date.now().toString(36)
const username = "QA_" + stamp.toUpperCase()
const password = "Qa!Panel" + stamp + "9#"
const salt = randomBytes(16).toString("hex")
const hash = (await scrypt(password, salt, 64)).toString("hex")
const userId = "qa-" + stamp
const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
]
let executablePath
for (const candidate of chromeCandidates) {
  try { await fs.access(candidate); executablePath = candidate; break } catch {}
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const probe = createServer()
    probe.unref()
    probe.on("error", reject)
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address()
      const port = typeof address === "object" && address ? address.port : 0
      probe.close(() => resolve(port))
    })
  })
}

async function waitForServer(url, timeout = 90000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(url, { redirect: "manual" })
      if (response.status) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 700))
  }
  throw new Error("DEV_SERVER_TIMEOUT")
}

const externalBaseUrl = process.env.QA_BASE_URL?.replace(/\/+$/, "")
let server = null
let baseUrl = externalBaseUrl

if (!baseUrl) {
  await fs.access(path.join(process.cwd(), ".next", "BUILD_ID")).catch(() => {
    throw new Error("QA_REQUIRES_PRODUCTION_BUILD")
  })
  const qaPort = await getFreePort()
  baseUrl = `http://localhost:${qaPort}`
  server = spawn(process.execPath, [
    path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next"),
    "start", "-p", String(qaPort),
  ], { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"], windowsHide: true })
  server.stdout.on("data", (data) => process.stdout.write("[QA SERVER] " + data.toString()))
  server.stderr.on("data", (data) => process.stderr.write("[QA SERVER] " + data.toString()))
}

await sql.query(
  "INSERT INTO panel_users (id, username, display_name, role, password_salt, password_hash, active, must_change_password) VALUES ($1,$2,$3,$4,$5,$6,TRUE,FALSE)",
  [userId, username, "QA Gate", "admin", salt, hash],
)

let browser
try {
  await waitForServer(baseUrl + "/login")
  browser = await chromium.launch({ headless: true, executablePath })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()

  const publicAsset = await context.request.get(baseUrl + "/dani/logo-branca.png")
  if (publicAsset.status() !== 200 || !String(publicAsset.headers()["content-type"] || "").startsWith("image/")) {
    throw new Error("PUBLIC_DANI_ASSET_BLOCKED")
  }
  const privateApi = await context.request.get(baseUrl + "/api/projects")
  if (privateApi.status() !== 401) throw new Error("PRIVATE_API_NOT_PROTECTED")

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
  await page.getByText("Visão Geral", { exact: true }).first().waitFor()
  await page.getByText("Calendário", { exact: true }).first().waitFor()
  await page.getByText("Central de Inteligência", { exact: true }).first().waitFor()

  const homeText = await page.locator("body").innerText()
  if (homeText.includes("Hoje no lançamento") || homeText.includes("Foco da Dani agora")) {
    throw new Error("HOME_LEAKS_PROJECT_DETAIL")
  }
  await page.getByText("Central da Dani", { exact: true }).first().waitFor()
  await page.getByText("IMPAR®", { exact: true }).first().waitFor()
  const previewImages = page.locator('img[src*="/dani/previews/"]')
  const previewCount = await previewImages.count()
  if (previewCount < 4) throw new Error("ECOSYSTEM_PREVIEWS_MISSING")
  await previewImages.first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(900)
  const previewsLoaded = await previewImages.evaluateAll((images) =>
    images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))
  if (!previewsLoaded) throw new Error("ECOSYSTEM_PREVIEWS_NOT_LOADED")

  const headerPosition = await page.locator("header").first().evaluate((el) => getComputedStyle(el).position)
  if (headerPosition !== "fixed") throw new Error("TOPBAR_NOT_FIXED")

  await page.goto(baseUrl + "/minhas-tarefas", { waitUntil: "domcontentloaded" })
  await page.getByRole("heading", { name: "Minhas Tarefas" }).waitFor({ state: "visible" })
  await page.getByRole("button", { name: /Atribuídas a mim/ }).waitFor({ state: "visible" })
  await page.getByText("Uma visão transversal dos cards", { exact: false }).waitFor({ state: "visible" })
  console.log("QA_MY_TASKS=PASS")

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(baseUrl + "/", { waitUntil: "domcontentloaded" })
  await page.getByText("Central da Dani", { exact: true }).first().waitFor()
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (mobileOverflow > 2) throw new Error("MOBILE_HOME_HORIZONTAL_OVERFLOW")
  await page.setViewportSize({ width: 1440, height: 1000 })

  await page.goto(baseUrl + "/projetos", { waitUntil: "domcontentloaded" })
  await page.getByText("Gestão dos projetos", { exact: true }).waitFor({ state: "visible" })
  await page.getByText("Trocar projeto", { exact: true }).click()
  const menuText = await page.locator('[role="menu"]').innerText()
  if (menuText.includes("Abrir quadro")) throw new Error("REDUNDANT_BOARD_ACTION_VISIBLE")
  await page.keyboard.press("Escape")

  const projectState = await page.evaluate(async () => {
    const response = await fetch("/api/projects", { cache: "no-store" })
    if (!response.ok) throw new Error("PROJECTS_FETCH_FAILED")
    return response.json()
  })
  const active = projectState.projects[0]
  if (!active) throw new Error("NO_PROJECT_FOR_QA")
  const originalStages = active.stages
  const stageName = "QA Etapa " + stamp
  await page.getByRole("button", { name: "Adicionar etapa" }).click()
  const stageDialog = page.getByRole("dialog")
  await stageDialog.waitFor({ state: "visible" })
  await stageDialog.getByLabel("Nome da etapa").fill(stageName)
  await stageDialog.getByRole("button", { name: "Adicionar etapa" }).click()
  await page.getByText(stageName, { exact: true }).waitFor({ timeout: 10000 })

  const restored = await page.evaluate(async ({ id, stages }) => {
    const response = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stages }),
    })
    return response.ok
  }, { id: active.id, stages: originalStages })
  if (!restored) throw new Error("STAGE_QA_CLEANUP_FAILED")

  console.log("QA_PROXY_SECURITY=PASS")
  console.log("QA_LOGIN_PERMISSIONS=PASS")
  console.log("QA_HOME_TRANSVERSAL=PASS")
  console.log("QA_ECOSYSTEM_PREVIEWS=PASS")
  console.log("QA_TOPBAR_FIXED=PASS")
  console.log("QA_MOBILE_HOME=PASS")
  console.log("QA_PROJECT_SWITCHER=PASS")
  console.log("QA_ADD_STAGE=PASS")
  console.log("QA_CRITICAL_FLOWS=PASS")
} finally {
  if (browser) await browser.close().catch(() => undefined)
  if (server) {
    if (process.platform === "win32" && server.pid) {
      const killer = spawn("taskkill", ["/PID", String(server.pid), "/T", "/F"], { windowsHide: true })
      await new Promise((resolve) => killer.on("close", resolve))
    } else {
      server.kill("SIGTERM")
    }
  }
  await sql.query("DELETE FROM panel_users WHERE id = $1", [userId]).catch(() => undefined)
}
