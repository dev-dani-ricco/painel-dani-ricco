import type { KnowledgeIngestionMode } from "@/lib/knowledge-governance"

export type QuestionnaireUnit = {
  ordinal: number
  question: string
  answer: string
}

export type KnowledgeChunkDraft = {
  ordinal: number
  sectionTitle: string | null
  content: string
  metadata: Record<string, unknown>
}

const QUESTION_PREFIX = /^(?:pergunta|quest[aã]o|q)\s*(?:n[ºo]\.?\s*)?(\d{1,3})?\s*[:.)\-–—]?\s*(.+)$/i
const NUMBERED_QUESTION = /^(\d{1,3})\s*[.):\-–—]\s*(.+\?)\s*$/
const ANSWER_PREFIX = /^(?:resposta|r)\s*[:.\-–—]\s*/i

function cleanText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\t ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function detectQuestion(line: string) {
  const normalized = line.trim()
  if (!normalized || normalized.length > 500) return null
  const prefixed = normalized.match(QUESTION_PREFIX)
  if (prefixed) {
    const text = prefixed[2]?.trim() || normalized
    return text.endsWith("?") ? text : text + "?"
  }
  const numbered = normalized.match(NUMBERED_QUESTION)
  if (numbered) return numbered[2].trim()
  if (normalized.endsWith("?") && normalized.length >= 8) return normalized
  return null
}

export function parseQuestionnairePairs(text: string): QuestionnaireUnit[] {
  const lines = cleanText(text).split("\n")
  const units: QuestionnaireUnit[] = []
  let question: string | null = null
  let answer: string[] = []

  const flush = () => {
    const answerText = cleanText(answer.join("\n")).replace(ANSWER_PREFIX, "").trim()
    if (question && answerText) {
      units.push({ ordinal: units.length, question, answer: answerText })
    }
    question = null
    answer = []
  }

  for (const rawLine of lines) {
    const nextQuestion = detectQuestion(rawLine)
    if (nextQuestion) {
      flush()
      question = nextQuestion
      continue
    }
    if (question) answer.push(rawLine)
  }
  flush()

  const meaningful = units.filter((item) => item.answer.length >= 2)
  return meaningful.length >= 2 ? meaningful : []
}

function splitLongAnswer(question: string, answer: string, maxChars = 2600) {
  if (answer.length <= maxChars) return [answer]
  const paragraphs = answer.split(/\n{2,}/).filter(Boolean)
  const parts: string[] = []
  let current = ""
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 2 > maxChars) {
      parts.push(current)
      current = ""
    }
    current += (current ? "\n\n" : "") + paragraph
  }
  if (current) parts.push(current)
  return parts.length ? parts : [answer.slice(0, maxChars)]
}

function questionnaireChunks(text: string): KnowledgeChunkDraft[] {
  const units = parseQuestionnairePairs(text)
  if (!units.length) return []
  const chunks: KnowledgeChunkDraft[] = []
  for (const unit of units) {
    const parts = splitLongAnswer(unit.question, unit.answer)
    parts.forEach((part, partIndex) => {
      chunks.push({
        ordinal: chunks.length,
        sectionTitle: unit.question,
        content: `Pergunta: ${unit.question}\nResposta: ${part}`,
        metadata: {
          questionnaire: true,
          question: unit.question,
          answer: part,
          answerPart: partIndex + 1,
          answerParts: parts.length,
          questionOrdinal: unit.ordinal + 1,
        },
      })
    })
  }
  return chunks
}

function isHeading(line: string) {
  const value = line.trim()
  if (!value || value.length > 140) return false
  return /^#{1,6}\s+/.test(value) ||
    /^\d+(?:\.\d+)*[.)]?\s+\S+/.test(value) ||
    (value === value.toUpperCase() && /[A-ZÀ-Ú]/.test(value))
}

function genericChunks(text: string, targetChars = 1800, overlapChars = 220) {
  const normalized = cleanText(text)
  if (!normalized) return []
  const blocks = normalized.split(/\n{2,}/).filter(Boolean)
  const chunks: KnowledgeChunkDraft[] = []
  let current = ""
  let sectionTitle: string | null = null

  const flush = () => {
    const content = current.trim()
    if (!content) return
    chunks.push({
      ordinal: chunks.length,
      sectionTitle,
      content,
      metadata: { questionnaire: false },
    })
    current = content.slice(Math.max(0, content.length - overlapChars))
  }

  for (const block of blocks) {
    const firstLine = block.split("\n", 1)[0]
    if (isHeading(firstLine)) sectionTitle = firstLine.replace(/^#{1,6}\s+/, "").trim()
    if (current && current.length + block.length + 2 > targetChars) flush()
    if (block.length > targetChars * 2) {
      let rest = block
      while (rest.length > targetChars) {
        const candidate = rest.slice(0, targetChars)
        const cut = Math.max(candidate.lastIndexOf(". "), candidate.lastIndexOf("\n"))
        const safeCut = cut > targetChars * 0.55 ? cut + 1 : targetChars
        current += (current ? "\n\n" : "") + rest.slice(0, safeCut)
        flush()
        rest = rest.slice(safeCut).trim()
      }
      if (rest) current += (current ? "\n\n" : "") + rest
    } else {
      current += (current ? "\n\n" : "") + block
    }
  }
  flush()
  return chunks
}

export function chunkKnowledgeText(
  text: string,
  mode: KnowledgeIngestionMode = "standard",
) {
  if (mode === "questionnaire") {
    const questionnaire = questionnaireChunks(text)
    if (questionnaire.length) return questionnaire
  }
  return genericChunks(text)
}
