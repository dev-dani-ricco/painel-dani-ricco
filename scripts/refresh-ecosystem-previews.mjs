import fs from "node:fs/promises"
import path from "node:path"
import { chromium } from "playwright"

const root = process.cwd()
const outDir = path.join(root, "public", "dani", "previews")
const targets = [
  ["site-oficial", "https://daniricco.com.br"],
  ["bio-site", "https://bio.daniricco.com.br"],
  ["diagnostico-impar", "https://diagnostico.daniricco.com.br"],
  ["instagram", "https://www.instagram.com/daniricco/"],
]

await fs.mkdir(outDir, { recursive: true })
const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
]
let executablePath
for (const candidate of chromeCandidates) {
  try { await fs.access(candidate); executablePath = candidate; break } catch {}
}
const browser = await chromium.launch({ headless: true, executablePath })

try {
  for (const [key, url] of targets) {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 })
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
      await page.waitForTimeout(1800)
      await page.screenshot({
        path: path.join(outDir, key + ".jpg"),
        type: "jpeg",
        quality: 76,
        fullPage: false,
      })
      console.log("PREVIEW_OK=" + key)
    } catch (error) {
      console.warn("PREVIEW_FAILED=" + key + ":" + (error instanceof Error ? error.message : String(error)))
    } finally {
      await page.close()
    }
  }
} finally {
  await browser.close()
}
