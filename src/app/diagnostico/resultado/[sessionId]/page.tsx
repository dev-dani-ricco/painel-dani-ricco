import { notFound } from "next/navigation"
import { PublicFrame } from "@/components/diagnostico/public-frame"
import { ResultFree } from "@/components/diagnostico/result-free"
import { getDiagnosticResult } from "@/lib/diagnostic-db"
import type { DiagnosticScoreResult } from "@/lib/diagnostic"

export const metadata = {
  title: "Seu Arquétipo Predominante | Diagnóstico IMPAR®",
  robots: { index: false, follow: false },
}

function demoResult(): DiagnosticScoreResult {
  return {
    primary: "sabia",
    secondary: "amante",
    tertiary: "governante",
    ranking: [
      { archetype: "sabia", selected: 6, opportunities: 8, overallPercent: 75, pillarPercents: { visual: 67, verbal: 100, comportamental: 67 }, pillarHits: 3, rankingScore: 615 },
      { archetype: "amante", selected: 4, opportunities: 8, overallPercent: 50, pillarPercents: { visual: 67, verbal: 33, comportamental: 50 }, pillarHits: 3, rankingScore: 415 },
      { archetype: "governante", selected: 3, opportunities: 8, overallPercent: 38, pillarPercents: { visual: 33, verbal: 33, comportamental: 50 }, pillarHits: 3, rankingScore: 315 },
    ],
  }
}

export default async function DiagnosticResultPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const demo = sessionId === "preview"
  const record = demo ? null : await getDiagnosticResult(sessionId)
  if (!demo && !record) notFound()

  const scores = demo ? demoResult() : record!.scores
  const dominant = scores.ranking.find((item) => item.archetype === scores.primary)
  if (!dominant) notFound()

  return (
    <PublicFrame>
      <ResultFree
        sessionId={sessionId}
        name={demo ? "Dani" : record!.name}
        archetypeId={scores.primary}
        overallPercent={dominant.overallPercent}
        pillarPercents={dominant.pillarPercents}
      />
    </PublicFrame>
  )
}