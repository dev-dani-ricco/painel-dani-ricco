import type { AppData, CalendarEvent, ContentItem, Lesson, Material, MemberItem, Task } from "@/lib/types"

const task = (id: string, title: string, due: string, status: Task["status"], priority: Task["priority"], owner: string, category: string, notes = ""): Task => ({
  id, title, due, status, priority, owner, category, notes, link: "", done: status === "Concluído",
})

export const initialTasks: Task[] = [
  task("t1", "Validar estrutura e módulos do curso", "28/08/2026", "Em aprovação", "Alta", "Dani Ricco", "Aulas do curso"),
  task("t2", "Definir dois dias de gravação", "Sem data", "Aguardando definição da Dani", "Alta", "Dani Ricco", "Gravações"),
  task("t3", "Aprovar linha editorial da campanha", "30/08/2026", "Em aprovação", "Alta", "Dani Ricco", "Conteúdos orgânicos"),
  task("t4", "Enviar provas e depoimentos do Workshop Imagem que Vende", "02/09/2026", "Em produção", "Alta", "Dani Ricco", "Criativos"),
  task("t5", "Estruturar módulos do curso", "28/08/2026", "Em produção", "Alta", "Conteúdo", "Aulas do curso"),
  task("t6", "Reservar 1 dia para gravação do curso completo", "Sem data", "Aguardando definição da Dani", "Alta", "Dani Ricco", "Gravações"),
  task("t7", "Reservar 1 dia para gravação dos criativos e materiais de divulgação", "Sem data", "Aguardando definição da Dani", "Alta", "Dani Ricco", "Gravações"),
  task("t8", "Gravar aulas", "Sem data", "A iniciar", "Alta", "Dani Ricco", "Gravações"),
  task("t9", "Editar aulas", "10/10/2026", "A iniciar", "Média", "Edição", "Edição"),
  task("t10", "Criar identidade do lançamento", "15/09/2026", "Concluído", "Média", "Design", "Criativos"),
  task("t11", "Criar página de vendas", "18/10/2026", "Em produção", "Alta", "Time digital", "Página de vendas"),
  task("t12", "Criar criativos de tráfego", "20/10/2026", "Em aprovação", "Alta", "Design", "Anúncios"),
  task("t13", "Configurar área de membros", "30/10/2026", "A iniciar", "Média", "Time digital", "Área de membros"),
  task("t14", "Preparar Lista VIP", "24/09/2026", "Em produção", "Alta", "Marketing", "E-mails e WhatsApp"),
]

const event = (id: string, date: string, endDate: string, type: string, phase: string, title: string, description: string, status = "Planejado"): CalendarEvent => ({
  id, date, endDate, type, phase, title, description, status, owner: type === "Conteúdo" ? "Conteúdo" : type === "Campanha" ? "Marketing" : "Equipe", time: "09:00", link: "", notes: "", done: false,
})

export const initialEvents: CalendarEvent[] = [
  event("e1", "2026-09-19", "", "Evento", "Pré-produção", "Último Workshop Imagem que Vende de 2026", "Captação de provas, conteúdos, bastidores e materiais estratégicos para a campanha digital.", "Confirmado"),
  event("e2", "2026-09-20", "2026-09-25", "Produção", "Produção", "Organização da campanha", "Organização de provas, conteúdos e materiais captados no workshop."),
  event("e3", "2026-09-26", "", "Campanha", "Pré-lançamento", "Início da campanha de antecipação", "Primeiros movimentos de comunicação e construção da Lista VIP."),
  event("e4", "2026-09-26", "2026-10-25", "Conteúdo", "Pré-lançamento", "Construção orgânica de audiência", "Conteúdos de autoridade, desejo, antecipação e fortalecimento da audiência."),
  event("e5", "2026-10-26", "", "Campanha", "Pré-lançamento", "Intensificação da campanha", "Chamada principal para a Lista VIP.", "Data-chave"),
  event("e6", "2026-10-26", "2026-11-05", "Campanha", "Pré-lançamento", "Pré-lançamento meteórico", "Conteúdos, provas, quebra de objeções, desejo e contagem regressiva."),
  event("e7", "2026-11-06", "", "Lançamento", "Lançamento", "Lançamento oficial e abertura do carrinho", "Entrada da primeira turma com Condição Fundadora.", "Data-chave"),
  event("e8", "2026-11-07", "2026-11-12", "Lançamento", "Lançamento", "Viradas de condição", "Ajustes de oferta e condições dentro da janela de vendas até o fechamento do carrinho."),
]

const lesson = (id: string, module: string, name: string, objective: string, status: Lesson["status"], owner: string, due: string): Lesson => ({
  id, module, name, objective, status, owner, due, recordingLink: "", finalLink: "", notes: "",
})

export const initialLessons: Lesson[] = [
  lesson("l1", "Módulo 01 — Presença e valor percebido", "O valor que chega antes da fala", "Compreender percepção, presença e posicionamento.", "Roteirizada", "Dani Ricco", "05/09/2026"),
  lesson("l2", "Módulo 01 — Presença e valor percebido", "Diagnóstico de presença", "Mapear a percepção atual e a desejada.", "Em revisão", "Conteúdo", "06/09/2026"),
  lesson("l3", "Módulo 02 — Comunicação visual", "Imagem com intenção", "Transformar escolhas visuais em mensagem estratégica.", "Roteirizada", "Dani Ricco", "12/09/2026"),
  lesson("l4", "Módulo 03 — Comunicação verbal", "Clareza que gera autoridade", "Construir uma mensagem segura e memorável.", "Não iniciada", "Dani Ricco", "18/09/2026"),
  lesson("l5", "Módulo 04 — Comunicação comportamental", "Presença em movimento", "Alinhar comportamento, espaço e intenção.", "Não iniciada", "Dani Ricco", "22/09/2026"),
  lesson("l6", "Módulo 05 — Aplicação prática", "Plano de presença de alto valor", "Criar um plano pessoal de aplicação.", "Não iniciada", "Conteúdo", "28/09/2026"),
]

const member = (id: string, group: string, title: string, status: MemberItem["status"], owner: string): MemberItem => ({ id, group, title, status, owner, due: "A definir", link: "", notes: "" })
export const initialMemberItems: MemberItem[] = [
  member("m1", "Estrutura da plataforma", "Estrutura de módulos", "Em produção", "Conteúdo"), member("m2", "Estrutura da plataforma", "Organização das aulas", "A iniciar", "Conteúdo"), member("m3", "Estrutura da plataforma", "Ordem da jornada da aluna", "A iniciar", "Dani Ricco"), member("m4", "Estrutura da plataforma", "Liberação de conteúdos", "A iniciar", "Time digital"),
  member("m5", "Personalização", "Identidade visual", "Em produção", "Design"), member("m6", "Personalização", "Banner de boas-vindas", "A iniciar", "Design"), member("m7", "Personalização", "Página inicial", "A iniciar", "Time digital"), member("m8", "Personalização", "Texto de apresentação", "Em aprovação", "Dani Ricco"), member("m9", "Personalização", "Materiais complementares", "A iniciar", "Conteúdo"), member("m10", "Personalização", "Certificado, se houver", "A iniciar", "Design"),
  member("m11", "Experiência da aluna", "Boas-vindas", "A iniciar", "Dani Ricco"), member("m12", "Experiência da aluna", "Aula inicial", "A iniciar", "Dani Ricco"), member("m13", "Experiência da aluna", "Orientações de acesso", "A iniciar", "Suporte"), member("m14", "Experiência da aluna", "Comunidade ou suporte", "A iniciar", "Suporte"), member("m15", "Experiência da aluna", "Materiais para download", "A iniciar", "Conteúdo"), member("m16", "Experiência da aluna", "Revisão da jornada completa", "A iniciar", "Equipe"),
]

const content = (id: string, area: string, title: string, type: string, status: ContentItem["status"], owner: string): ContentItem => ({ id, area, title, type, status, owner, due: "A definir", link: "", notes: "" })
export const initialContents: ContentItem[] = [
  content("c1", "Conteúdo orgânico", "Não basta ser competente", "Carrossel", "Em produção", "Conteúdo"),
  content("c2", "Conteúdo orgânico", "Sua presença comunica antes de você falar", "Reels", "Em aprovação", "Dani Ricco"),
  content("c3", "Lista VIP", "Convite para a Lista VIP", "WhatsApp", "A iniciar", "Marketing"),
  content("c4", "Provas e depoimentos", "Bastidores do Workshop Imagem que Vende", "Vídeo", "A iniciar", "Conteúdo"),
  content("c5", "Criativos e anúncios", "Presença alinhada, novas oportunidades", "Anúncio", "A iniciar", "Design"),
  content("c6", "Roteiros", "O custo de não comunicar seu valor", "Roteiro de vídeo", "Em produção", "Conteúdo"),
]

const material = (id: string, name: string, description: string, icon: string): Material => ({ id, name, description, icon, link: "" })
export const initialMaterials: Material[] = [
  material("m1", "Briefing do produto", "Estratégia, promessa e posicionamento central.", "FileText"),
  material("m2", "Pasta de gravações", "Arquivos brutos, takes e bastidores.", "FolderOpen"),
  material("m3", "Criativos e anúncios", "Peças aprovadas e variações de campanha.", "Megaphone"),
  material("m4", "Página de vendas", "Copy, layout e versão publicada.", "Monitor"),
  material("m5", "Área de membros", "Acesso à plataforma e organização das aulas.", "PanelsTopLeft"),
  material("m6", "Plataforma de vendas", "Checkout, produtos e configurações.", "ShoppingBag"),
  material("m7", "Grupo de WhatsApp", "Acesso e materiais da comunidade VIP.", "MessageCircle"),
  material("m8", "Relatórios e métricas", "Resultados, mídia e aprendizados.", "ChartNoAxesColumnIncreasing"),
]

export const initialData: AppData = {
  product: {
    name: "Presença de Alto Valor", concept: "Uma presença que gera valor.", status: "Em preparação",
    description: "Produto digital para profissionais que desejam comunicar o valor que já possuem com mais clareza, autoridade e intenção. Por meio dos pilares visual, verbal e comportamental, a aluna aprende a alinhar presença, mensagem e posicionamento para ser percebida à altura da sua competência, fortalecer sua influência e gerar novas oportunidades.",
    promise: "Alinhe imagem, comunicação e comportamento para elevar seu valor percebido, fortalecer sua autoridade, gerar novas oportunidades e aumentar seus resultados.",
    audience: "Profissionais que desejam elevar valor percebido, autoridade e influência.", transformation: "Da competência pouco percebida para uma presença clara, intencional e valorizada.", pillars: "Visual\nVerbal\nComportamental", differentiators: "Integra imagem, comunicação e comportamento em uma metodologia prática.", pains: "Insegurança ao se posicionar\nImagem desalinhada ao valor profissional\nComunicação sem clareza", editorial: "Presença, valor percebido, autoridade e oportunidades.", notes: "",
  },
  offer: { "Ticket atual": "R$ 1.497", "Condição especial": "Condição Fundadora para a primeira turma", "Bônus": "A definir", "Garantia": "7 dias", "Meta de vendas": "100", "Meta de faturamento": "R$ 149.700", "Público da Lista VIP": "Profissionais interessadas em presença, imagem e posicionamento", "Oferta principal": "Curso Presença de Alto Valor", "Order bump": "A definir", "Upsell": "A definir", "Objeções principais": "Não tenho tempo; não sei se é para mim; já fiz outros cursos", "Respostas para objeções": "Metodologia aplicável, jornada objetiva e transformação prática" },
  tasks: initialTasks, events: initialEvents, lessons: initialLessons, memberItems: initialMemberItems, contents: initialContents, materials: initialMaterials,
  launchMetrics: { "Status do carrinho": "Fechado", "Dias restantes": "—", "Faturamento": "R$ 0", "Vendas": "0", "Meta": "R$ 149.700", "Conversão": "0%", "Leads": "0", "Investimento em tráfego": "R$ 0", "Custo por lead": "R$ 0" },
  debriefMetrics: { "Leads": "—", "Lista VIP": "—", "Vendas": "—", "Faturamento": "—", "Ticket médio": "—", "Conversão": "—", "Investimento em mídia": "—", "ROAS": "—" },
  debrief: { "O que funcionou": "", "O que precisa ser ajustado": "", "Melhores conteúdos": "", "Principais objeções": "", "Aprendizados da campanha": "", "Custos e investimentos realizados": "", "Próximos investimentos": "", "Decisões para a próxima abertura": "", "Decisões estratégicas para a próxima abertura meteórica": "" },
  launchRows: [{ id: "lr1", action: "Revisar operação do dia", content: "—", campaigns: "—", adjustments: "—", pending: "—", owner: "Equipe" }],
}
