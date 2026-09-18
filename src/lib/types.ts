export type TaskStatus = "A iniciar" | "Em produção" | "Em aprovação" | "Concluído" | "Aguardando definição da Dani"
export type Priority = "Alta" | "Média" | "Baixa"
export type LessonStatus = "Não iniciada" | "Roteirizada" | "Gravada" | "Em edição" | "Em revisão" | "Pronta"

export type Task = {
  id: string
  title: string
  owner: string
  due: string
  status: TaskStatus
  priority: Priority
  category: string
  link: string
  notes: string
  done: boolean
}

export type CalendarEvent = {
  id: string
  title: string
  date: string
  endDate: string
  time: string
  type: string
  phase: string
  owner: string
  status: string
  description: string
  link: string
  notes: string
  done: boolean
}

export type Lesson = {
  id: string
  module: string
  name: string
  objective: string
  status: LessonStatus
  due: string
  owner: string
  recordingLink: string
  finalLink: string
  notes: string
}

export type MemberItem = {
  id: string
  group: string
  title: string
  status: TaskStatus
  owner: string
  due: string
  link: string
  notes: string
}

export type ContentItem = {
  id: string
  area: string
  title: string
  type: string
  status: TaskStatus
  owner: string
  due: string
  link: string
  notes: string
}

export type Material = {
  id: string
  name: string
  description: string
  link: string
  icon: string
}

export type Product = {
  name: string
  concept: string
  description: string
  promise: string
  audience: string
  transformation: string
  pillars: string
  differentiators: string
  pains: string
  editorial: string
  notes: string
  status: string
}

export type Offer = Record<string, string>
export type Debrief = Record<string, string>
export type Metrics = Record<string, string>

export type LaunchRow = {
  id: string
  action: string
  content: string
  campaigns: string
  adjustments: string
  pending: string
  owner: string
}

export type AppData = {
  product: Product
  offer: Offer
  tasks: Task[]
  events: CalendarEvent[]
  lessons: Lesson[]
  memberItems: MemberItem[]
  contents: ContentItem[]
  materials: Material[]
  launchMetrics: Metrics
  debriefMetrics: Metrics
  debrief: Debrief
  launchRows: LaunchRow[]
}
