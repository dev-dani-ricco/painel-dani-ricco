import { saveDiagnosticResult } from "@/lib/diagnostic-db"
import { scoreDiagnostic, validateAnswers, type DiagnosticAnswers } from "@/lib/diagnostic"

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== "object") return Response.json({ error: "Dados inválidos" }, { status: 400 })
    const data = body as Record<string, unknown>
    const sessionId = typeof data.sessionId === "string" ? data.sessionId.trim() : ""
    const answers = data.answers && typeof data.answers === "object" ? data.answers as DiagnosticAnswers : {}
    if (!sessionId) return Response.json({ error: "Sessão não encontrada" }, { status: 400 })
    if (!validateAnswers(answers)) return Response.json({ error: "Responda todas as 24 perguntas" }, { status: 400 })

    const result = scoreDiagnostic(answers)
    if (sessionId === "preview") {
      return Response.json({ redirect: "/diagnostico/resultado/preview" })
    }
    await saveDiagnosticResult(sessionId, answers, result)
    return Response.json({ redirect: `/diagnostico/resultado/${sessionId}` })
  } catch (error) {
    console.error("diagnostico/finish", error)
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao concluir diagnóstico" }, { status: 500 })
  }
}