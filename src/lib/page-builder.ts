export type PageBreakpoint = "desktop" | "tablet" | "mobile"

export type ElementType = "text" | "image" | "button" | "box" | "divider"

export type ElementRect = {
  x: number
  y: number
  w: number
  h: number
}

export type BreakpointState = {
  rect: ElementRect
  hidden?: boolean
}

export type PageElement = {
  id: string
  name: string
  type: ElementType
  content?: string
  href?: string
  src?: string
  alt?: string
  fit?: "cover" | "contain" | "fill"
  states: Record<PageBreakpoint, BreakpointState>
  style: {
    fontFamily?: "manrope" | "playfair"
    fontSize?: number
    fontWeight?: number
    lineHeight?: number
    letterSpacing?: number
    textAlign?: "left" | "center" | "right"
    color?: string
    background?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    opacity?: number
    padding?: number
    zIndex?: number
    shadow?: string
  }
}

export type PageBuilderDocument = {
  version: 1
  slug: string
  title: string
  settings: {
    background: string
    maxWidth: number
    fontFamily: "manrope" | "playfair"
  }
  canvas: Record<PageBreakpoint, { width: number; height: number }>
  elements: PageElement[]
  updatedAt?: string
}

const rect = (x:number,y:number,w:number,h:number): Record<PageBreakpoint, BreakpointState> => ({
  desktop: { rect: { x, y, w, h } },
  tablet: { rect: { x: Math.round(x * 0.53), y: Math.round(y * 0.62), w: Math.min(Math.round(w * 0.53), 720), h: Math.round(h * 0.72) } },
  mobile: { rect: { x: 20, y: Math.round(y * 0.58), w: 350, h: Math.max(Math.round(h * 0.72), 56) } },
})

export function createDefaultImersaoDocument(): PageBuilderDocument {
  return {
    version: 1,
    slug: "imersao",
    title: "Posicionamento IMPAR® — A Imersão",
    settings: { background: "#000000", maxWidth: 1440, fontFamily: "manrope" },
    canvas: {
      desktop: { width: 1440, height: 4200 },
      tablet: { width: 768, height: 5200 },
      mobile: { width: 390, height: 6100 },
    },
    elements: [
      {
        id: "hero-logo",
        name: "Logo do evento",
        type: "image",
        src: "https://daniricco.com.br/imersao/logo-evento-transparente.png",
        alt: "Posicionamento IMPAR® — A Imersão",
        fit: "contain",
        states: rect(70, 70, 210, 120),
        style: { zIndex: 3 },
      },
      {
        id: "hero-photo",
        name: "Foto Hero",
        type: "image",
        alt: "Adicionar foto Dani — hero",
        fit: "cover",
        states: rect(170, 210, 1100, 560),
        style: { background: "#090909", borderColor: "#252525", borderWidth: 1, borderRadius: 24, zIndex: 1 },
      },
      {
        id: "hero-title",
        name: "Headline Hero",
        type: "text",
        content: "Você já tem competência. Agora é hora de ocupar o lugar que ela merece.",
        states: rect(280, 820, 880, 88),
        style: { fontFamily: "playfair", fontSize: 42, fontWeight: 500, lineHeight: 1.05, textAlign: "center", color: "#ffffff", zIndex: 2 },
      },
      {
        id: "hero-copy",
        name: "Texto Hero",
        type: "text",
        content: "Um dia inteiro para transformar conhecimento em posicionamento, autoridade, percepção de valor e oportunidades.",
        states: rect(360, 930, 720, 72),
        style: { fontFamily: "manrope", fontSize: 18, fontWeight: 400, lineHeight: 1.45, textAlign: "center", color: "#a8a8a8", zIndex: 2 },
      },
      {
        id: "hero-cta",
        name: "Botão Hero",
        type: "button",
        content: "QUERO VIVER ESSA EXPERIÊNCIA",
        href: "#experiencias",
        states: rect(510, 1030, 420, 58),
        style: { fontFamily: "manrope", fontSize: 13, fontWeight: 700, textAlign: "center", color: "#ffffff", background: "#E85002", borderRadius: 999, zIndex: 2 },
      },
      {
        id: "impact-1",
        name: "Insight 01",
        type: "box",
        states: rect(0, 1160, 1440, 220),
        style: { background: "#341004", zIndex: 0 },
      },
      {
        id: "impact-text-1",
        name: "Texto Insight 01",
        type: "text",
        content: "A gente não entra no jogo para jogar. A gente entra para ganhar.",
        states: rect(250, 1215, 940, 100),
        style: { fontFamily: "playfair", fontSize: 46, fontWeight: 500, lineHeight: 1.05, textAlign: "center", color: "#ffffff", zIndex: 2 },
      },
      {
        id: "section-title-1",
        name: "Título Público",
        type: "text",
        content: "Duas fases diferentes. Um mesmo desafio.",
        states: rect(250, 1480, 940, 90),
        style: { fontFamily: "playfair", fontSize: 54, fontWeight: 500, lineHeight: 1.0, textAlign: "center", color: "#ffffff", zIndex: 2 },
      },
      {
        id: "section-title-2",
        name: "Título Conteúdo",
        type: "text",
        content: "12 horas para transformar conhecimento em posicionamento.",
        states: rect(240, 1900, 960, 100),
        style: { fontFamily: "playfair", fontSize: 54, fontWeight: 500, lineHeight: 1.0, textAlign: "center", color: "#ffffff", zIndex: 2 },
      },
      {
        id: "method-logo",
        name: "Logo Método IMPAR®",
        type: "image",
        src: "https://daniricco.com.br/imersao/metodo-impar-branca.png",
        alt: "Método IMPAR®",
        fit: "contain",
        states: rect(160, 2450, 340, 250),
        style: { zIndex: 2 },
      },
      {
        id: "method-copy",
        name: "Texto Método",
        type: "text",
        content: "Uma metodologia registrada para organizar aquilo que já existe em você e fortalecer como é percebida, como se comunica e como se posiciona.",
        states: rect(560, 2500, 700, 120),
        style: { fontFamily: "manrope", fontSize: 19, fontWeight: 400, lineHeight: 1.5, textAlign: "left", color: "#d7d7d7", zIndex: 2 },
      },
      {
        id: "experience-title",
        name: "Título Experiência",
        type: "text",
        content: "Depois de entender o método, você vive tudo isso na prática.",
        states: rect(250, 2860, 940, 100),
        style: { fontFamily: "playfair", fontSize: 50, fontWeight: 500, lineHeight: 1.0, textAlign: "center", color: "#ffffff", zIndex: 2 },
      },
      {
        id: "photo-strip-1",
        name: "Foto Evento 01",
        type: "image",
        alt: "Adicionar foto — melhores momentos",
        fit: "cover",
        states: rect(80, 3050, 400, 300),
        style: { background: "#090909", borderColor: "#222222", borderWidth: 1, borderRadius: 18, zIndex: 1 },
      },
      {
        id: "photo-strip-2",
        name: "Foto Evento 02",
        type: "image",
        alt: "Adicionar foto — experiência presencial",
        fit: "cover",
        states: rect(520, 3050, 400, 300),
        style: { background: "#090909", borderColor: "#222222", borderWidth: 1, borderRadius: 18, zIndex: 1 },
      },
      {
        id: "photo-strip-3",
        name: "Foto Evento 03",
        type: "image",
        alt: "Adicionar foto — conexões",
        fit: "cover",
        states: rect(960, 3050, 400, 300),
        style: { background: "#090909", borderColor: "#222222", borderWidth: 1, borderRadius: 18, zIndex: 1 },
      },
      {
        id: "access-title",
        name: "Título Ingressos",
        type: "text",
        content: "Escolha como você quer viver a experiência.",
        states: rect(280, 3540, 880, 95),
        style: { fontFamily: "playfair", fontSize: 50, fontWeight: 500, lineHeight: 1.0, textAlign: "center", color: "#ffffff", zIndex: 2 },
      },
      {
        id: "lot-zero",
        name: "Lote Zero",
        type: "text",
        content: "LOTE ZERO · VAGAS LIMITADAS · COMPRE ANTES DA VIRADA DE LOTE",
        states: rect(320, 3670, 800, 62),
        style: { fontFamily: "manrope", fontSize: 14, fontWeight: 700, lineHeight: 1.2, textAlign: "center", color: "#ffffff", background: "#2a0d03", borderColor: "#713016", borderWidth: 1, borderRadius: 18, padding: 18, zIndex: 2 },
      },
    ],
  }
}

export function cloneDocument(doc: PageBuilderDocument): PageBuilderDocument {
  return JSON.parse(JSON.stringify(doc)) as PageBuilderDocument
}
