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
const username = "QA_UX_" + stamp.toUpperCase()
const password = "Qa!Ux" + stamp + "9#"
const salt = randomBytes(16).toString("hex")
const hash = (await scrypt(password, salt, 64)).toString("hex")
const userId = "qa-ux-" + stamp
const baseUrl = (process.env.QA_BASE_URL || "http://127.0.0.1:3333").replace(/\/+$/, "")
const shareUrl = process.env.QA_SHARE_URL

const routes = [
  "/", "/calendario", "/minhas-tarefas", "/inteligencia", "/projetos",
  "/produto", "/oferta", "/curso", "/area-de-membros", "/producao",
  "/pre-lancamento", "/lancamento", "/debriefing", "/materiais", "/configuracoes",
]
const viewports = [
  { name: "desktop", width: 1440, height: 960 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
]

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
  [userId, username, "QA Portal UX", "admin", salt, hash],
)

let browser
const findings = []
try {
  browser = await chromium.launch({ headless: true, executablePath })
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } })
  const page = await context.newPage()
  page.on("pageerror", (error) => findings.push({ severity: "error", route: page.url(), issue: "pageerror", detail: error.message }))

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
  if (!(await login.isEnabled())) throw new Error("LOGIN_NOT_READY")
  await login.click()
  await page.waitForURL((url) => url.pathname === "/", { timeout: 20000 })

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    for (const route of routes) {
      await page.goto(baseUrl + route, { waitUntil: "domcontentloaded" })
      await page.locator(".portal-ui").waitFor({ state: "visible", timeout: 15000 })
      await page.waitForTimeout(150)

      const metrics = await page.evaluate(() => {
        const visible = (el) => {
          const style = getComputedStyle(el)
          const rect = el.getBoundingClientRect()
          return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0
        }
        const all = [...document.querySelectorAll(".portal-ui *")].filter(visible)
        const tinyText = all.filter((el) => {
          if (!(el instanceof HTMLElement)) return false
          if (!el.innerText?.trim()) return false
          if (el.closest(".sr-only,[aria-hidden=true]")) return false
          const size = parseFloat(getComputedStyle(el).fontSize || "0")
          return size > 0 && size < 11
        }).slice(0, 8).map((el) => ({
          text: el.innerText.trim().slice(0, 80),
          size: getComputedStyle(el).fontSize,
          tag: el.tagName,
        }))
        const bodyOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth
        const main = document.querySelector("main")
        const firstContent = main?.firstElementChild?.getBoundingClientRect()
        const header = document.querySelector("header")?.getBoundingClientRect()
        const interactive = [...document.querySelectorAll("button,a[href],input:not([type=checkbox]),textarea,[role=button]")].filter(visible)
        const tooSmallControls = interactive.filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width < 30 || r.height < 30
        }).slice(0, 8).map((el) => {
          const r = el.getBoundingClientRect()
          return { text: (el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || "").trim().slice(0, 60), width: Math.round(r.width), height: Math.round(r.height) }
        })
        const unnamedControls = interactive.filter((el) => {
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            const id = el.id
            const label = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null
            return !(el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || label || el.getAttribute("placeholder"))
          }
          return !(el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.textContent?.trim() || el.getAttribute("title"))
        }).slice(0, 8).map((el) => el.outerHTML.slice(0, 180))
        return {
          bodyOverflow,
          tinyText,
          tooSmallControls,
          firstContentTop: firstContent?.top ?? null,
          headerBottom: header?.bottom ?? null,
          unnamedControls,
          h1Count: document.querySelectorAll("main h1").length,
          title: document.title,
        }
      })

      if (metrics.bodyOverflow > 2) findings.push({ severity: "error", viewport: viewport.name, route, issue: "body-overflow", detail: metrics.bodyOverflow })
      if (metrics.firstContentTop !== null && metrics.headerBottom !== null && metrics.firstContentTop < metrics.headerBottom + 8) findings.push({ severity: "error", viewport: viewport.name, route, issue: "header-overlap", detail: { firstContentTop: metrics.firstContentTop, headerBottom: metrics.headerBottom } })
      if (metrics.tinyText.length) findings.push({ severity: "error", viewport: viewport.name, route, issue: "tiny-text", detail: metrics.tinyText })
      if (metrics.unnamedControls.length) findings.push({ severity: "error", viewport: viewport.name, route, issue: "unnamed-controls", detail: metrics.unnamedControls })
      if (viewport.name === "mobile" && metrics.tooSmallControls.length) findings.push({ severity: "warning", viewport: viewport.name, route, issue: "small-controls", detail: metrics.tooSmallControls })

      if (viewport.name !== "desktop") {
        const menu = page.getByRole("button", { name: "Abrir menu" })
        if (!(await menu.isVisible())) findings.push({ severity: "error", viewport: viewport.name, route, issue: "mobile-menu-missing" })
      }
    }
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(baseUrl + "/inteligencia", { waitUntil: "domcontentloaded" })
  const menu = page.getByRole("button", { name: "Abrir menu" })
  await menu.click()
  await page.locator('[data-slot="sheet-content"]').getByText("Plataforma", { exact: true }).waitFor({ state: "visible" })
  const drawerOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (drawerOverflow > 2) findings.push({ severity: "error", viewport: "mobile", route: "/inteligencia", issue: "drawer-overflow", detail: drawerOverflow })
  await page.keyboard.press("Escape")

  const errors = findings.filter((item) => item.severity === "error")
  const warnings = findings.filter((item) => item.severity === "warning")
  console.log("QA_PORTAL_UX_ROUTES=" + routes.length)
  console.log("QA_PORTAL_UX_VIEWPORTS=" + viewports.length)
  console.log("QA_PORTAL_UX_CHECKS=" + (routes.length * viewports.length))
  console.log("QA_PORTAL_UX_ERRORS=" + errors.length)
  console.log("QA_PORTAL_UX_WARNINGS=" + warnings.length)
  if (findings.length) console.log("QA_PORTAL_UX_FINDINGS=" + JSON.stringify(findings))
  if (errors.length) process.exitCode = 2
  else console.log("QA_PORTAL_UX=PASS")
} finally {
  if (browser) await browser.close().catch(() => undefined)
  await sql.query("DELETE FROM panel_users WHERE id = $1", [userId]).catch(() => undefined)
}
