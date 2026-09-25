import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(scryptCallback)
const KEY_LENGTH = 64

export async function hashPassword(password: string) {
  if (password.length < 12) throw new Error("Senha inicial deve ter pelo menos 12 caracteres")
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
