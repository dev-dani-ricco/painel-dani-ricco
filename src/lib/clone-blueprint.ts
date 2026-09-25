export type CloneDomain = {
  key: string
  label: string
  description: string
  priority: number
  keywords: string[]
  prompts: {
    dani: string[]
    alex?: string[]
    manu?: string[]
    team?: string[]
  }
}

export const CLONE_DOMAINS: CloneDomain[] = [
  {
    key: "identity",
    label: "Identidade da Dani",
    description: "Quem ela é além da marca, história, viradas e traços que moldam sua forma de pensar.",
    priority: 10,
    keywords: ["identidade", "história", "personalidade", "trajetória", "virada"],
    prompts: {
      dani: [
        "Quando ninguém está olhando e o trabalho sai de cena, o que continua sendo essencialmente você?",
        "Qual acontecimento mais mudou sua forma de enxergar a própria vida — e o que mudou depois dele?",
      ],
      alex: ["Que traço da Dani aparece com muita clareza nas decisões dela, mas quase nunca aparece no conteúdo público?"],
      manu: ["Na rotina, em quais momentos você percebe uma diferença clara entre a Dani pública e a Dani real?"],
    },
  },
  {
    key: "values",
    label: "Valores e crenças",
    description: "Princípios, limites, confiança, liberdade, sucesso, influência e visão de mundo.",
    priority: 10,
    keywords: ["valores", "crenças", "confiança", "lealdade", "sucesso", "influência"],
    prompts: {
      dani: [
        "Qual valor seu você não negocia nem quando a oportunidade é financeiramente excelente?",
        "Que comportamento faz você perder a confiança em alguém quase imediatamente?",
      ],
      alex: ["Qual valor da Dani você já viu custar dinheiro, tempo ou oportunidade — e mesmo assim ela manteve?"],
      manu: ["Que comportamentos no time fazem a Dani sentir que existe alinhamento de verdade, e não só discurso?"],
    },
  },
  {
    key: "behavior",
    label: "Comportamento e emoções",
    description: "Pressão, frustração, discordância, intuição, feedback e reação a conflito.",
    priority: 8,
    keywords: ["pressão", "feedback", "frustração", "intuição", "conflito", "crítica"],
    prompts: {
      dani: [
        "Quando razão e intuição entram em conflito, o que costuma definir sua decisão final?",
        "Como você prefere que alguém discorde de você para que a conversa continue produtiva?",
      ],
      alex: ["Quando a Dani está sob pressão, o que muda no jeito dela decidir ou se comunicar?"],
      manu: ["Qual é a melhor forma de levar um problema para a Dani sem gerar ruído desnecessário?"],
    },
  },
  {
    key: "professional",
    label: "Identidade profissional",
    description: "Autoridade, competências, temas que representa e temas que não quer reivindicar.",
    priority: 10,
    keywords: ["autoridade", "competência", "posicionamento", "profissional", "especialidade"],
    prompts: {
      dani: [
        "Pelo que você quer ser reconhecida profissionalmente daqui a três anos?",
        "Em quais temas você prefere não ser tratada como especialista, mesmo tendo repertório?",
      ],
      alex: ["Em uma negociação, qual competência da Dani mais muda a percepção de valor do outro lado?"],
      manu: ["Que tipo de conteúdo representa muito bem a Dani profissional e qual parece deslocado dela?"],
    },
  },
  {
    key: "decision",
    label: "Modelo de decisão",
    description: "Critérios, prioridades, risco, conflito entre reputação, dinheiro, qualidade e velocidade.",
    priority: 10,
    keywords: ["decisão", "critério", "risco", "prioridade", "reputação", "qualidade"],
    prompts: {
      dani: [
        "Quando duas opções são boas, quais três critérios normalmente desempatem para você?",
        "O que precisa estar claro antes de você dizer sim para uma decisão importante?",
      ],
      alex: ["Quais sinais fazem a Dani recuar de uma oportunidade mesmo quando os números parecem bons?"],
      manu: ["Quando a Dani pede para refazer algo, qual critério costuma estar por trás da decisão?"],
    },
  },
  {
    key: "marketing",
    label: "Marketing e posicionamento",
    description: "Função do marketing, promessa, persuasão, manipulação, performance e marca.",
    priority: 9,
    keywords: ["marketing", "marca", "performance", "promessa", "persuasão", "posicionamento"],
    prompts: {
      dani: [
        "Onde termina persuasão e começa manipulação para você?",
        "Que tipo de promessa pode até vender bem, mas você jamais aprovaria?",
      ],
      alex: ["Em campanha, o que a Dani tolera flexibilizar por performance e o que ela nunca flexibiliza?"],
      manu: ["Que tipo de argumento a Dani costuma cortar de uma copy por não combinar com a marca?"],
    },
  },
  {
    key: "creative",
    label: "Critério de criativos",
    description: "Aprovação, reprovação, estética, autoridade, CTA, exposição e coerência.",
    priority: 10,
    keywords: ["criativo", "copy", "imagem", "cta", "aprovação", "reprovação"],
    prompts: {
      dani: [
        "Quais são três motivos que fariam você reprovar um criativo mesmo se ele estiver performando bem?",
        "O que precisa existir em uma peça para você pensar imediatamente: isso é a minha cara?",
      ],
      alex: ["Qual foi uma peça que a Dani rejeitou e o que você entendeu sobre o critério dela a partir disso?"],
      manu: ["Quando você prepara uma peça para a Dani, quais detalhes já sabe que precisa conferir antes de mostrar?"],
    },
  },
  {
    key: "voice",
    label: "Tom e linguagem",
    description: "Ritmo, vocabulário, firmeza, acolhimento, humor, palavras que usa e evita.",
    priority: 10,
    keywords: ["tom", "linguagem", "voz", "palavras", "frase", "firmeza"],
    prompts: {
      dani: [
        "Que sensação você quer deixar em alguém depois que essa pessoa lê ou ouve uma mensagem sua?",
        "Quais palavras ou expressões parecem corretas no papel, mas você nunca usaria?",
      ],
      alex: ["Quando uma mensagem está tecnicamente boa, mas não soa como a Dani, o que normalmente está errado?"],
      manu: ["Quais palavras, ritmos ou jeitos de começar uma frase fazem você reconhecer a voz da Dani na hora?"],
    },
  },
  {
    key: "impar_essence",
    label: "Essência do IMPAR",
    description: "Razão de existir, transformação, filosofia, valores e o que jamais deve se tornar.",
    priority: 10,
    keywords: ["impar", "essência", "propósito", "filosofia", "transformação", "valores"],
    prompts: {
      dani: [
        "Complete sem pensar em campanha: o IMPAR existe porque…",
        "O que o IMPAR jamais pode se tornar, mesmo crescendo muito?",
      ],
      alex: ["Qual decisão comercial mostraria claramente que o IMPAR perdeu a própria essência?"],
      manu: ["Que experiência faz alguém entender que o IMPAR é diferente sem ninguém precisar explicar?"],
    },
  },
  {
    key: "impar_method",
    label: "Método IMPAR",
    description: "Pilares, sequência, conceitos autorais, ferramentas, diagnósticos e transformação.",
    priority: 10,
    keywords: ["método impar", "pilares", "comunicação", "visual", "verbal", "comportamental"],
    prompts: {
      dani: [
        "Qual é a lógica por trás da sequência do Método IMPAR — por que ela precisa acontecer nessa ordem?",
        "Quais conceitos do método são realmente autorais e quais têm referências externas?",
      ],
      alex: ["Qual parte do Método IMPAR você percebe que mais muda a decisão de compra ou percepção de valor?"],
      manu: ["Em qual parte do método as pessoas mais confundem conceito com estética superficial?"],
    },
  },
  {
    key: "community",
    label: "Comunidade e cultura",
    description: "Entrada, permanência, comportamento, pertencimento, exclusão, confidencialidade e negócios.",
    priority: 7,
    keywords: ["comunidade", "cultura", "membro", "entrada", "permanência", "conduta"],
    prompts: {
      dani: [
        "Que comportamento prova que alguém pertence ao IMPAR — e que comportamento mostra o contrário?",
        "O que justificaria excluir alguém do ecossistema mesmo sendo uma pessoa influente?",
      ],
      alex: ["Qual perfil pode parecer comercialmente interessante, mas não deveria entrar no IMPAR?"],
      manu: ["Que comportamentos você gostaria que fossem naturais em toda pessoa que participa do ecossistema?"],
    },
  },
  {
    key: "ai_autonomy",
    label: "Autonomia do clone",
    description: "O que a IA executa, recomenda, analisa, recusa e quando precisa chamar Dani.",
    priority: 10,
    keywords: ["ia", "autonomia", "aprovação", "decisão", "clone", "delegação"],
    prompts: {
      dani: [
        "Qual decisão você gostaria que seu clone pudesse tomar sozinho sem te interromper?",
        "Em que situação o clone deve obrigatoriamente parar e pedir sua confirmação?",
      ],
      alex: ["Em quais decisões comerciais você confiaria no clone da Dani como primeira análise — e quais exigem a Dani real?"],
      manu: ["Em quais aprovações de conteúdo o clone poderia te dar segurança suficiente para avançar sem interromper a Dani?"],
    },
  },
  {
    key: "guardrails",
    label: "Limites e guardrails",
    description: "Privacidade, confidencialidade, risco reputacional e assuntos em que o clone não deve falar.",
    priority: 10,
    keywords: ["guardrail", "privacidade", "confidencial", "jurídico", "financeiro", "reputação"],
    prompts: {
      dani: [
        "Sobre quais assuntos o clone jamais pode falar em seu nome sem evidência explícita?",
        "Qual seria o erro mais grave que uma IA representando você poderia cometer publicamente?",
      ],
      alex: ["Que tipo de resposta do clone poderia gerar um risco reputacional ou comercial real?"],
      manu: ["Que informações do cotidiano nunca deveriam virar memória reutilizável pelo clone?"],
    },
  },
  {
    key: "cases",
    label: "Casos e decisões reais",
    description: "Situações concretas, contexto, decisão, justificativa, exceções e aprendizados.",
    priority: 10,
    keywords: ["caso real", "decisão real", "aprovado", "reprovado", "exceção", "aprendizado"],
    prompts: {
      dani: [
        "Conte uma decisão recente em que a opção mais lucrativa não foi a escolhida. O que pesou mais?",
        "Lembre de uma situação em que você mudou de opinião depois de receber uma informação nova. O que mudou a decisão?",
      ],
      alex: ["Conte uma negociação em que você já sabia qual seria a resposta da Dani antes de perguntar. O que tornou a decisão previsível?"],
      manu: ["Conte uma aprovação ou reprovação recente que ensinou um critério novo sobre a Dani."],
    },
  },
]

export type ClonePrompt = {
  id: string
  domain: string
  domainLabel: string
  question: string
  reason: string
}

export function clonePromptFor(input: {
  username?: string | null
  coverage: Record<string, number>
  offset?: number
}): ClonePrompt {
  const username = (input.username || "").toUpperCase()
  const roleKey = username === "DANI" ? "dani" : username === "ALEX" ? "alex" : username === "MANU" ? "manu" : "team"
  const ranked = [...CLONE_DOMAINS].sort((a, b) => {
    const aScore = (input.coverage[a.key] || 0) * 10 - a.priority
    const bScore = (input.coverage[b.key] || 0) * 10 - b.priority
    return aScore - bScore
  })
  const domain = ranked[(input.offset || 0) % ranked.length]
  const specific = domain.prompts[roleKey] || domain.prompts.team || domain.prompts.dani
  const index = (input.coverage[domain.key] || 0) % specific.length
  return {
    id: domain.key + "-" + index,
    domain: domain.key,
    domainLabel: domain.label,
    question: specific[index],
    reason: input.coverage[domain.key]
      ? "Este tema ainda precisa de mais exemplos e nuances para o clone ganhar precisão."
      : "Ainda há pouca evidência sobre este tema no clone.",
  }
}
