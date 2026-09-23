import { redirect } from "next/navigation"
import { PublicFrame } from "@/components/diagnostico/public-frame"
import { TestExperience } from "@/components/diagnostico/test-experience"

export const metadata = { title: "Teste Arquetípico IMPAR® | Dani Ricco", robots: { index: false, follow: false } }

export default async function DiagnosticTestPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const raw = query.session
  const sessionId = typeof raw === "string" ? raw : ""
  if (!sessionId) redirect("/diagnostico")
  return <PublicFrame compact><TestExperience sessionId={sessionId} /></PublicFrame>
}