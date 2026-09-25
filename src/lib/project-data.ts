import type { AppData, ProjectStage } from "@/lib/types"

export const DEFAULT_PROJECT_ID = "presenca-alto-valor"

export const DEFAULT_PROJECT_STAGES: ProjectStage[] = [
  { id: "briefing", name: "Briefing", order: 1 },
  { id: "producao", name: "Produção", order: 2 },
  { id: "preview", name: "Preview", order: 3 },
  { id: "revisao", name: "Revisão", order: 4 },
  { id: "lancamento", name: "Lançamento", order: 5 },
  { id: "entrega", name: "Entrega", order: 6 },
]

export function buildStages(names: string[]): ProjectStage[] {
  return names
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name, index) => ({
      id: crypto.randomUUID(),
      name,
      order: index + 1,
    }))
}
export function createProjectInitialData(name: string, status = "Planejamento"): AppData {
  return {
    product: {
      name,
      concept: "",
      description: "",
      promise: "",
      audience: "",
      transformation: "",
      pillars: "",
      differentiators: "",
      pains: "",
      editorial: "",
      notes: "",
      status,
    },
    offer: {},
    tasks: [],
    events: [],
    lessons: [],
    memberItems: [],
    contents: [],
    materials: [],
    launchMetrics: {},
    debriefMetrics: {},
    debrief: {},
    launchRows: [],
  }
}
