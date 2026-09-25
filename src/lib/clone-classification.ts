import { cloneAI } from "@/lib/clone-ai"
import { CLONE_DOMAINS } from "@/lib/clone-blueprint"

export type CloneClassification = {
  topic: string
  topicLabel: string
  keywords: string[]
  terms: string[]
  contentType:
    | "principle"
    | "decision"
    | "preference"
    | "case"
    | "language"
    | "process"
    | "fact"
    | "reference"
    | "guardrail"
  detailLevel: "signal" | "context" | "deep"
  confidence: number
}

const CONTENT_TYPES: CloneClassification["contentType"][] = [
  "principle", "decision", "preference", "case", "language",
  "process", "fact", "reference", "guardrail",
]

function cleanWords(text: string) {
  return [...new Set(
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 5)
  )].slice(0, 8)
}

export function fallbackCloneClassification(input: {
  text: string
  title?: string
}): CloneClassification {
  const normalized = (input.title + " " + input.text).toLowerCase()
  let best = CLONE_DOMAINS[0]
  let bestScore = -1

  for (const domain of CLONE_DOMAINS) {
    const score = domain.keywords.reduce(
      (total, keyword) => total + (normalized.includes(keyword.toLowerCase()) ? 1 : 0),
      0,
    )
    if (score > bestScore) {
      best = domain
      bestScore = score
    }
  }

  const contentType: CloneClassification["contentType"] =
    /jamais|nunca|limite|privad|confidencial/.test(normalized) ? "guardrail" :
    /decid|escolh|aprov|reprov|aceit|recus/.test(normalized) ? "decision" :
    /prefir|gost|evit|combina/.test(normalized) ? "preference" :
    /caso|aconteceu|situação|situacao|exemplo/.test(normalized) ? "case" :
    /palavra|frase|tom|linguagem|comunica/.test(normalized) ? "language" :
    /processo|etapa|sequência|sequencia|ritual/.test(normalized) ? "process" :
    /acredito|valor|princípio|principio/.test(normalized) ? "principle" :
    "fact"

  const length = input.text.trim().length
  return {
    topic: best.key,
    topicLabel: best.label,
    keywords: cleanWords(input.text),
    terms: best.keywords.slice(0, 5),
    contentType,
    detailLevel: length > 1800 ? "deep" : length > 500 ? "context" : "signal",
    confidence: 6,
  }
}

export async function classifyCloneContent(input: {
  request: Request
  text: string
  title?: string
}): Promise<CloneClassification> {
  const fallback = fallbackCloneClassification(input)
  const ai = cloneAI(input.request)
  if (!ai || !input.text.trim()) return fallback

  try {
    const domains = CLONE_DOMAINS.map((item) => item.key + "=" + item.label).join("; ")
    const response = await ai.client.responses.create({
      model: ai.fastModel,
      store: false,
      instructions: [
        "Classifique uma memória destinada ao clone digital de Dani Ricco.",
        "Responda SOMENTE JSON válido, sem markdown.",
        "Escolha exatamente um topic entre os domínios fornecidos.",
        "keywords: 3 a 8 palavras curtas úteis para recuperação.",
        "terms: conceitos, nomes, métodos ou expressões relevantes.",
        "contentType deve ser um de: " + CONTENT_TYPES.join(", ") + ".",
        "detailLevel deve ser signal, context ou deep.",
        "confidence é 1 a 10 e representa o quanto o conteúdo parece explícito versus inferido.",
        "Nunca invente fatos ausentes.",
        "DOMÍNIOS: " + domains,
      ].join(" "),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "TÍTULO: " + (input.title || "Sem título") +
                "\n\nCONTEÚDO:\n" + input.text.slice(0, 16000),
            },
          ],
        },
      ],
    })

    const parsed = JSON.parse(response.output_text) as Partial<CloneClassification>
    const domain = CLONE_DOMAINS.find((item) => item.key === parsed.topic)
    if (!domain) return fallback

    const contentType = CONTENT_TYPES.includes(parsed.contentType as CloneClassification["contentType"])
      ? parsed.contentType as CloneClassification["contentType"]
      : fallback.contentType

    const detailLevel = ["signal", "context", "deep"].includes(String(parsed.detailLevel))
      ? parsed.detailLevel as CloneClassification["detailLevel"]
      : fallback.detailLevel

    return {
      topic: domain.key,
      topicLabel: domain.label,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String).slice(0, 8) : fallback.keywords,
      terms: Array.isArray(parsed.terms) ? parsed.terms.map(String).slice(0, 8) : fallback.terms,
      contentType,
      detailLevel,
      confidence: Math.max(1, Math.min(10, Number(parsed.confidence) || fallback.confidence)),
    }
  } catch (error) {
    console.error("clone classification fallback", error)
    return fallback
  }
}
