import { cloneAI, cloneCompletion } from "@/lib/clone-ai"
import { CLONE_DOMAINS } from "@/lib/clone-blueprint"
import { fallbackCloneClassification } from "@/lib/clone-classification"
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
  const answer = typeof chunk.metadata.answer === "string"
    ? chunk.metadata.answer
    : chunk.content
  const question = typeof chunk.metadata.question === "string"
    ? chunk.metadata.question
    : chunk.sectionTitle || undefined
  const classification = fallbackCloneClassification({
    text: answer,
    title: question,
  })
  const normalized = answer.toLowerCase()
  const explicitRule = /\b(sempre|nunca|jamais|deve|prefiro|evito|nao aceito|não aceito)\b/i.test(normalized)
  const sensitive = /\b(saude|saúde|medic|jurid|financeir|famil|relig|politic|sexual|diagnostic)\b/i.test(normalized)

  return {
    topic: classification.topic,
    topicLabel: classification.topicLabel,
    contentType: classification.contentType,
    analysisSummary:
      "Classificação determinística da resposta original; nenhuma inferência de modelo foi necessária.",
    guidance:
      "Use a resposta original como evidência primária. Esta classificação organiza a recuperação e continua sujeita à revisão humana.",
    confidence: classification.confidence,
    guidanceStrength: explicitRule ? "medium" : "low",
    sensitivity: sensitive ? "sensitive" : "normal",
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
    return { items: fallbacks, aiAvailable: false, successfulBatches: 0, failedBatches: 0 }
  }

  const results = [...fallbacks]
  let successfulBatches = 0
  let failedBatches = 0
  const domains = CLONE_DOMAINS.map((item) => `${item.key}=${item.label}`).join("; ")

  for (let start = 0; start < chunks.length; start += 8) {
    const batch = chunks.slice(start, start + 8)
    try {
      const output = await cloneCompletion({
        ai,
        fast: true,
        json: true,
        system: [
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
        user: JSON.stringify({
          items: batch.map((chunk, index) => ({
            index,
            question: chunk.metadata.question || chunk.sectionTitle,
            answer: chunk.metadata.answer || chunk.content,
          })),
        }),
      })
      const parsed = parseJson(output)
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
