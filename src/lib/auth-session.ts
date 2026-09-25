import type { FeatureKey, PanelRole } from "@/lib/auth-config"

export const SESSION_COOKIE = "dani_panel_session"
export const SESSION_MAX_AGE = 60 * 60 * 12

export type PanelSession = {
  sub: string
  username: string
  displayName: string
  role: PanelRole
  permissions: FeatureKey[]
  exp: number
}

function secret() {
  const value = process.env.PANEL_AUTH_SECRET || process.env.DATABASE_URL
  if (!value) throw new Error("PANEL_AUTH_SECRET ou DATABASE_URL não configurado")
  return value
}
function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ""
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function textToBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value))
}

function base64UrlToText(value: string) {
  return new TextDecoder().decode(base64UrlToBytes(value))
}
async function hmac(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  )
  return bytesToBase64Url(new Uint8Array(signature))
}

export async function signSession(
  input: Omit<PanelSession, "exp">,
): Promise<string> {
  const payload: PanelSession = {
    ...input,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  }
  const encoded = textToBase64Url(JSON.stringify(payload))
  return encoded + "." + await hmac(encoded)
}

export async function verifySession(token?: string | null): Promise<PanelSession | null> {
  if (!token) return null
  const [encoded, signature] = token.split(".")
  if (!encoded || !signature) return null

  try {
    const expected = await hmac(encoded)
    if (expected.length !== signature.length) return null
    let mismatch = 0
    for (let index = 0; index < expected.length; index += 1) {
      mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index)
    }
    if (mismatch !== 0) return null

    const payload = JSON.parse(base64UrlToText(encoded)) as PanelSession
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    if (!payload.sub || !payload.username || !Array.isArray(payload.permissions)) return null
    return payload
  } catch {
    return null
  }
}
