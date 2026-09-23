import { unlockDiagnostic } from "@/lib/diagnostic-db"

export async function POST(request: Request) {
  const configuredSecret = process.env.DIAGNOSTICO_WEBHOOK_SECRET
  if (!configuredSecret) return Response.json({ error: "Webhook não configurado" }, { status: 503 })
  const supplied = request.headers.get("x-diagnostico-secret")
  if (supplied !== configuredSecret) return Response.json({ error: "Não autorizado" }, { status: 401 })

  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== "object") return Response.json({ error: "Payload inválido" }, { status: 400 })
    const data = body as Record<string, unknown>
    const sessionId = typeof data.session_id === "string" ? data.session_id.trim() : ""
    const status = typeof data.status === "string" ? data.status.toLowerCase() : "paid"
    if (!sessionId) return Response.json({ error: "session_id obrigatório" }, { status: 400 })
    if (!["paid", "approved", "completed"].includes(status)) return Response.json({ ok: true, unlocked: false })
    const unlocked = await unlockDiagnostic(sessionId)
    return Response.json({ ok: true, unlocked })
  } catch (error) {
    console.error("diagnostico/webhook", error)
    return Response.json({ error: "Falha ao processar webhook" }, { status: 500 })
  }
}