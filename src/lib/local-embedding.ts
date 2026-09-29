import { createHash } from "node:crypto"

export const LOCAL_EMBEDDING_DIMENSIONS = 1536
export const LOCAL_EMBEDDING_MODEL = "ti-broker-local-hash-v1"

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function features(text: string) {
  const normalized = normalize(text)
  const words = normalized.split(" ").filter((word) => word.length > 1)
  const output: string[] = []

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index]
    output.push("w:" + word)
    if (index + 1 < words.length) output.push("b:" + word + "_" + words[index + 1])
    if (word.length >= 5) {
      for (let start = 0; start <= word.length - 3; start += 1) {
        output.push("c:" + word.slice(start, start + 3))
      }
    }
  }

  return output
}
function featureIndex(feature: string) {
  const digest = createHash("sha256").update(feature).digest()
  const index = digest.readUInt32BE(0) % LOCAL_EMBEDDING_DIMENSIONS
  const sign = (digest[4] & 1) === 0 ? 1 : -1
  return { index, sign }
}

export function localEmbedding(text: string) {
  const vector = new Array<number>(LOCAL_EMBEDDING_DIMENSIONS).fill(0)
  const counts = new Map<string, number>()

  for (const feature of features(text)) {
    counts.set(feature, (counts.get(feature) || 0) + 1)
  }

  for (const [feature, count] of counts) {
    const { index, sign } = featureIndex(feature)
    vector[index] += sign * (1 + Math.log(count))
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
  if (!norm) return vector
  return vector.map((value) => value / norm)
}

export function localEmbeddings(texts: string[]) {
  return texts.map(localEmbedding)
}
