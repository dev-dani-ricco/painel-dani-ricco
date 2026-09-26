"use client"

import * as React from "react"
import { AtSign, CheckCircle2, Clock3, Search, UserRound, UsersRound } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useDashboard } from "@/components/data-provider"
import { ProjectCardDetailSheet } from "@/components/project-card-detail"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Project, ProjectCard, ProjectStage } from "@/lib/types"

type View = "assigned" | "created" | "mentions" | "completed"
type WorkItem = { project: Project; card: ProjectCard; stage?: ProjectStage; completed: boolean }

const views: Array<{ id: View; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "assigned", label: "Atribuídas a mim", icon: UserRound },
  { id: "created", label: "Criadas por mim", icon: UsersRound },
  { id: "mentions", label: "Menções", icon: AtSign },
  { id: "completed", label: "Concluídas", icon: CheckCircle2 },
]

const normalize = (value?: string) => (value || "").trim().replace(/^@/, "").toLowerCase()
const ownerTokens = (value: string) => value.split(/[,;/|]+/).map(normalize).filter(Boolean)

export function MyTasksPage() {
  const { projects, updateProject } = useDashboard()
  const { user } = useAuth()
  const [view, setView] = React.useState<View>("assigned")
  const [query, setQuery] = React.useState("")
  const [selected, setSelected] = React.useState<WorkItem | null>(null)

  const identities = React.useMemo(() => new Set([
    normalize(user?.username),
    normalize(user?.displayName),
  ].filter(Boolean)), [user?.displayName, user?.username])

  const items = React.useMemo<WorkItem[]>(() => projects.flatMap((project) => {
    const stages = project.stages.slice().sort((a,b) => a.order-b.order)
    const finalStage = stages.at(-1)?.id
    const stageMap = new Map(stages.map((stage) => [stage.id, stage]))
    return project.cards.map((card) => ({
      project,
      card,
      stage: stageMap.get(card.stageId),
      completed: Boolean(finalStage && card.stageId === finalStage),
    }))
  }), [projects])

  const matchesIdentity = React.useCallback((value?: string) => identities.has(normalize(value)), [identities])
  const filtered = items.filter((item) => {
    const { card, project, completed } = item
    const assigned = ownerTokens(card.owner).some((owner) => identities.has(owner))
    const created = matchesIdentity(card.createdBy)
    const mentioned = (card.mentionedUsers || []).some(matchesIdentity)
    const inView = view === "assigned" ? assigned && !completed
      : view === "created" ? created && !completed
      : view === "mentions" ? mentioned && !completed
      : completed
    const needle = normalize(query)
    const inSearch = !needle || normalize([card.title, card.description, card.owner, project.name].join(" ")).includes(needle)
    return inView && inSearch
  }).sort((a,b) => (a.card.dueDate || "9999-99-99").localeCompare(b.card.dueDate || "9999-99-99"))

  const complete = async (item: WorkItem) => {
    const stages = item.project.stages.slice().sort((a,b) => a.order-b.order)
    const finalStage = stages.at(-1)
    if (!finalStage) return
    await updateProject({
      id: item.project.id,
      cards: item.project.cards.map((card) => card.id === item.card.id ? { ...card, stageId: finalStage.id } : card),
    })
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="eyebrow">TRABALHO PESSOAL</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-.03em]">Minhas Tarefas</h1>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-600">Uma visão transversal dos cards que já pertencem aos projetos. Nada é duplicado: cada alteração volta para o projeto de origem.</p>
      </div>
      <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-700"/><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Buscar tarefa ou projeto..."/></div>
    </div>

    <div className="flex gap-2 overflow-x-auto pb-1">{views.map(({ id, label, icon: Icon }) => <Button key={id} size="sm" variant={view === id ? "secondary" : "outline"} onClick={() => setView(id)} className="shrink-0"><Icon/>{label}<Badge variant="outline" className="ml-1 border-white/[.07] bg-black/20 text-[9px]">{items.filter((item) => id === "assigned" ? ownerTokens(item.card.owner).some((owner) => identities.has(owner)) && !item.completed : id === "created" ? matchesIdentity(item.card.createdBy) && !item.completed : id === "mentions" ? (item.card.mentionedUsers || []).some(matchesIdentity) && !item.completed : item.completed).length}</Badge></Button>)}</div>

    <section className="overflow-hidden rounded-xl border border-white/[.07] bg-[#111]">
      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(160px,1fr)_130px_110px_auto] gap-3 border-b border-white/[.06] px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[.14em] text-zinc-700 md:grid">
        <span>Tarefa</span><span>Projeto / etapa</span><span>Prazo</span><span>Prioridade</span><span></span>
      </div>
      {filtered.length ? filtered.map((item) => <div key={item.project.id + ":" + item.card.id} className="grid gap-2 border-b border-white/[.05] px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,2fr)_minmax(160px,1fr)_130px_110px_auto] md:items-center md:gap-3">
        <button className="min-w-0 text-left" onClick={() => setSelected(item)}>
          <p className="truncate text-xs font-semibold text-zinc-200">{item.card.title}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-zinc-600"><span>{item.card.owner || "Sem responsável"}</span>{item.card.checklist?.length ? <span>· {item.card.checklist.filter((entry) => entry.done).length}/{item.card.checklist.length} checklist</span> : null}{item.card.comments?.length ? <span>· {item.card.comments.length} comentário(s)</span> : null}</div>
        </button>
        <button className="text-left" onClick={() => setSelected(item)}><p className="truncate text-[11px] text-zinc-400">{item.project.name}</p><p className="mt-1 truncate text-[10px] text-zinc-700">{item.stage?.name || "Sem etapa"}</p></button>
        <span className="flex items-center gap-1 text-[11px] text-zinc-500"><Clock3 className="size-3"/>{formatDate(item.card.dueDate)}</span>
        <span className={priorityClass(item.card.priority)}>{item.card.priority}</span>
        {!item.completed ? <Button size="sm" variant="ghost" onClick={() => void complete(item)}><CheckCircle2/>Concluir</Button> : <span className="text-[10px] text-emerald-400">Concluída</span>}
      </div>) : <div className="px-5 py-14 text-center"><p className="text-sm font-semibold text-zinc-300">Nenhuma tarefa nesta visão</p><p className="mt-1 text-xs text-zinc-600">Os cards aparecem aqui conforme responsável, criador, menções e etapa final.</p></div>}
    </section>

    <ProjectCardDetailSheet open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null) }} project={selected?.project || null} card={selected?.card || null}/>
  </div>
}

function formatDate(value: string) {
  if (!value) return "Sem prazo"
  const [year, month, day] = value.split("-")
  return day && month && year ? day + "/" + month + "/" + year : value
}

function priorityClass(priority: ProjectCard["priority"]) {
  const base = "w-fit rounded-full border px-2 py-1 text-[9px] "
  if (priority === "Alta") return base + "border-red-500/20 bg-red-500/[.06] text-red-300"
  if (priority === "Baixa") return base + "border-white/[.07] text-zinc-600"
  return base + "border-amber-500/20 bg-amber-500/[.05] text-amber-300"
}
