import fs from "node:fs/promises"
import path from "node:path"
import { randomBytes, scrypt as scryptCallback } from "node:crypto"
import { promisify } from "node:util"
import nextEnv from "@next/env"
import { neon } from "@neondatabase/serverless"
import { chromium } from "playwright"

nextEnv.loadEnvConfig(process.cwd())
const baseUrl = (process.env.QA_BASE_URL || "http://127.0.0.1:3334").replace(/\/+$/, "")
const shareUrl = process.env.QA_SHARE_URL
const sql = neon(process.env.DATABASE_URL)
const scrypt = promisify(scryptCallback)
const stamp = Date.now().toString(36)
const username = "QA_VIS_" + stamp.toUpperCase()
const password = "Qa!Visual" + stamp + "9#"
const salt = randomBytes(16).toString("hex")
const hash = (await scrypt(password, salt, 64)).toString("hex")
const userId = "qa-visual-" + stamp
const output = path.join(process.cwd(), "qa-artifacts", "portal-ux")
await fs.rm(output, { recursive: true, force: true })
await fs.mkdir(path.join(output, "desktop"), { recursive: true })
await fs.mkdir(path.join(output, "mobile"), { recursive: true })

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
  [userId, username, "QA Visual", "admin", salt, hash],
)

let browser
try {
  browser = await chromium.launch({ headless: true, executablePath })
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
  const page = await context.newPage()
  if (shareUrl) await page.goto(shareUrl, { waitUntil: "domcontentloaded" })
  await page.goto(baseUrl + "/login", { waitUntil: "domcontentloaded" })
  const usernameInput = page.locator("form input").first()
  const passwordInput = page.locator('form input[type="password"]')
  await usernameInput.waitFor({ state: "visible" })
  await page.waitForTimeout(600)
  await usernameInput.click()
  await usernameInput.pressSequentially(username, { delay: 5 })
  await passwordInput.click()
  await passwordInput.pressSequentially(password, { delay: 5 })
  const login = page.getByRole("button", { name: /Entrar/ })
  await login.waitFor({ state: "visible" })
  await page.waitForTimeout(300)
  await login.click()
  await page.waitForURL((url) => url.pathname === "/", { timeout: 20000 })
  const desktopRoutes = [
    ["/", "overview"],
    ["/projetos", "projects"],
    ["/inteligencia", "intelligence"],
    ["/configuracoes", "settings"],
  ]
  await page.setViewportSize({ width: 1600, height: 1000 })
  for (const [route, name] of desktopRoutes) {
    await page.goto(baseUrl + route, { waitUntil: "domcontentloaded" })
    await page.locator(".portal-ui").waitFor({ state: "visible", timeout: 20000 })
    await page.locator("main").first().waitFor({ state: "visible", timeout: 20000 })
    await page.waitForTimeout(700)
    await page.screenshot({
      path: path.join(output, "desktop", name + ".png"),
      fullPage: true,
      animations: "disabled",
    })
  }

  const mobileRoutes = [
    ["/", "overview"],
    ["/calendario", "calendar"],
    ["/inteligencia", "intelligence"],
    ["/projetos", "projects"],
  ]
  await page.setViewportSize({ width: 390, height: 844 })
  for (const [route, name] of mobileRoutes) {
    await page.goto(baseUrl + route, { waitUntil: "domcontentloaded" })
    await page.locator(".portal-ui").waitFor({ state: "visible", timeout: 20000 })
    await page.locator("main").first().waitFor({ state: "visible", timeout: 20000 })
    await page.waitForTimeout(700)
    await page.screenshot({
      path: path.join(output, "mobile", name + ".png"),
      fullPage: true,
      animations: "disabled",
    })
  }

  console.log("PORTAL_UX_SCREENSHOTS=8")
  console.log("PORTAL_UX_SCREENSHOT_DIR=" + output)
} finally {
  if (browser) await browser.close().catch(() => undefined)
  await sql.query("DELETE FROM panel_users WHERE id = $1", [userId]).catch(() => undefined)
}
