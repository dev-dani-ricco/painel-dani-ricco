export type KnowledgeAuthorityType =
  | "dani_direct"
  | "official_document"
  | "team_observation"
  | "external_reference"
  | "derived_analysis"

export type KnowledgeLifecycleStatus =
  | "active"
  | "review_required"
  | "superseded"
  | "rejected"

export type KnowledgeIngestionMode = "standard" | "questionnaire"

export const AUTHORITY_WEIGHTS: Record<KnowledgeAuthorityType, number> = {
  dani_direct: 1,
  official_document: 0.95,
  team_observation: 0.72,
  external_reference: 0.6,
  derived_analysis: 0.5,
}

export function authorityWeight(type: KnowledgeAuthorityType) {
  return AUTHORITY_WEIGHTS[type]
}

export function canContributeKnowledge(role: string) {
  return ["owner", "admin", "editor", "system"].includes(role)
}

export function canApproveKnowledge(role: string) {
  return ["owner", "admin", "system"].includes(role)
}

export function normalizeAuthorityType(
  value: unknown,
  fallback: KnowledgeAuthorityType,
): KnowledgeAuthorityType {
  const candidate = typeof value === "string" ? value : ""
  return candidate in AUTHORITY_WEIGHTS
    ? candidate as KnowledgeAuthorityType
    : fallback
}

export function defaultAuthorityForUser(username?: string | null) {
  return username?.trim().toUpperCase() === "DANI"
    ? "dani_direct" as const
    : "team_observation" as const
}

export function lifecycleForIngestion(mode: KnowledgeIngestionMode) {
  return mode === "questionnaire"
    ? "review_required" as const
    : "active" as const
}
