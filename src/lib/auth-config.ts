export const FEATURES = [
  { key: "overview", label: "Visão Geral", href: "/" },
  { key: "inteligencia", label: "Central de Inteligência", href: "/inteligencia" },
  { key: "calendario", label: "Calendário", href: "/calendario" },
  { key: "produto", label: "Produto", href: "/produto" },
  { key: "oferta", label: "Oferta", href: "/oferta" },
  { key: "curso", label: "Entrega do Curso", href: "/curso" },
  { key: "area_de_membros", label: "Área de Membros", href: "/area-de-membros" },
  { key: "producao", label: "Produção", href: "/producao" },
  { key: "pre_lancamento", label: "Pré-Lançamento", href: "/pre-lancamento" },
  { key: "lancamento", label: "Lançamento", href: "/lancamento" },
  { key: "debriefing", label: "Debriefing", href: "/debriefing" },
  { key: "materiais", label: "Materiais", href: "/materiais" },
  { key: "configuracoes", label: "Configurações", href: "/configuracoes" },
] as const

export type FeatureKey = typeof FEATURES[number]["key"]
export type PanelRole = "owner" | "admin" | "editor" | "reviewer" | "system"

export const FEATURE_GROUPS: Array<{
  key: "platform" | "project" | "administration"
  label: string
  description: string
  features: FeatureKey[]
}> = [
  {
    key: "platform",
    label: "Plataforma",
    description: "Visão geral e ferramentas transversais.",
    features: ["overview", "inteligencia", "calendario"],
  },
  {
    key: "project",
    label: "Projeto · Presença de Alto Valor",
    description: "Briefings, produção, entrega e lançamento deste projeto.",
    features: ["produto", "oferta", "curso", "area_de_membros", "producao", "pre_lancamento", "lancamento", "debriefing", "materiais"],
  },
  {
    key: "administration",
    label: "Administração",
    description: "Configurações e gestão de acessos.",
    features: ["configuracoes"],
  },
]

const ALL = FEATURES.map((item) => item.key)
export const ROLE_DEFAULTS: Record<PanelRole, FeatureKey[]> = {
  owner: [...ALL],
  admin: [...ALL],
  system: [...ALL],
  editor: [
    "overview", "inteligencia", "calendario", "produto", "oferta",
    "curso", "area_de_membros", "producao", "pre_lancamento",
    "lancamento", "debriefing", "materiais",
  ],
  reviewer: [
    "overview", "inteligencia", "calendario", "produto", "oferta",
    "pre_lancamento", "lancamento", "debriefing", "materiais",
  ],
}

export function roleLabel(role: PanelRole) {
  return {
    owner: "Proprietária",
    admin: "Administradora",
    editor: "Editora",
    reviewer: "Revisão",
    system: "Sistema",
  }[role]
}
export function routeFeature(pathname: string): FeatureKey | null {
  if (pathname === "/") return "overview"
  if (pathname.startsWith("/inteligencia") || pathname.startsWith("/api/knowledge/")) return "inteligencia"
  if (pathname.startsWith("/calendario")) return "calendario"
  if (pathname.startsWith("/produto")) return "produto"
  if (pathname.startsWith("/oferta")) return "oferta"
  if (pathname.startsWith("/curso")) return "curso"
  if (pathname.startsWith("/area-de-membros")) return "area_de_membros"
  if (pathname.startsWith("/producao")) return "producao"
  if (pathname.startsWith("/pre-lancamento")) return "pre_lancamento"
  if (pathname.startsWith("/lancamento")) return "lancamento"
  if (pathname.startsWith("/debriefing")) return "debriefing"
  if (pathname.startsWith("/materiais")) return "materiais"
  if (pathname.startsWith("/configuracoes") || pathname.startsWith("/api/auth/users")) return "configuracoes"
  return null
}
