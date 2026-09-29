export type ImmersaoBreakpoint = "desktop" | "tablet" | "mobile"

export type MediaTransform = {
  x: number
  y: number
  zoom: number
}

export type ManagedMedia = {
  id: string
  src: string
  alt: string
  name: string
  transform: Record<ImmersaoBreakpoint, MediaTransform>
}

export type EditableListItem = {
  id: string
  title: string
  copy: string
}

export type OfferContent = {
  id: "perola" | "ouro" | "prata"
  name: string
  subtitle: string
  row: string
  price: string
  installment: string
  highlight?: boolean
  items: string[]
}

export type FaqContent = {
  id: string
  question: string
  answer: string
}

export type ImmersaoContentDocument = {
  version: 1
  slug: "imersao"
  event: {
    date: string
    city: string
    spotsLabel: string
  }
  hero: {
    image: ManagedMedia | null
    title: string
    copy: string
    cta: string
  }
  about: {
    image: ManagedMedia | null
  }
  carousel: ManagedMedia[]
  included: EditableListItem[]
  offers: OfferContent[]
  faq: FaqContent[]
  updatedAt?: string
}

const transform = (): Record<ImmersaoBreakpoint, MediaTransform> => ({
  desktop: { x: 0, y: 0, zoom: 1 },
  tablet: { x: 0, y: 0, zoom: 1 },
  mobile: { x: 0, y: 0, zoom: 1 },
})

export function createManagedMedia(name: string, src = "", alt = ""): ManagedMedia {
  return {
    id: crypto.randomUUID(),
    src,
    alt,
    name,
    transform: transform(),
  }
}

export function createDefaultImmersaoContent(): ImmersaoContentDocument {
  return {
    version: 1,
    slug: "imersao",
    event: {
      date: "28 de novembro",
      city: "São José do Rio Preto",
      spotsLabel: "Vagas limitadas",
    },
    hero: {
      image: null,
      title: "Você já tem competência. Agora é hora de ocupar o lugar que ela merece.",
      copy: "Um dia inteiro para transformar conhecimento em posicionamento, autoridade, percepção de valor e oportunidades.",
      cta: "Quero viver essa experiência",
    },
    about: {
      image: null,
    },
    carousel: [],
    included: [
      { id: "hours", title: "12 horas de imersão presencial", copy: "Conteúdo, direção e aplicação ao longo de todo o dia." },
      { id: "workbook", title: "Workbook exclusivo", copy: "Material para acompanhar os conteúdos e organizar decisões." },
      { id: "practical", title: "Aplicações práticas", copy: "Exercícios realizados durante a própria experiência." },
      { id: "method", title: "Método IMPAR®", copy: "Técnicas e ferramentas de posicionamento e comunicação." },
      { id: "content", title: "Criação de conteúdo", copy: "Um momento pensado para transformar posicionamento em comunicação real durante a experiência." },
      { id: "activations", title: "Dinâmicas e ativações", copy: "Experiências para ampliar percepção, movimento e conexão." },
      { id: "networking", title: "Networking estratégico", copy: "Conexões com profissionais, especialistas e empresárias." },
      { id: "gifts", title: "Brindes dos patrocinadores", copy: "Entregas especiais para todas as categorias." },
      { id: "guests", title: "Convidados especiais", copy: "Participações selecionadas para ampliar repertório, aprofundar posicionamento e potencializar seu conhecimento com novas perspectivas." },
    ],
    offers: [
      {
        id: "perola",
        name: "PÉROLA",
        subtitle: "A experiência mais completa.",
        row: "3 primeiras fileiras",
        price: "R$ 999,00",
        installment: "ou em até 12x no cartão",
        highlight: true,
        items: [
          "Imersão completa",
          "Lugar reservado + escolha do assento dentro do setor",
          "Material didático",
          "Brindes dos patrocinadores",
          "Criação de conteúdo",
          "Almoço em 3 tempos",
          "Aula de etiqueta à mesa",
          "Networking mais próximo e direcionado",
          "Happy Hour + música ao vivo",
        ],
      },
      {
        id: "ouro",
        name: "OURO",
        subtitle: "Experiência + celebração.",
        row: "4ª fileira",
        price: "R$ 899,00",
        installment: "ou em até 12x no cartão",
        items: [
          "Imersão completa",
          "Lugar reservado + escolha do assento dentro do setor",
          "Material didático",
          "Brindes dos patrocinadores",
          "Dinâmicas e ativações",
          "Criação de conteúdo",
          "Happy Hour de encerramento",
        ],
      },
      {
        id: "prata",
        name: "PRATA",
        subtitle: "Sua entrada na experiência IMPAR®.",
        row: "5ª fileira com lugar marcado",
        price: "R$ 799,00",
        installment: "ou em até 12x no cartão",
        items: [
          "Imersão completa",
          "Lugar reservado + escolha do assento dentro do setor",
          "Material didático",
          "Brindes dos patrocinadores",
          "Dinâmicas e ativações",
          "Criação de conteúdo",
        ],
      },
    ],
    faq: [
      { id: "faq-1", question: "Para quem é a Posicionamento IMPAR®?", answer: "Para profissionais e empreendedoras que querem aumentar percepção de valor — tanto mulheres já estabelecidas quanto aquelas que desejam começar com direção estratégica." },
      { id: "faq-2", question: "Preciso já ter um negócio?", answer: "Não. Você pode estar começando sua trajetória ou já possuir uma carreira consolidada." },
      { id: "faq-3", question: "É uma imersão sobre Instagram?", answer: "Não. O Instagram faz parte da estratégia, mas a experiência trabalha posicionamento, comunicação, autoridade, presença e percepção de valor de forma mais ampla." },
      { id: "faq-4", question: "Preciso produzir conteúdo atualmente?", answer: "Não. A imersão parte do seu momento atual e ensina como usar a comunicação com intenção." },
      { id: "faq-5", question: "Quanto tempo dura?", answer: "A experiência acontece durante um dia inteiro, com aproximadamente 12 horas de conteúdo, aplicação e experiências." },
      { id: "faq-6", question: "O almoço está incluso?", answer: "O almoço em três tempos faz parte da experiência Pérola." },
      { id: "faq-7", question: "Haverá convidados?", answer: "Sim. As participações especiais serão reveladas durante a campanha." },
    ],
  }
}

export function cloneImmersaoContent(doc: ImmersaoContentDocument): ImmersaoContentDocument {
  return JSON.parse(JSON.stringify(doc)) as ImmersaoContentDocument
}