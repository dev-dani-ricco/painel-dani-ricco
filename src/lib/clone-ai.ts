import OpenAI from "openai"
import {
  LOCAL_EMBEDDING_MODEL,
  localEmbeddings,
} from "@/lib/local-embedding"

export type CloneAISource = "omniroute" | "openai-compatible" | "openai"

export type CloneAI = {
  client: OpenAI
  model: string
  fastModel: string
  source: CloneAISource
  supportsEmbeddings: boolean
}

function normalizedV1BaseUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "")
  return trimmed.endsWith("/v1") ? trimmed : trimmed + "/v1"
}

function configuredOmniRoute(): CloneAI | null {
  const baseUrl =
    process.env.DANI_AI_BASE_URL ||
    process.env.OMNIROUTE_BASE_URL
  const apiKey =
    process.env.DANI_AI_API_KEY ||
    process.env.OMNIROUTE_API_KEY
  if (!baseUrl || !apiKey) return null
  return {
    client: new OpenAI({
      apiKey,
      baseURL: normalizedV1BaseUrl(baseUrl),
    }),
    model:
      process.env.DANI_AI_MODEL ||
      "openrouter/free",
    fastModel:
      process.env.DANI_AI_FAST_MODEL ||
      process.env.DANI_AI_MODEL ||
      "openrouter/free",
    source: "omniroute",
    supportsEmbeddings: false,
  }
}

function configuredCompatibleRuntime(): CloneAI | null {
  const baseUrl = process.env.DANI_OPENAI_COMPAT_BASE_URL
  const apiKey = process.env.DANI_OPENAI_COMPAT_API_KEY
  if (!baseUrl || !apiKey) return null

  return {
    client: new OpenAI({
      apiKey,
      baseURL: normalizedV1BaseUrl(baseUrl),
    }),
    model: process.env.DANI_AI_MODEL || "openrouter/free",
    fastModel: process.env.DANI_AI_FAST_MODEL || process.env.DANI_AI_MODEL || "openrouter/free",
    source: "openai-compatible",
    supportsEmbeddings: Boolean(process.env.DANI_EMBEDDING_MODEL),
  }
}

function configuredOpenAI(): CloneAI | null {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  return {
    client: new OpenAI({ apiKey }),
    model: process.env.OPENAI_MODEL || "gpt-5",
    fastModel: process.env.OPENAI_FAST_MODEL || process.env.OPENAI_MODEL || "gpt-5",
    source: "openai",
    supportsEmbeddings: true,
  }
}

export function cloneAI(request?: Request): CloneAI | null {
  void request
  return configuredOmniRoute() || configuredCompatibleRuntime() || configuredOpenAI()
}

export async function cloneCompletion(input: {
  ai: CloneAI
  system: string
  user: string
  fast?: boolean
  json?: boolean
}) {
  const response = await input.ai.client.chat.completions.create({
    model: input.fast ? input.ai.fastModel : input.ai.model,
    temperature: 0.2,
    stream: false,
    ...(input.json ? { response_format: { type: "json_object" as const } } : {}),
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.user },
    ],
  })

  const content = response.choices[0]?.message?.content
  if (typeof content === "string" && content.trim()) return content.trim()

  if (Array.isArray(content)) {
    const text = content
      .map((part) => typeof part === "string" ? part : "")
      .filter(Boolean)
      .join("\n")
      .trim()
    if (text) return text
  }

  throw new Error("DANI_AI_EMPTY_RESPONSE")
}

export async function embedCloneTexts(texts: string[]) {
  if (!texts.length) return null

  const mode = (process.env.DANI_EMBEDDING_MODE || "local").trim().toLowerCase()
  const explicitBase = process.env.DANI_EMBEDDING_BASE_URL
  const explicitKey = process.env.DANI_EMBEDDING_API_KEY
  const explicitModel = process.env.DANI_EMBEDDING_MODEL

  if (mode === "external" && explicitBase && explicitKey && explicitModel) {
    try {
      const client = new OpenAI({
        apiKey: explicitKey,
        baseURL: normalizedV1BaseUrl(explicitBase),
      })
      const response = await client.embeddings.create({
        model: explicitModel,
        input: texts,
      })
      const vectors = [...response.data]
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding)
      return {
        model: explicitModel,
        source: "optional-external-runtime",
        vectors,
      }
    } catch (error) {
      console.error("external embedding unavailable; using Dani Core local embedding", error)
    }
  }

  return {
    model: LOCAL_EMBEDDING_MODEL,
    source: "dani-core-local",
    vectors: localEmbeddings(texts),
  }
}
