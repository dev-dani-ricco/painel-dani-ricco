"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, Columns3, FolderOpen, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { useDashboard } from "@/components/data-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const defaultStages = ["Briefing", "Produção", "Preview", "Revisão", "Lançamento", "Entrega"]
const stageTemplates: Record<string, string[]> = {
  "Lançamento": defaultStages,
  "Produto": ["Descoberta", "Estrutura", "Produção", "Preview", "Revisão", "Entrega"],
  "Evento": ["Briefing", "Planejamento", "Divulgação", "Produção", "Execução", "Pós-evento"],
  "Campanha": ["Briefing", "Criação", "Preview", "Aprovação", "Veiculação", "Análise"],
  "Projeto interno": ["Backlog", "Em execução", "Revisão", "Aprovação", "Concluído"],
  "Outro": defaultStages,
}

export function ProjectSwitcher({ onNavigate, compact = false }: { onNavigate?: () => void; compact?: boolean }) {
  const router = useRouter()
  const { user } = useAuth()
  const { projects, activeProject, activeProjectId, setActiveProject, createProject } = useDashboard()
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const canCreate = ["owner", "admin", "editor", "system"].includes(user?.role || "")

  const choose = (id: string) => {
    setActiveProject(id)
    onNavigate?.()
  }

  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-zinc-600 transition hover:bg-sidebar-accent hover:text-zinc-300">
            <Columns3 className="size-3.5 shrink-0"/>
            <span className="min-w-0 flex-1 truncate">Trocar projeto</span>
            <ChevronDown className="size-3.5 shrink-0"/>
          </button>
        ) : (
          <button className="w-full rounded-xl border border-white/[.08] bg-white/[.025] px-3 py-3 text-left transition hover:border-primary/25 hover:bg-white/[.04]">
            <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.18em] text-zinc-600">
              <FolderOpen className="size-3.5 text-primary"/>
              Projeto
              <ChevronDown className="ml-auto size-3.5"/>
            </div>
            <div className="mt-1.5 flex items-start gap-2">
              <p className="min-w-0 flex-1 line-clamp-2 text-[11px] font-semibold leading-4 text-zinc-200">
                {activeProject?.name || "Carregando projeto…"}
              </p>
              {activeProject?.status ? (
                <span className="shrink-0 rounded-full border border-white/[.08] px-1.5 py-0.5 text-[8px] text-zinc-600">
                  {activeProject.status}
                </span>
              ) : null}
            </div>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 border-white/10" align="start">
        <DropdownMenuLabel>Projetos</DropdownMenuLabel>
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onSelect={() => choose(project.id)}
            className="gap-2 px-2 py-2.5"
          >
            <span className="grid size-6 place-items-center rounded-md border border-white/[.07] bg-black/20">
              {project.id === activeProjectId ? <Check className="size-3 text-primary"/> : <FolderOpen className="size-3 text-zinc-600"/>}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs">{project.name}</span>
              <span className="block truncate text-[9px] text-zinc-600">{project.projectType} · {project.status}</span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator/>
        <DropdownMenuItem onSelect={() => { router.push("/projetos"); onNavigate?.() }}>
          <Columns3/> Abrir quadro Kanban
        </DropdownMenuItem>
        {canCreate ? (
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            <Plus/> Novo projeto
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
    <NewProjectDialog
      open={open}
      onOpenChange={setOpen}
      saving={saving}
      setSaving={setSaving}
      onCreated={() => {
        router.push("/projetos")
        onNavigate?.()
      }}
      createProject={createProject}
    />
  </>
}
type CreateProject = ReturnType<typeof useDashboard>["createProject"]

function NewProjectDialog({
  open,
  onOpenChange,
  saving,
  setSaving,
  onCreated,
  createProject,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  saving: boolean
  setSaving: (saving: boolean) => void
  onCreated: () => void
  createProject: CreateProject
}) {
  const [name, setName] = React.useState("")
  const [projectType, setProjectType] = React.useState("Lançamento")
  const [priority, setPriority] = React.useState<"Alta" | "Média" | "Baixa">("Média")
  const [responsibles, setResponsibles] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [targetDate, setTargetDate] = React.useState("")
  const [objective, setObjective] = React.useState("")
  const [successCriteria, setSuccessCriteria] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [stages, setStages] = React.useState(defaultStages)
  const [stageDraft, setStageDraft] = React.useState("")

  const reset = () => {
    setName("")
    setProjectType("Lançamento")
    setPriority("Média")
    setResponsibles("")
    setStartDate("")
    setTargetDate("")
    setObjective("")
    setSuccessCriteria("")
    setDescription("")
    setStages(defaultStages)
    setStageDraft("")
  }

  const close = () => {
    if (saving) return
    reset()
    onOpenChange(false)
  }

  const addStage = () => {
    const next = stageDraft.trim()
    if (!next || stages.some((stage) => stage.toLowerCase() === next.toLowerCase())) return
    setStages((current) => [...current, next])
    setStageDraft("")
  }

  const submit = async () => {
    if (saving) return
    const owners = responsibles.split(",").map((item) => item.trim()).filter(Boolean)
    if (name.trim().length < 3) return toast.error("Informe o nome do projeto.")
    if (owners.length === 0) return toast.error("Informe ao menos um responsável.")
    if (!startDate || !targetDate) return toast.error("Informe início e data-alvo.")
    if (objective.trim().length < 10) return toast.error("Descreva o objetivo principal.")
    if (successCriteria.trim().length < 10) return toast.error("Defina como o sucesso deste projeto será reconhecido.")
    if (stages.length < 2) return toast.error("Mantenha ao menos duas etapas.")

    setSaving(true)
    try {
      await createProject({
        name: name.trim(),
        description: description.trim(),
        objective: objective.trim(),
        successCriteria: successCriteria.trim(),
        priority,
        projectType,
        responsibles: owners,
        startDate,
        targetDate,
        stages,
      })
      reset()
      onOpenChange(false)
      onCreated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao criar projeto")
    } finally {
      setSaving(false)
    }
  }

  return <Dialog open={open} onOpenChange={(next) => next ? onOpenChange(true) : close()}>
    <DialogContent className="max-h-[92dvh] overflow-y-auto border-white/10 bg-[#111] text-white sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Novo projeto</DialogTitle>
        <DialogDescription>
          Crie o escopo mínimo antes de abrir tarefas e entregas. Cada projeto recebe um workspace próprio.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome do projeto">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Expresso IMPAR 2027"/>
        </Field>
        <Field label="Tipo">
          <Select value={projectType} onValueChange={(value) => {
            setProjectType(value)
            setStages([...(stageTemplates[value] || defaultStages)])
          }}>
            <SelectTrigger className="w-full"><SelectValue/></SelectTrigger>
            <SelectContent>
              {["Lançamento", "Produto", "Evento", "Campanha", "Projeto interno", "Outro"].map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Prioridade">
          <Select value={priority} onValueChange={(value) => setPriority(value as "Alta" | "Média" | "Baixa")}>
            <SelectTrigger className="w-full"><SelectValue/></SelectTrigger>
            <SelectContent>
              {["Alta", "Média", "Baixa"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Responsáveis">
          <Input value={responsibles} onChange={(event) => setResponsibles(event.target.value)} placeholder="Dani Ricco, Isa, Manu"/>
          <p className="text-[10px] text-zinc-600">Separe por vírgula.</p>
        </Field>
        <Field label="Data de início">
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)}/>
        </Field>
        <Field label="Data-alvo / lançamento">
          <Input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)}/>
        </Field>
        <Field label="Objetivo principal" className="sm:col-span-2">
          <Textarea rows={3} value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="O que este projeto precisa alcançar?"/>
        </Field>
        <Field label="Critério de sucesso" className="sm:col-span-2">
          <Textarea rows={3} value={successCriteria} onChange={(event) => setSuccessCriteria(event.target.value)} placeholder="Como saberemos, objetivamente, que o projeto deu certo?"/>
        </Field>
        <Field label="Contexto / descrição" className="sm:col-span-2">
          <Textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Escopo, público, restrições ou contexto importante."/>
        </Field>
      </div>
      <div className="mt-2 rounded-xl border border-white/[.08] bg-black/15 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold">Etapas do projeto</p>
            <p className="mt-1 text-[10px] leading-4 text-zinc-600">
              As etapas viram as colunas do Kanban e podem representar Preview, Revisão, Lançamento, Entrega etc.
            </p>
          </div>
          <span className="text-[10px] text-zinc-600">{stages.length} etapas</span>
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={stageDraft}
            onChange={(event) => setStageDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                addStage()
              }
            }}
            placeholder="Nova etapa"
          />
          <Button type="button" variant="outline" onClick={addStage}><Plus/>Adicionar</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {stages.map((stage, index) => (
            <span key={stage + index} className="inline-flex items-center gap-1.5 rounded-full border border-white/[.08] bg-white/[.025] px-2.5 py-1 text-[10px] text-zinc-400">
              <span>{String(index + 1).padStart(2, "0")}</span>
              {stage}
              <button
                type="button"
                onClick={() => setStages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                className="rounded-full p-0.5 text-zinc-700 hover:bg-white/10 hover:text-zinc-300"
                aria-label={"Remover etapa " + stage}
              >
                <X className="size-3"/>
              </button>
            </span>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" disabled={saving} onClick={close}>Cancelar</Button>
        <Button disabled={saving} onClick={() => void submit()}>
          {saving ? "Criando…" : "Criar projeto"}
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
