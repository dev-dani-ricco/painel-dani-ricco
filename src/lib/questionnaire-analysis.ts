import { cloneAI } from "@/lib/clone-ai"
import { CLONE_DOMAINS } from "@/lib/clone-blueprint"
import type { KnowledgeChunkDraft } from "@/lib/knowledge-chunking"

export type QuestionnaireAnalysis = {
  topic: string
  topicLabel: string
  contentType: "principle" | "decision" | "preference" | "case" | "language" | "process" | "fact" | "reference" | "guardrail"
  analysisSummary: string
  guidance: string
  confidence: number
  guidanceStrength: "low" | "medium" | "high"
  sensitivity: "normal" | "sensitive"
  needsHumanReview: boolean
  potentialConflict: string | null
}

const CONTENT_TYPES = new Set<QuestionnaireAnalysis["contentType"]>([
  "principle", "decision", "preference", "case", "language",
  "process", "fact", "reference", "guardrail",
])

function fallbackAnalysis(chunk: KnowledgeChunkDraft): QuestionnaireAnalysis {
  const text = chunk.content.toLowerCase()
  const domain = CLONE_DOMAINS
    .map((item) => ({
      item,
      score: item.keywords.reduce((score, keyword) =>
        score + (text.includes(keyword.toLowerCase()) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score)[0]?.item ?? CLONE_DOMAINS[0]

  return {
    topic: domain.key,
    topicLabel: domain.label,
    contentType: "fact",
    analysisSummary: "Análise automática pendente de validação humana.",
    guidance: "Use somente a resposta explícita como evidência até revisão.",
    confidence: 5,
    guidanceStrength: "low",
    sensitivity: "normal",
    needsHumanReview: true,
    potentialConflict: null,
  }
}

function parseJson(text: string) {
  const cleaned = text.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
  return JSON.parse(cleaned) as { items?: Array<Record<string, unknown>> }
}

function normalizeAnalysis(
  value: Record<string, unknown> | undefined,
  fallback: QuestionnaireAnalysis,
): QuestionnaireAnalysis {
  const domain = CLONE_DOMAINS.find((item) => item.key === value?.topic)
  const contentType = CONTENT_TYPES.has(value?.contentType as QuestionnaireAnalysis["contentType"])
    ? value?.contentType as QuestionnaireAnalysis["contentType"]
    : fallback.contentType
  const strength = ["low", "medium", "high"].includes(String(value?.guidanceStrength))
    ? value?.guidanceStrength as QuestionnaireAnalysis["guidanceStrength"]
    : fallback.guidanceStrength
  return {
    topic: domain?.key || fallback.topic,
    topicLabel: domain?.label || fallback.topicLabel,
    contentType,
    analysisSummary: typeof value?.analysisSummary === "string"
      ? value.analysisSummary.slice(0, 900)
      : fallback.analysisSummary,
    guidance: typeof value?.guidance === "string"
      ? value.guidance.slice(0, 900)
      : fallback.guidance,
    confidence: Math.max(1, Math.min(10, Number(value?.confidence) || fallback.confidence)),
    guidanceStrength: strength,
    sensitivity: value?.sensitivity === "sensitive" ? "sensitive" : "normal",
    needsHumanReview: value?.needsHumanReview !== false,
    potentialConflict: typeof value?.potentialConflict === "string" && value.potentialConflict.trim()
      ? value.potentialConflict.trim().slice(0, 900)
      : null,
  }
}

export type QuestionnaireAnalysisRun = {
  items: QuestionnaireAnalysis[]
  aiAvailable: boolean
  successfulBatches: number
  failedBatches: number
}

export async function analyzeQuestionnaireChunks(
  chunks: KnowledgeChunkDraft[],
  request?: Request,
): Promise<QuestionnaireAnalysisRun> {
  const fallbacks = chunks.map(fallbackAnalysis)
  if (!chunks.length) {
    return { items: [], aiAvailable: false, successfulBatches: 0, failedBatches: 0 }
  }
  const ai = cloneAI(request)
  if (!ai) {
    return { items: fallbacks, aiAvailable: false, successfulBatches: 0, failedBatches: 1 }
  }

  const results = [...fallbacks]
  let successfulBatches = 0
  let failedBatches = 0
  const domains = CLONE_DOMAINS.map((item) => `${item.key}=${item.label}`).join("; ")

  for (let start = 0; start < chunks.length; start += 8) {
    const batch = chunks.slice(start, start + 8)
    try {
      const response = await ai.client.responses.create({
        model: ai.fastModel,
        store: false,
        instructions: [
          "Analise respostas de um questionário destinado a orientar o clone privado de Dani Ricco.",
          "A resposta original é a evidência; sua interpretação é derivada e nunca deve virar fato por si só.",
          "Responda SOMENTE JSON válido no formato {\"items\":[...]}, mantendo a mesma ordem dos itens.",
          "Para cada item retorne: topic, contentType, analysisSummary, guidance, confidence, guidanceStrength, sensitivity, needsHumanReview, potentialConflict.",
          "topic deve ser exatamente um dos domínios fornecidos.",
          "contentType: principle, decision, preference, case, language, process, fact, reference ou guardrail.",
          "guidance deve explicar como a resposta pode orientar decisões futuras sem extrapolar o que foi dito.",
          "confidence vai de 1 a 10 e mede o quanto a orientação está explicitamente sustentada pela resposta.",
          "guidanceStrength é high apenas quando a resposta é clara, normativa e pouco ambígua.",
          "needsHumanReview deve permanecer true se houver ambiguidade, contradição, sensibilidade ou interpretação relevante.",
          "potentialConflict deve ser null se não houver sinal interno de tensão ou contradição.",
          "Nunca invente história, intenção, crença ou regra não escrita na resposta.",
          "DOMÍNIOS: " + domains,
        ].join(" "),
        input: JSON.stringify({
          items: batch.map((chunk, index) => ({
            index,
            question: chunk.metadata.question || chunk.sectionTitle,
            answer: chunk.metadata.answer || chunk.content,
          })),
        }),
      })
      const parsed = parseJson(response.output_text)
      batch.forEach((chunk, index) => {
        results[start + index] = normalizeAnalysis(parsed.items?.[index], fallbacks[start + index])
      })
      successfulBatches += 1
    } catch (error) {
      failedBatches += 1
      console.error("questionnaire analysis fallback", error)
    }
  }

  return {
    items: results,
    aiAvailable: successfulBatches > 0 && failedBatches === 0,
    successfulBatches,
    failedBatches,
  }
}
