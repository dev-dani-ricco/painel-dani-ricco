import { createDiagnosticSession } from "@/lib/diagnostic-db"

function clean(value: unknown, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== "object") return Response.json({ error: "Dados inválidos" }, { status: 400 })
    const data = body as Record<string, unknown>
    const name = clean(data.name, 100)
    const email = clean(data.email, 180).toLowerCase()
    const whatsapp = clean(data.whatsapp, 40)
    const profession = clean(data.profession, 120)
    const consent = data.consent === true
    if (name.length < 2) return Response.json({ error: "Informe seu nome" }, { status: 400 })
    if (!isEmail(email)) return Response.json({ error: "Informe um e-mail válido" }, { status: 400 })
    if (!consent) return Response.json({ error: "É necessário aceitar o uso dos dados para gerar o diagnóstico" }, { status: 400 })

    const rawUtm = data.utm && typeof data.utm === "object" ? data.utm as Record<string, unknown> : {}
    const utm = Object.fromEntries(
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
        .map((key) => [key, clean(rawUtm[key], 120)] as const)
        .filter(([, value]) => value),
    )
    const sessionId = await createDiagnosticSession({
      name, email, whatsapp, profession, consent, source: clean(data.source, 80) || "diagnostico-impar", utm,
    })
    return Response.json({ sessionId })
  } catch (error) {
    console.error("diagnostico/start", error)
    return Response.json({ error: "Não foi possível iniciar o diagnóstico agora" }, { status: 500 })
  }
}