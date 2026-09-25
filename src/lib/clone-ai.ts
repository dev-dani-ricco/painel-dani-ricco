import OpenAI from "openai"

export type CloneAI = {
  client: OpenAI
  model: string
  fastModel: string
  source: "openai" | "vercel-gateway"
  authToken: string
}

export function cloneAI(request?: Request): CloneAI | null {
  const directKey = process.env.OPENAI_API_KEY
  if (directKey) {
    return {
      client: new OpenAI({ apiKey: directKey }),
      model: process.env.OPENAI_MODEL || "gpt-5",
      fastModel: process.env.OPENAI_FAST_MODEL || process.env.OPENAI_MODEL || "gpt-5",
      source: "openai",
      authToken: directKey,
    }
  }

  const token =
    process.env.AI_GATEWAY_API_KEY ||
    request?.headers.get("x-vercel-oidc-token") ||
    process.env.VERCEL_OIDC_TOKEN

  if (!token) return null

  return {
    client: new OpenAI({
      apiKey: token,
      baseURL: "https://ai-gateway.vercel.sh/v1",
    }),
    model: process.env.AI_GATEWAY_MODEL || "openai/gpt-5.4",
    fastModel: process.env.AI_GATEWAY_FAST_MODEL || "openai/gpt-5.4-mini",
    source: "vercel-gateway",
    authToken: token,
  }
}
