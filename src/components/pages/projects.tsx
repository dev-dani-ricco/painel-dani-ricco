"use client"

import * as React from "react"
import {
  CalendarDays, CirclePlus, Columns3, GripVertical, ListTodo, LoaderCircle,
  Plus, Target, Users,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { useDashboard } from "@/components/data-provider"
import { NewProjectDialog } from "@/components/project-switcher"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Priority, ProjectCard, ProjectStage } from "@/lib/types"

export function ProjectsPage() {
  const { user } = useAuth()
  const { activeProject, updateProject, createProject } = useDashboard()
  const [cardOpen, setCardOpen] = React.useState(false)
  const [newProjectOpen, setNewProjectOpen] = React.useState(false)
  const [newProjectSaving, setNewProjectSaving] = React.useState(false)
  const canCreateProject = ["owner", "admin", "editor", "system"].includes(user?.role || "")
  const [defaultStageId, setDefaultStageId] = React.useState("")
  const [stageOpen, setStageOpen] = React.useState(false)
  const [stageSaving, setStageSaving] = React.useState(false)
  const [view, setView] = React.useState<"kanban" | "list" | "calendar">("kanban")

  if (!activeProject) {
    return <div className="flex min-h-[50vh] items-center justify-center text-sm text-zinc-500">
      <LoaderCircle className="mr-2 size-4 animate-spin"/>Carregando projeto…
    </div>
  }

  const stages = [...activeProject.stages].sort((a, b) => a.order - b.order)
  const lastStage = stages.at(-1)
  const completed = lastStage
    ? activeProject.cards.filter((card) => card.stageId === lastStage.id).length
    : 0

  const moveCard = async (cardId: string, stageId: string) => {
    const cards = activeProject.cards.map((card) =>
      card.id === cardId ? { ...card, stageId } : card,
    )
    try {
      await updateProject({ id: activeProject.id, cards })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao mover card")
    }
  }

  const addStage = async (rawName: string) => {
    const name = rawName.trim()
    if (!name || stageSaving) return false
    if (activeProject.stages.some((stage) => stage.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Essa etapa já existe.")
      return false
    }
    setStageSaving(true)

    try {
      const stages: ProjectStage[] = [
        ...activeProject.stages,
        { id: crypto.randomUUID(), name, order: activeProject.stages.length + 1 },
      ]
      await updateProject({ id: activeProject.id, stages })
      toast.success("Etapa adicionada ao projeto.")
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao adicionar etapa")
      return false
    } finally {
      setStageSaving(false)
    }
  }

  const openCard = (stageId: string) => {
    setDefaultStageId(stageId)
    setCardOpen(true)
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">PROJETOS</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-.03em]">Gestão dos projetos</h1>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-600">Troque o projeto pelo menu lateral. A criação e estruturação de novos projetos começa aqui.</p>
      </div>
      {canCreateProject ? <Button onClick={() => setNewProjectOpen(true)} className="self-start sm:self-auto"><Plus/>Novo projeto</Button> : null}
    </div>

    <section className="rounded-2xl border border-white/[.08] bg-card p-5 sm:p-7">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">PROJETO ATIVO</p>
            <Badge variant="outline" className="border-primary/25 bg-primary/[.05] text-primary">
              {activeProject.status}
            </Badge>
            <Badge variant="outline" className="border-white/10 text-zinc-500">
              Prioridade {activeProject.priority}
            </Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
            {activeProject.name}
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            {activeProject.objective || activeProject.description || "Defina o objetivo central deste projeto."}
          </p>
          {activeProject.successCriteria ? (
            <div className="mt-4 rounded-xl border border-white/[.06] bg-black/15 px-4 py-3">
              <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-zinc-700">Critério de sucesso</p>
              <p className="mt-1.5 text-xs leading-5 text-zinc-400">{activeProject.successCriteria}</p>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5"><Users className="size-3.5"/>{activeProject.responsibles.join(", ") || "Sem responsável"}</span>
            <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5"/>{formatDate(activeProject.startDate)} → {formatDate(activeProject.targetDate)}</span>
            <span className="flex items-center gap-1.5"><Target className="size-3.5"/>{activeProject.projectType}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:min-w-[310px]">
          <Metric value={String(stages.length)} label="etapas"/>
          <Metric value={String(activeProject.cards.length)} label="cards"/>
          <Metric value={String(completed)} label="na etapa final"/>
        </div>
      </div>
    </section>

    <section>
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="eyebrow">EXECUÇÃO</p>
          <h2 className="mt-1 text-xl font-semibold">Fluxo do projeto</h2>
          <p className="mt-1 text-xs text-zinc-600">Os mesmos cards podem ser acompanhados em Kanban, Lista ou Calendário.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="grid grid-cols-3 rounded-lg border border-white/[.08] bg-black/15 p-1">
            <Button type="button" size="sm" variant={view === "kanban" ? "secondary" : "ghost"} onClick={() => setView("kanban")}>
              <Columns3/>Kanban
            </Button>
            <Button type="button" size="sm" variant={view === "list" ? "secondary" : "ghost"} onClick={() => setView("list")}>
              <ListTodo/>Lista
            </Button>
            <Button type="button" size="sm" variant={view === "calendar" ? "secondary" : "ghost"} onClick={() => setView("calendar")}>
              <CalendarDays/>Calendário
            </Button>
          </div>
          {view === "kanban" ? <Button variant="outline" onClick={() => setStageOpen(true)}>
            <CirclePlus/>Adicionar etapa
          </Button> : <Button variant="outline" onClick={() => openCard(stages[0]?.id || "")} disabled={!stages.length}>
            <Plus/>Novo card
          </Button>}
        </div>
      </div>

      {view === "kanban" ? <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max items-start gap-3">
          {stages.map((stage) => {
            const cards = activeProject.cards.filter((card) => card.stageId === stage.id)
            return <KanbanColumn
              key={stage.id}
              stage={stage}
              stages={stages}
              cards={cards}
              onAdd={() => openCard(stage.id)}
              onDropCard={(cardId) => void moveCard(cardId, stage.id)}
              onMoveCard={(cardId, nextStageId) => void moveCard(cardId, nextStageId)}
            />
          })}
        </div>
      </div> : view === "list" ? (
        <ProjectListView stages={stages} cards={activeProject.cards} onMove={moveCard}/>
      ) : (
        <ProjectCalendarView stages={stages} cards={activeProject.cards}/>
      )}
    </section>

    <NewProjectDialog
      open={newProjectOpen}
      onOpenChange={setNewProjectOpen}
      saving={newProjectSaving}
      setSaving={setNewProjectSaving}
      onCreated={() => setNewProjectOpen(false)}
      createProject={createProject}
    />
    <NewStageDialog
      open={stageOpen}
      onOpenChange={setStageOpen}
      saving={stageSaving}
      onSave={addStage}
    />
    <NewCardDialog
      open={cardOpen}
      onOpenChange={setCardOpen}
      stageId={defaultStageId || stages[0]?.id || ""}
    />
  </div>
}

function NewStageDialog({
  open,
  onOpenChange,
  saving,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  saving: boolean
  onSave: (name: string) => Promise<boolean>
}) {
  const [name, setName] = React.useState("")

  const close = () => {
    if (saving) return
    setName("")
    onOpenChange(false)
  }

  const save = async () => {
    if (!name.trim() || saving) return
    const saved = await onSave(name)
    if (saved) {
      setName("")
      onOpenChange(false)
    }
  }

  return <Dialog open={open} onOpenChange={(next) => next ? onOpenChange(true) : close()}>
    <DialogContent className="border-white/10 bg-[#111] text-white sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Adicionar etapa</DialogTitle>
        <DialogDescription>Crie uma nova coluna no fluxo do projeto ativo. A etapa será salva imediatamente.</DialogDescription>
      </DialogHeader>
      <Field label="Nome da etapa">
        <Input
          autoFocus
          aria-label="Nome da etapa"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              void save()
            }
          }}
          placeholder="Ex.: Aprovação final"
        />
      </Field>
      <DialogFooter>
        <Button variant="outline" disabled={saving} onClick={close}>Cancelar</Button>
        <Button disabled={!name.trim() || saving} onClick={() => void save()}>
          {saving ? <LoaderCircle className="animate-spin"/> : <CirclePlus/>}
          Adicionar etapa
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}

function ProjectListView({
  stages,
  cards,
  onMove,
}: {
  stages: ProjectStage[]
  cards: ProjectCard[]
  onMove: (cardId: string, stageId: string) => Promise<void>
}) {
  const stageMap = new Map(stages.map((stage) => [stage.id, stage.name]))
  const ordered = [...cards].sort((a, b) => (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99"))

  if (!ordered.length) {
    return <EmptyProjectView title="Nenhum card no projeto" description="Crie o primeiro card para começar a execução."/>
  }

  return <div className="overflow-hidden rounded-xl border border-white/[.07] bg-[#111]">
    <div className="hidden grid-cols-[minmax(0,2fr)_minmax(150px,1fr)_130px_110px_150px] gap-3 border-b border-white/[.06] px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[.14em] text-zinc-700 md:grid">
      <span>Card</span><span>Responsável</span><span>Prazo</span><span>Prioridade</span><span>Etapa</span>
    </div>
    {ordered.map((card) => <div key={card.id} className="grid gap-2 border-b border-white/[.05] px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,2fr)_minmax(150px,1fr)_130px_110px_150px] md:items-center md:gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-zinc-200">{card.title}</p>
        {card.description ? <p className="mt-1 line-clamp-1 text-[10px] text-zinc-600">{card.description}</p> : null}
      </div>
      <span className="text-[11px] text-zinc-500">{card.owner || "Sem responsável"}</span>
      <span className="text-[11px] text-zinc-500">{card.dueDate ? formatDate(card.dueDate) : "Sem prazo"}</span>
      <span className={priorityClass(card.priority)}>{card.priority}</span>
      <Select value={card.stageId} onValueChange={(stageId) => void onMove(card.id, stageId)}>
        <SelectTrigger className="h-8 w-full border-white/[.08] bg-black/20 text-[10px]"><SelectValue placeholder={stageMap.get(card.stageId)}/></SelectTrigger>
        <SelectContent>{stages.map((stage) => <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>)}</SelectContent>
      </Select>
    </div>)}
  </div>
}

function ProjectCalendarView({ stages, cards }: { stages: ProjectStage[]; cards: ProjectCard[] }) {
  const stageMap = new Map(stages.map((stage) => [stage.id, stage.name]))
  const groups = cards.reduce<Record<string, ProjectCard[]>>((acc, card) => {
    const key = card.dueDate || "sem-data"
    ;(acc[key] ||= []).push(card)
    return acc
  }, {})
  const dates = Object.keys(groups).sort((a, b) => {
    if (a === "sem-data") return 1
    if (b === "sem-data") return -1
    return a.localeCompare(b)
  })

  if (!dates.length) {
    return <EmptyProjectView title="Calendário vazio" description="Os cards com prazo aparecerão organizados por data aqui."/>
  }

  return <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
    {dates.map((date) => <div key={date} className="rounded-xl border border-white/[.07] bg-[#111] p-4">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays className="size-3.5 text-primary"/>
        <p className="text-xs font-semibold">{date === "sem-data" ? "Sem data definida" : formatDate(date)}</p>
        <span className="ml-auto text-[9px] text-zinc-700">{groups[date].length} card(s)</span>
      </div>
      <div className="space-y-2">
        {groups[date].map((card) => <div key={card.id} className="rounded-lg border border-white/[.06] bg-black/20 p-3">
          <p className="text-xs font-semibold leading-5 text-zinc-200">{card.title}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[9px] text-zinc-600">
            <span>{stageMap.get(card.stageId) || "Etapa"}</span>
            {card.owner ? <span>· {card.owner}</span> : null}
            <span className={priorityClass(card.priority)}>{card.priority}</span>
          </div>
        </div>)}
      </div>
    </div>)}
  </div>
}

function EmptyProjectView({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-dashed border-white/[.08] bg-[#111] px-5 py-12 text-center">
    <p className="text-sm font-semibold text-zinc-300">{title}</p>
    <p className="mt-1 text-xs text-zinc-600">{description}</p>
  </div>
}

function KanbanColumn({
  stage,
  stages,
  cards,
  onAdd,
  onDropCard,
  onMoveCard,
}: {
  stage: ProjectStage
  stages: ProjectStage[]
  cards: ProjectCard[]
  onAdd: () => void
  onDropCard: (cardId: string) => void
  onMoveCard: (cardId: string, stageId: string) => void
}) {
  return <div
    id={"stage-" + stage.id}
    className="w-[292px] shrink-0 scroll-mt-24 rounded-xl border border-white/[.07] bg-[#111] p-3"
    onDragOver={(event) => event.preventDefault()}
    onDrop={(event) => {
      event.preventDefault()
      const cardId = event.dataTransfer.getData("text/project-card")
      if (cardId) onDropCard(cardId)
    }}
  >
    <div className="mb-3 flex items-center gap-2 px-1">
      <span className="grid size-6 place-items-center rounded-full border border-white/[.08] text-[9px] text-zinc-600">
        {String(stage.order).padStart(2, "0")}
      </span>

      <p className="min-w-0 flex-1 truncate text-xs font-semibold">{stage.name}</p>
      <span className="text-[10px] text-zinc-700">{cards.length}</span>
    </div>
    <div className="min-h-20 space-y-2">
      {cards.map((card) => <KanbanCard key={card.id} card={card} stages={stages} onMove={onMoveCard}/>)}
      {!cards.length ? (
        <div className="rounded-lg border border-dashed border-white/[.06] px-3 py-6 text-center text-[10px] text-zinc-700">
          Solte um card aqui
        </div>
      ) : null}
    </div>
    <Button variant="ghost" size="sm" className="mt-2 w-full justify-start text-zinc-600" onClick={onAdd}>
      <Plus/>Adicionar card
    </Button>
  </div>
}

function KanbanCard({ card, stages, onMove }: { card: ProjectCard; stages: ProjectStage[]; onMove: (cardId: string, stageId: string) => void }) {
  return <article
    draggable
    onDragStart={(event) => {
      event.dataTransfer.setData("text/project-card", card.id)
      event.dataTransfer.effectAllowed = "move"
    }}
    className="cursor-grab rounded-lg border border-white/[.08] bg-[#191919] p-3 shadow-sm active:cursor-grabbing"
  >

    <div className="flex items-start gap-2">
      <GripVertical className="mt-0.5 size-3.5 shrink-0 text-zinc-700"/>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold leading-5 text-zinc-200">{card.title}</p>
        {card.description ? (
          <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-zinc-600">
            {card.description}
          </p>
        ) : null}
      </div>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[9px] text-zinc-600">
      <span className={priorityClass(card.priority)}>{card.priority}</span>
      {card.owner ? <span>{card.owner}</span> : null}
      {card.dueDate ? <span>· {formatDate(card.dueDate)}</span> : null}
    </div>
    <div className="mt-3 sm:hidden">
      <Select value={card.stageId} onValueChange={(stageId) => onMove(card.id, stageId)}>
        <SelectTrigger className="h-8 w-full border-white/[.08] bg-black/20 text-[10px]"><SelectValue/></SelectTrigger>
        <SelectContent>{stages.map((stage) => <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  </article>
}

function NewCardDialog({
  open,
  onOpenChange,
  stageId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  stageId: string
}) {

  const { activeProject, updateProject } = useDashboard()
  const [title, setTitle] = React.useState("")
  const [owner, setOwner] = React.useState("")
  const [dueDate, setDueDate] = React.useState("")
  const [priority, setPriority] = React.useState<Priority>("Média")
  const [description, setDescription] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const reset = () => {
    setTitle("")
    setOwner("")
    setDueDate("")
    setPriority("Média")
    setDescription("")
  }

  const save = async () => {
    if (!activeProject || !title.trim() || !stageId || saving) return
    setSaving(true)
    try {
      const card: ProjectCard = {
        id: crypto.randomUUID(),
        title: title.trim(),
        stageId,
        owner: owner.trim(),
        dueDate,
        priority,
        description: description.trim(),
      }

      await updateProject({ id: activeProject.id, cards: [...activeProject.cards, card] })
      reset()
      onOpenChange(false)
      toast.success("Card adicionado ao quadro.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao criar card")
    } finally {
      setSaving(false)
    }
  }

  return <Dialog open={open} onOpenChange={(next) => {
    if (!next && !saving) reset()
    onOpenChange(next)
  }}>
    <DialogContent className="border-white/10 bg-[#111] text-white sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Novo card</DialogTitle>
        <DialogDescription>Registre uma entrega ou decisão operacional no fluxo do projeto.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título" className="sm:col-span-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Aprovar preview da página"/>
        </Field>
        <Field label="Responsável">

          <Input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Dani, Isa, Manu…"/>
        </Field>
        <Field label="Prazo">
          <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)}/>
        </Field>
        <Field label="Prioridade">
          <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
            <SelectTrigger className="w-full"><SelectValue/></SelectTrigger>
            <SelectContent>
              {["Alta", "Média", "Baixa"].map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Descrição" className="sm:col-span-2">
          <Textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Critério de conclusão, contexto ou observações."
          />
        </Field>
      </div>
      <DialogFooter>

        <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button disabled={!title.trim() || saving} onClick={() => void save()}>
          {saving ? <LoaderCircle className="animate-spin"/> : <Plus/>}
          Criar card
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return <div className={"space-y-2 " + (className || "")}>
    <Label className="text-[10px] uppercase tracking-[.14em] text-zinc-500">{label}</Label>
    {children}
  </div>
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl border border-white/[.07] bg-black/15 px-3 py-3 text-center">
    <p className="text-xl font-semibold text-zinc-200">{value}</p>
    <p className="mt-1 text-[9px] uppercase tracking-[.12em] text-zinc-700">{label}</p>
  </div>
}

function formatDate(value: string) {
  if (!value) return "Sem data"
  const [year, month, day] = value.split("-")
  return day && month && year ? day + "/" + month + "/" + year : value
}

function priorityClass(priority: Priority) {
  const base = "rounded-full border px-1.5 py-0.5 "
  if (priority === "Alta") {
    return base + "border-red-500/20 bg-red-500/[.06] text-red-300"
  }
  if (priority === "Baixa") {
    return base + "border-white/[.07] text-zinc-600"
  }
  return base + "border-amber-500/20 bg-amber-500/[.05] text-amber-300"
}
