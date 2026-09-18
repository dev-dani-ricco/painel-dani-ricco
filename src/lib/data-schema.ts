import type { AppData } from "@/lib/types"

const appDataArrayKeys = [
  "tasks",
  "events",
  "lessons",
  "memberItems",
  "contents",
  "materials",
  "launchRows",
] as const

export function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false

  const candidate = value as Partial<AppData>
  return Boolean(
    candidate.product &&
    typeof candidate.product === "object" &&
    typeof candidate.product.name === "string" &&
    candidate.offer &&
    typeof candidate.offer === "object" &&
    candidate.launchMetrics &&
    typeof candidate.launchMetrics === "object" &&
    candidate.debriefMetrics &&
    typeof candidate.debriefMetrics === "object" &&
    candidate.debrief &&
    typeof candidate.debrief === "object" &&
    appDataArrayKeys.every((key) => Array.isArray(candidate[key]))
  )
}
