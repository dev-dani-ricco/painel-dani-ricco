export type DaniEcosystemResource = {
  key: string
  eyebrow: string
  title: string
  description: string
  url: string
  category: "site" | "bio" | "landing_page" | "social"
  source: "painel-dani-ricco" | "external"
  previewImage: string
  previewAlt: string
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
    previewImage: "/dani/previews/site-oficial.jpg",
    previewAlt: "Prévia visual do site oficial de Dani Ricco",
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
    previewImage: "/dani/previews/bio-site.jpg",
    previewAlt: "Prévia visual do bio site de Dani Ricco",
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
    previewImage: "/dani/previews/diagnostico-impar.jpg",
    previewAlt: "Prévia visual da experiência Diagnóstico Arquetípico IMPAR®",
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
    previewImage: "/dani/previews/instagram.jpg",
    previewAlt: "Prévia visual do Instagram de Dani Ricco",
    sortOrder: 40,
  },
]

export function ecosystemResource(key: string) {
  return DANI_ECOSYSTEM_RESOURCES.find((item) => item.key === key)
}
