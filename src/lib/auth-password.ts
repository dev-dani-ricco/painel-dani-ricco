import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(scryptCallback)
const KEY_LENGTH = 64

export function passwordPolicyError(password: string) {
  if (password.length < 12) return "A senha deve ter pelo menos 12 caracteres."
  if (!/[A-Z]/.test(password)) return "Inclua pelo menos uma letra maiúscula."
  if (!/[a-z]/.test(password)) return "Inclua pelo menos uma letra minúscula."
  if (!/[0-9]/.test(password)) return "Inclua pelo menos um número."
  if (!/[^A-Za-z0-9]/.test(password)) return "Inclua pelo menos um símbolo."
  return null
}

export async function hashPassword(password: string) {
  const policyError = passwordPolicyError(password)
  if (policyError) throw new Error(policyError)
  const salt = randomBytes(16).toString("hex")
  const derived = await scrypt(password, salt, KEY_LENGTH) as Buffer
  return { salt, hash: derived.toString("hex") }
}

export async function verifyPassword(password: string, salt: string, hash: string) {
  const derived = await scrypt(password, salt, KEY_LENGTH) as Buffer
  const expected = Buffer.from(hash, "hex")
  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}
