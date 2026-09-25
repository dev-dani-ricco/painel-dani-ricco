export type DaniEcosystemResource = {
  key: string
  eyebrow: string
  title: string
  description: string
  url: string
  category: "site" | "bio" | "landing_page" | "social"
  source: "painel-dani-ricco" | "external"
  sortOrder: number
}

export const DANI_ECOSYSTEM_RESOURCES: DaniEcosystemResource[] = [
  {
    key: "site-oficial",
    eyebrow: "Site oficial",
    title: "daniricco.com.br",
    description: "Site institucional, Método IMPAR® e Comunicação de Impacto.",
    url: "https://daniricco.com.br",
    category: "site",
    source: "painel-dani-ricco",
    sortOrder: 10,
  },
  {
    key: "bio-site",
    eyebrow: "Bio site",
    title: "Bio Dani Ricco",
    description: "Central pública de links e caminhos principais do ecossistema.",
    url: "https://bio.daniricco.com.br",
    category: "bio",
    source: "painel-dani-ricco",
    sortOrder: 20,
  },
  {
    key: "diagnostico-impar",
    eyebrow: "Landing page",
    title: "Diagnóstico Arquetípico IMPAR®",
    description: "Experiência gratuita de entrada para o diagnóstico arquetípico.",
    url: "https://diagnostico.daniricco.com.br",
    category: "landing_page",
    source: "external",
    sortOrder: 30,
  },
  {
    key: "instagram",
    eyebrow: "Instagram",
    title: "@daniricco",
    description: "Conteúdo, bastidores, experiências e comunicação da marca.",
    url: "https://www.instagram.com/daniricco/",
    category: "social",
    source: "external",
    sortOrder: 40,
  },
]

export function ecosystemResource(key: string) {
  return DANI_ECOSYSTEM_RESOURCES.find((item) => item.key === key)
}
