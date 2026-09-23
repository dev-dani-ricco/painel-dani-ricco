export const archetypeIds = [
  "inocente", "exploradora", "sabia", "heroina", "rebelde", "maga",
  "criadora", "governante", "cuidadora", "amante", "bobo", "pessoa-comum",
] as const

export type ArchetypeId = (typeof archetypeIds)[number]

export type ArchetypeProfile = {
  id: ArchetypeId
  name: string
  essence: string
  tagline: string
  strengths: string[]
  perception: string
  visual: string
  verbal: string
  behavioral: string
  shadow: string
  direction: string
  secondaryExpression: string
}

export const archetypes: Record<ArchetypeId, ArchetypeProfile> = {
  inocente: {
    id: "inocente", name: "Inocente", essence: "Confiança, clareza e autenticidade.",
    tagline: "Sua força está em tornar o essencial desejável e confiável.",
    strengths: ["Otimismo", "Transparência", "Leveza", "Coerência"],
    perception: "verdadeira, positiva, confiável e descomplicada",
    visual: "Funciona melhor quando transmite limpeza, luminosidade, simplicidade intencional e ausência de excessos.",
    verbal: "Ganha força em mensagens claras, positivas e honestas, sem jogos ou complexidade desnecessária.",
    behavioral: "Cria segurança pela coerência, pela ética percebida e pela capacidade de aliviar ruídos.",
    shadow: "Quando exagerada, pode parecer ingênua, previsível ou evitar tensões que precisam ser enfrentadas.",
    direction: "Use a leveza como escolha estratégica, sem diminuir profundidade, repertório ou firmeza.",
    secondaryExpression: "traz leveza, transparência e uma sensação imediata de confiança",
  },
  exploradora: {
    id: "exploradora", name: "Exploradora", essence: "Liberdade, descoberta e expansão.",
    tagline: "Sua presença ganha valor quando abre caminhos onde antes havia limite.",
    strengths: ["Autonomia", "Curiosidade", "Coragem", "Movimento"],
    perception: "livre, inquieta, autêntica e aberta ao novo",
    visual: "Pede movimento, naturalidade, textura, referências de jornada e uma estética menos engessada.",
    verbal: "Conecta quando convida a experimentar, descobrir, ampliar repertório e sair do lugar comum.",
    behavioral: "Lidera pelo exemplo de autonomia, investigação e disposição para atravessar territórios novos.",
    shadow: "Pode transmitir dispersão, impaciência com estruturas ou dificuldade de permanecer tempo suficiente.",
    direction: "Transforme liberdade em direção: explorar é mais forte quando existe intenção e destino.",
    secondaryExpression: "acrescenta liberdade, curiosidade e impulso de expansão",
  },
  sabia: {
    id: "sabia", name: "Sábia", essence: "Conhecimento, discernimento e clareza.",
    tagline: "Sua autoridade nasce quando conhecimento se transforma em compreensão.",
    strengths: ["Repertório", "Clareza", "Análise", "Credibilidade"],
    perception: "inteligente, estratégica, segura e confiável",
    visual: "Se fortalece com precisão, elegância, ordem e códigos que sugerem repertório sem ostentação.",
    verbal: "Brilha ao organizar ideias, explicar relações complexas e oferecer critérios para decisões melhores.",
    behavioral: "Ocupa espaço pela consistência intelectual, pela observação e pela qualidade das perguntas.",
    shadow: "Em excesso, pode soar distante, professoral, fria ou presa à análise antes da ação.",
    direction: "Converta saber em linguagem acessível e presença: conhecimento percebido vale mais do que conhecimento acumulado.",
    secondaryExpression: "adiciona profundidade, lógica e credibilidade à forma de se expressar",
  },
  heroina: {
    id: "heroina", name: "Heroína", essence: "Coragem, conquista e superação.",
    tagline: "Sua presença mobiliza porque transforma intenção em movimento.",
    strengths: ["Determinação", "Disciplina", "Ação", "Resiliência"],
    perception: "forte, capaz, determinada e orientada a resultado",
    visual: "Ganha potência com linhas firmes, contraste, funcionalidade e sinais de prontidão e domínio.",
    verbal: "É convincente quando mostra caminho, ação, prova, desafio e evolução concreta.",
    behavioral: "Assume responsabilidade, enfrenta obstáculos e eleva o padrão de execução do ambiente.",
    shadow: "Pode parecer competitiva demais, inflexível ou transformar tudo em prova de resistência.",
    direction: "Mostre força sem criar distância; liderança também inclui ritmo, escuta e humanidade.",
    secondaryExpression: "injeta coragem, ritmo de ação e orientação para conquista",
  },
  rebelde: {
    id: "rebelde", name: "Rebelde", essence: "Ruptura, coragem e inconformismo.",
    tagline: "Seu valor aparece quando você questiona o que já não serve.",
    strengths: ["Ousadia", "Franqueza", "Ruptura", "Independência"],
    perception: "provocadora, autêntica, corajosa e impossível de ignorar",
    visual: "Pede contraste, tensão visual, escolhas inesperadas e códigos que desafiem o previsível.",
    verbal: "Tem força em posicionamentos nítidos, perguntas incômodas e ideias que rompem automatismos.",
    behavioral: "Move grupos quando desafia regras improdutivas e demonstra coragem para sustentar diferença.",
    shadow: "Sem direção, pode parecer apenas oposição, agressividade ou necessidade constante de conflito.",
    direction: "Dê propósito à ruptura: o que você derruba precisa abrir espaço para algo melhor.",
    secondaryExpression: "acrescenta contraste, provocação e coragem para quebrar padrões",
  },
  maga: {
    id: "maga", name: "Maga", essence: "Transformação, visão e significado.",
    tagline: "Sua presença ganha magnetismo quando revela possibilidades invisíveis para os outros.",
    strengths: ["Intuição", "Visão", "Transformação", "Síntese"],
    perception: "visionária, intensa, intuitiva e transformadora",
    visual: "Se beneficia de simbolismo, profundidade, contraste de luz e elementos que sugerem camadas e significado.",
    verbal: "Conecta ao mudar perspectivas, criar metáforas e fazer a pessoa enxergar uma realidade possível.",
    behavioral: "Influencia pela leitura de contexto, pela intuição estratégica e pela capacidade de catalisar mudanças.",
    shadow: "Pode parecer abstrata, misteriosa demais ou prometer transformação sem tornar o caminho concreto.",
    direction: "Traduza visão em método e evidência; encantamento cresce quando encontra estrutura.",
    secondaryExpression: "traz visão, simbolismo e capacidade de transformar percepção",
  },
  criadora: {
    id: "criadora", name: "Criadora", essence: "Originalidade, expressão e construção.",
    tagline: "Sua assinatura aparece quando você transforma repertório em algo que antes não existia.",
    strengths: ["Imaginação", "Autoria", "Estética", "Inovação"],
    perception: "original, inventiva, autoral e sensível aos detalhes",
    visual: "É favorecida por composição, detalhe, linguagem própria e escolhas que demonstram autoria.",
    verbal: "Ganha força com conceitos, narrativas e formas novas de organizar aquilo que o público já conhece.",
    behavioral: "Resolve ao criar alternativas e construir soluções com identidade própria.",
    shadow: "Pode cair em perfeccionismo, excesso de elaboração ou dificuldade de concluir e simplificar.",
    direction: "Proteja a autoria, mas dê forma, prazo e função ao que você cria.",
    secondaryExpression: "adiciona autoria, criatividade e uma assinatura estética própria",
  },
  governante: {
    id: "governante", name: "Governante", essence: "Direção, excelência e estrutura.",
    tagline: "Sua presença comunica valor quando organização e autoridade tornam o caminho evidente.",
    strengths: ["Liderança", "Estrutura", "Exigência", "Decisão"],
    perception: "segura, sofisticada, criteriosa e naturalmente líder",
    visual: "Responde bem a acabamento impecável, proporção, qualidade percebida e códigos de domínio e ordem.",
    verbal: "É potente quando estabelece critérios, direção, padrão e decisões com segurança.",
    behavioral: "Assume comando, organiza recursos e sustenta responsabilidade por resultados coletivos.",
    shadow: "Pode ser lida como controladora, rígida ou excessivamente preocupada com status e perfeição.",
    direction: "Use autoridade para dar clareza e segurança, não para ocupar todo o espaço.",
    secondaryExpression: "acrescenta direção, estrutura e percepção de excelência",
  },
  cuidadora: {
    id: "cuidadora", name: "Cuidadora", essence: "Cuidado, proteção e serviço.",
    tagline: "Sua presença cria valor quando faz o outro se sentir visto, seguro e amparado.",
    strengths: ["Empatia", "Generosidade", "Proteção", "Presença"],
    perception: "acolhedora, humana, confiável e generosa",
    visual: "Ganha coerência com suavidade, conforto visual, proximidade e escolhas que reduzam barreiras.",
    verbal: "É forte na escuta, na orientação cuidadosa e em mensagens que demonstram compreensão real da dor do outro.",
    behavioral: "Constrói confiança pela disponibilidade, pelo suporte e pela atenção aos detalhes humanos.",
    shadow: "Pode se anular, assumir responsabilidades alheias ou comunicar menos valor ao priorizar apenas servir.",
    direction: "Cuidar não exige diminuir sua autoridade; limite e valor também são formas de cuidado.",
    secondaryExpression: "adiciona acolhimento, empatia e sensação de segurança",
  },
  amante: {
    id: "amante", name: "Amante", essence: "Conexão, desejo e sensibilidade.",
    tagline: "Sua presença se torna memorável quando cria vínculo, beleza e intensidade emocional.",
    strengths: ["Magnetismo", "Sensibilidade", "Estética", "Conexão"],
    perception: "envolvente, refinada, sensível e magnética",
    visual: "Se expressa por textura, detalhe, beleza sensorial, harmonia e códigos que convidam à aproximação.",
    verbal: "Conecta por emoção, desejo, pertencimento e linguagem que faz o público sentir antes de racionalizar.",
    behavioral: "Influencia pela qualidade do vínculo, pela presença atenta e pela capacidade de criar experiência.",
    shadow: "Pode depender de aprovação, exagerar sedução ou confundir conexão com necessidade de agradar.",
    direction: "Use magnetismo para aproximar sem diluir posicionamento, limite ou critério.",
    secondaryExpression: "traz magnetismo, sensibilidade e força de conexão emocional",
  },
  bobo: {
    id: "bobo", name: "Bobo da Corte", essence: "Leveza, espontaneidade e humor.",
    tagline: "Sua força está em reduzir tensão e tornar a mensagem mais humana e memorável.",
    strengths: ["Humor", "Espontaneidade", "Presença", "Criatividade social"],
    perception: "leve, acessível, divertida e surpreendente",
    visual: "Admite cor, movimento, detalhes inesperados e uma energia menos cerimonial.",
    verbal: "Funciona com humor inteligente, ritmo, analogias e capacidade de dizer verdades sem tornar tudo pesado.",
    behavioral: "Quebra gelo, cria vínculo rápido e devolve perspectiva quando o ambiente fica rígido.",
    shadow: "Pode reduzir seriedade percebida ou usar humor para fugir de profundidade e conflito necessário.",
    direction: "Faça a leveza trabalhar a favor da mensagem, não no lugar dela.",
    secondaryExpression: "adiciona leveza, espontaneidade e inteligência social",
  },
  "pessoa-comum": {
    id: "pessoa-comum", name: "Pessoa Comum", essence: "Pertencimento, proximidade e realidade.",
    tagline: "Sua presença gera confiança quando o público sente: ela me entende porque vive o mundo real.",
    strengths: ["Proximidade", "Praticidade", "Humildade", "Pertencimento"],
    perception: "acessível, real, próxima e fácil de confiar",
    visual: "Prefere naturalidade, funcionalidade, familiaridade e códigos que não criem distância desnecessária.",
    verbal: "É forte na linguagem direta, cotidiana, simples e em exemplos que parecem parte da vida do público.",
    behavioral: "Integra, coopera, cria identificação e encontra soluções possíveis sem teatralidade.",
    shadow: "Pode se tornar genérica, apagar diferenciais ou evitar protagonismo para não destoar do grupo.",
    direction: "Proximidade não precisa significar comum demais; mostre diferença sem perder identificação.",
    secondaryExpression: "traz proximidade, simplicidade e sensação de pertencimento",
  },
}

export function getArchetype(id: ArchetypeId) {
  return archetypes[id]
}

export function describeCombination(primaryId: ArchetypeId, secondaryId: ArchetypeId) {
  const primary = archetypes[primaryId]
  const secondary = archetypes[secondaryId]
  return {
    title: `${primary.name} + ${secondary.name}`,
    summary: `Sua força principal parte de ${primary.essence.toLowerCase()} A presença secundária de ${secondary.name} ${secondary.secondaryExpression}.`,
    tension: `O ponto de atenção está em equilibrar a potência de ${primary.name} com a expressão de ${secondary.name}, para que uma força não silencie a outra.`,
    direction: `${primary.direction} Ao mesmo tempo, permita que ${secondary.name} module a forma como essa potência chega às pessoas.`,
  }
}