import { archetypeIds, type ArchetypeId } from "@/lib/archetypes"

export type DiagnosticPillar = "visual" | "verbal" | "comportamental"

export type DiagnosticOption = {
  id: string
  label: string
  archetype: ArchetypeId
}

export type DiagnosticQuestion = {
  id: string
  pillar: DiagnosticPillar
  prompt: string
  options: DiagnosticOption[]
}

export const pillarLabels: Record<DiagnosticPillar, string> = {
  visual: "Visual",
  verbal: "Verbal",
  comportamental: "Comportamental",
}

export const diagnosticQuestions: DiagnosticQuestion[] = [
  { id: "q01", pillar: "visual", prompt: "Quando sua imagem está totalmente alinhada com você, o que ela deve transmitir primeiro?", options: [
    { id: "q01-a", label: "Leveza, verdade e confiança", archetype: "inocente" },
    { id: "q01-b", label: "Autoridade, estrutura e domínio", archetype: "governante" },
    { id: "q01-c", label: "Originalidade e expressão autoral", archetype: "criadora" },
    { id: "q01-d", label: "Magnetismo, beleza e conexão", archetype: "amante" },
  ]},
  { id: "q02", pillar: "visual", prompt: "Ao escolher elementos visuais para representar seu trabalho, você se identifica mais com:", options: [
    { id: "q02-a", label: "Liberdade, movimento e descoberta", archetype: "exploradora" },
    { id: "q02-b", label: "Precisão, clareza e inteligência", archetype: "sabia" },
    { id: "q02-c", label: "Contraste, ruptura e ousadia", archetype: "rebelde" },
    { id: "q02-d", label: "Suavidade, proximidade e acolhimento", archetype: "cuidadora" },
  ]},
  { id: "q03", pillar: "visual", prompt: "Ao entrar em um ambiente importante, qual presença visual mais combina com você?", options: [
    { id: "q03-a", label: "Firme, pronta e determinada", archetype: "heroina" },
    { id: "q03-b", label: "Intrigante, simbólica e transformadora", archetype: "maga" },
    { id: "q03-c", label: "Leve, espontânea e surpreendente", archetype: "bobo" },
    { id: "q03-d", label: "Natural, próxima e sem esforço aparente", archetype: "pessoa-comum" },
  ]},
  { id: "q04", pillar: "visual", prompt: "Se sua estética profissional tivesse uma assinatura, ela seria mais:", options: [
    { id: "q04-a", label: "Provocadora e fora do padrão", archetype: "rebelde" },
    { id: "q04-b", label: "Artística, detalhada e inventiva", archetype: "criadora" },
    { id: "q04-c", label: "Humana, suave e convidativa", archetype: "cuidadora" },
    { id: "q04-d", label: "Simples, familiar e descomplicada", archetype: "pessoa-comum" },
  ]},
  { id: "q05", pillar: "visual", prompt: "Antes mesmo de você falar, o que gostaria que sua imagem deixasse evidente?", options: [
    { id: "q05-a", label: "Repertório e competência", archetype: "sabia" },
    { id: "q05-b", label: "Liderança e excelência", archetype: "governante" },
    { id: "q05-c", label: "Refinamento e poder de atração", archetype: "amante" },
    { id: "q05-d", label: "Acessibilidade e identificação", archetype: "pessoa-comum" },
  ]},
  { id: "q06", pillar: "visual", prompt: "Qual direção visual parece mais natural para você?", options: [
    { id: "q06-a", label: "Clara, limpa e essencial", archetype: "inocente" },
    { id: "q06-b", label: "Orgânica, livre e desbravadora", archetype: "exploradora" },
    { id: "q06-c", label: "Forte, funcional e marcante", archetype: "heroina" },
    { id: "q06-d", label: "Viva, descontraída e expressiva", archetype: "bobo" },
  ]},
  { id: "q07", pillar: "visual", prompt: "O que não pode faltar na construção da sua presença visual?", options: [
    { id: "q07-a", label: "Símbolos e camadas de significado", archetype: "maga" },
    { id: "q07-b", label: "Autoria e criatividade", archetype: "criadora" },
    { id: "q07-c", label: "Acabamento, ordem e padrão elevado", archetype: "governante" },
    { id: "q07-d", label: "Sensação de cuidado e segurança", archetype: "cuidadora" },
  ]},
  { id: "q08", pillar: "visual", prompt: "Quando você quer ser lembrada visualmente, seu instinto é:", options: [
    { id: "q08-a", label: "Demonstrar força e presença", archetype: "heroina" },
    { id: "q08-b", label: "Criar contraste e provocar", archetype: "rebelde" },
    { id: "q08-c", label: "Criar desejo e envolvimento", archetype: "amante" },
    { id: "q08-d", label: "Trazer humor e espontaneidade", archetype: "bobo" },
  ]},

  { id: "q09", pillar: "verbal", prompt: "Quando você precisa convencer alguém, qual recurso surge primeiro?", options: [
    { id: "q09-a", label: "Explico com lógica e contexto", archetype: "sabia" },
    { id: "q09-b", label: "Mostro ação, prova e resultado", archetype: "heroina" },
    { id: "q09-c", label: "Questiono o padrão e viro a conversa", archetype: "rebelde" },
    { id: "q09-d", label: "Revelo uma nova forma de enxergar", archetype: "maga" },
  ]},
  { id: "q10", pillar: "verbal", prompt: "Seu conteúdo funciona melhor quando faz as pessoas:", options: [
    { id: "q10-a", label: "Sentirem esperança e confiança", archetype: "inocente" },
    { id: "q10-b", label: "Enxergarem uma ideia original", archetype: "criadora" },
    { id: "q10-c", label: "Perceberem direção e estrutura", archetype: "governante" },
    { id: "q10-d", label: "Relaxarem e lembrarem da mensagem", archetype: "bobo" },
  ]},
  { id: "q11", pillar: "verbal", prompt: "Em uma conversa profissional importante, sua força aparece mais em:", options: [
    { id: "q11-a", label: "Abrir possibilidades e caminhos", archetype: "exploradora" },
    { id: "q11-b", label: "Definir direção com segurança", archetype: "governante" },
    { id: "q11-c", label: "Escutar e orientar com cuidado", archetype: "cuidadora" },
    { id: "q11-d", label: "Criar conexão emocional", archetype: "amante" },
  ]},
  { id: "q12", pillar: "verbal", prompt: "Quando você ensina algo, qual abordagem mais parece com você?", options: [
    { id: "q12-a", label: "Impulsiono a pessoa a agir", archetype: "heroina" },
    { id: "q12-b", label: "Organizo o raciocínio até ficar claro", archetype: "sabia" },
    { id: "q12-c", label: "Crio desejo pelo significado da mudança", archetype: "amante" },
    { id: "q12-d", label: "Torno o aprendizado leve e memorável", archetype: "bobo" },
  ]},
  { id: "q13", pillar: "verbal", prompt: "Quando alguém traz uma objeção, seu impulso natural é:", options: [
    { id: "q13-a", label: "Trazer tranquilidade e simplificar", archetype: "inocente" },
    { id: "q13-b", label: "Demonstrar capacidade e caminho", archetype: "heroina" },
    { id: "q13-c", label: "Mudar a perspectiva da pessoa", archetype: "maga" },
    { id: "q13-d", label: "Acolher a preocupação antes de responder", archetype: "cuidadora" },
  ]},
  { id: "q14", pillar: "verbal", prompt: "Qual tom de voz tende a aparecer quando você está mais segura de si?", options: [
    { id: "q14-a", label: "Provocador e franco", archetype: "rebelde" },
    { id: "q14-b", label: "Firme e diretivo", archetype: "governante" },
    { id: "q14-c", label: "Envolvente e sensorial", archetype: "amante" },
    { id: "q14-d", label: "Direto, simples e próximo", archetype: "pessoa-comum" },
  ]},
  { id: "q15", pillar: "verbal", prompt: "Para você, uma mensagem realmente boa precisa:", options: [
    { id: "q15-a", label: "Abrir novas possibilidades", archetype: "exploradora" },
    { id: "q15-b", label: "Aumentar compreensão e discernimento", archetype: "sabia" },
    { id: "q15-c", label: "Gerar leveza e surpresa", archetype: "bobo" },
    { id: "q15-d", label: "Fazer a pessoa se sentir incluída", archetype: "pessoa-comum" },
  ]},
  { id: "q16", pillar: "verbal", prompt: "Ao contar uma história, qual elemento mais prende sua atenção?", options: [
    { id: "q16-a", label: "Esperança e verdade", archetype: "inocente" },
    { id: "q16-b", label: "Transformação e significado", archetype: "maga" },
    { id: "q16-c", label: "Imaginação e construção estética", archetype: "criadora" },
    { id: "q16-d", label: "Humanidade e cuidado", archetype: "cuidadora" },
  ]},

  { id: "q17", pillar: "comportamental", prompt: "Quando você chega a um grupo novo, qual comportamento surge naturalmente?", options: [
    { id: "q17-a", label: "Exploro o ambiente e conheço possibilidades", archetype: "exploradora" },
    { id: "q17-b", label: "Percebo quem precisa de apoio", archetype: "cuidadora" },
    { id: "q17-c", label: "Quebro o gelo e alivio a tensão", archetype: "bobo" },
    { id: "q17-d", label: "Me integro e encontro pontos em comum", archetype: "pessoa-comum" },
  ]},
  { id: "q18", pillar: "comportamental", prompt: "Diante de um desafio grande, sua reação mais espontânea é:", options: [
    { id: "q18-a", label: "Enfrentar e avançar", archetype: "heroina" },
    { id: "q18-b", label: "Reconfigurar o problema e transformar o contexto", archetype: "maga" },
    { id: "q18-c", label: "Criar alianças e fortalecer vínculos", archetype: "amante" },
    { id: "q18-d", label: "Encontrar o caminho mais prático e possível", archetype: "pessoa-comum" },
  ]},
  { id: "q19", pillar: "comportamental", prompt: "Quando precisa tomar uma decisão importante, você tende a:", options: [
    { id: "q19-a", label: "Buscar o que parece mais íntegro e simples", archetype: "inocente" },
    { id: "q19-b", label: "Analisar dados, contexto e consequências", archetype: "sabia" },
    { id: "q19-c", label: "Questionar as regras antes de aceitar limites", archetype: "rebelde" },
    { id: "q19-d", label: "Criar uma solução que ainda não existe", archetype: "criadora" },
  ]},
  { id: "q20", pillar: "comportamental", prompt: "Quando você assume liderança, o que mais define seu jeito de conduzir?", options: [
    { id: "q20-a", label: "Inspirar confiança e manter coerência", archetype: "inocente" },
    { id: "q20-b", label: "Dar autonomia para cada pessoa encontrar caminhos", archetype: "exploradora" },
    { id: "q20-c", label: "Fazer o grupo enxergar uma nova possibilidade", archetype: "maga" },
    { id: "q20-d", label: "Estabelecer direção, padrão e responsabilidade", archetype: "governante" },
  ]},
  { id: "q21", pillar: "comportamental", prompt: "Quando aparece um conflito ou bloqueio, sua tendência é:", options: [
    { id: "q21-a", label: "Mudar de rota e buscar outro caminho", archetype: "exploradora" },
    { id: "q21-b", label: "Romper com o padrão que criou o problema", archetype: "rebelde" },
    { id: "q21-c", label: "Construir uma saída nova", archetype: "criadora" },
    { id: "q21-d", label: "Usar leveza para destravar o ambiente", archetype: "bobo" },
  ]},
  { id: "q22", pillar: "comportamental", prompt: "As pessoas costumam procurar você principalmente para:", options: [
    { id: "q22-a", label: "Entender melhor uma situação", archetype: "sabia" },
    { id: "q22-b", label: "Enxergar uma transformação possível", archetype: "maga" },
    { id: "q22-c", label: "Criar ou desenvolver uma ideia", archetype: "criadora" },
    { id: "q22-d", label: "Serem ouvidas e acolhidas", archetype: "cuidadora" },
  ]},
  { id: "q23", pillar: "comportamental", prompt: "Quando você quer deixar uma marca forte em alguém, prefere ser lembrada por:", options: [
    { id: "q23-a", label: "Integridade e confiança", archetype: "inocente" },
    { id: "q23-b", label: "Coragem e capacidade de realização", archetype: "heroina" },
    { id: "q23-c", label: "Atitude e independência", archetype: "rebelde" },
    { id: "q23-d", label: "Presença e conexão", archetype: "amante" },
  ]},
  { id: "q24", pillar: "comportamental", prompt: "No seu conceito de sucesso profissional, o que pesa mais?", options: [
    { id: "q24-a", label: "Ter liberdade para escolher caminhos", archetype: "exploradora" },
    { id: "q24-b", label: "Ter domínio e compreensão profunda", archetype: "sabia" },
    { id: "q24-c", label: "Construir algo sólido e bem dirigido", archetype: "governante" },
    { id: "q24-d", label: "Pertencer e construir junto", archetype: "pessoa-comum" },
  ]},
]

export type DiagnosticAnswers = Record<string, string>

export type ArchetypeScore = {
  archetype: ArchetypeId
  selected: number
  opportunities: number
  overallPercent: number
  pillarPercents: Record<DiagnosticPillar, number>
  pillarHits: number
  rankingScore: number
}

export type DiagnosticScoreResult = {
  primary: ArchetypeId
  secondary: ArchetypeId
  tertiary: ArchetypeId
  ranking: ArchetypeScore[]
}

const optionByQuestion = new Map(
  diagnosticQuestions.map((question) => [question.id, new Map(question.options.map((option) => [option.id, option]))]),
)

export function validateAnswers(answers: DiagnosticAnswers) {
  if (Object.keys(answers).length !== diagnosticQuestions.length) return false
  return diagnosticQuestions.every((question) => optionByQuestion.get(question.id)?.has(answers[question.id]))
}

export function scoreDiagnostic(answers: DiagnosticAnswers): DiagnosticScoreResult {
  if (!validateAnswers(answers)) throw new Error("Respostas incompletas ou inválidas")

  const selected = Object.fromEntries(archetypeIds.map((id) => [id, 0])) as Record<ArchetypeId, number>
  const opportunities = Object.fromEntries(archetypeIds.map((id) => [id, 0])) as Record<ArchetypeId, number>
  const selectedByPillar = Object.fromEntries(
    archetypeIds.map((id) => [id, { visual: 0, verbal: 0, comportamental: 0 }]),
  ) as Record<ArchetypeId, Record<DiagnosticPillar, number>>
  const opportunitiesByPillar = Object.fromEntries(
    archetypeIds.map((id) => [id, { visual: 0, verbal: 0, comportamental: 0 }]),
  ) as Record<ArchetypeId, Record<DiagnosticPillar, number>>

  for (const question of diagnosticQuestions) {
    for (const option of question.options) {
      opportunities[option.archetype] += 1
      opportunitiesByPillar[option.archetype][question.pillar] += 1
    }
    const chosen = optionByQuestion.get(question.id)?.get(answers[question.id])
    if (!chosen) continue
    selected[chosen.archetype] += 1
    selectedByPillar[chosen.archetype][question.pillar] += 1
  }

  const ranking = archetypeIds.map((archetype, order) => {
    const pillarPercents = {
      visual: Math.round((selectedByPillar[archetype].visual / Math.max(1, opportunitiesByPillar[archetype].visual)) * 100),
      verbal: Math.round((selectedByPillar[archetype].verbal / Math.max(1, opportunitiesByPillar[archetype].verbal)) * 100),
      comportamental: Math.round((selectedByPillar[archetype].comportamental / Math.max(1, opportunitiesByPillar[archetype].comportamental)) * 100),
    }
    const pillarHits = (Object.values(selectedByPillar[archetype]) as number[]).filter((value) => value > 0).length
    const normalizedSpread = (pillarPercents.visual + pillarPercents.verbal + pillarPercents.comportamental) / 300
    return {
      archetype,
      selected: selected[archetype],
      opportunities: opportunities[archetype],
      overallPercent: Math.round((selected[archetype] / Math.max(1, opportunities[archetype])) * 100),
      pillarPercents,
      pillarHits,
      rankingScore: selected[archetype] * 100 + pillarHits * 5 + normalizedSpread - order / 1000,
    }
  }).sort((a, b) => b.rankingScore - a.rankingScore)

  return {
    primary: ranking[0].archetype,
    secondary: ranking[1].archetype,
    tertiary: ranking[2].archetype,
    ranking,
  }
}

export function publicScoreFor(result: DiagnosticScoreResult) {
  const dominant = result.ranking.find((item) => item.archetype === result.primary)
  if (!dominant) throw new Error("Resultado dominante não encontrado")
  return {
    archetype: result.primary,
    overallPercent: dominant.overallPercent,
    pillarPercents: dominant.pillarPercents,
  }
}