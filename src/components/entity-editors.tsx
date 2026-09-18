"use client"

import * as React from "react"
import { toast } from "sonner"
import { CalendarDays, Check, Trash2 } from "lucide-react"
import { useDashboard } from "@/components/data-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { CalendarEvent, Task } from "@/lib/types"

const taskStatuses: Task["status"][] = ["A iniciar", "Em produção", "Em aprovação", "Concluído", "Aguardando definição da Dani"]
const priorities: Task["priority"][] = ["Alta", "Média", "Baixa"]
const categories = ["Aulas do curso", "Roteiros", "Gravações", "Edição", "Área de membros", "Página de vendas", "Criativos", "Anúncios", "Conteúdos orgânicos", "E-mails e WhatsApp"]
const eventTypes = ["Evento", "Gravação", "Aprovação", "Conteúdo", "Produção", "Campanha", "Lançamento", "Reunião"]

const emptyTask = (): Task => ({ id: crypto.randomUUID(), title: "", owner: "Dani Ricco", due: "Sem data", status: "A iniciar", priority: "Média", category: "Aulas do curso", link: "", notes: "", done: false })
const emptyEvent = (): CalendarEvent => ({ id: crypto.randomUUID(), title: "", date: "2026-09-19", endDate: "", time: "09:00", type: "Reunião", phase: "Produção", owner: "Dani Ricco", status: "Planejado", description: "", link: "", notes: "", done: false })

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="eyebrow">{label}</Label>{children}</div>
}

type TaskSheetProps = { open: boolean; onOpenChange: (open: boolean) => void; task?: Task | null }

export function TaskSheet(props: TaskSheetProps) {
  if (!props.open) return null
  return <TaskSheetForm key={props.task?.id ?? "new"} {...props}/>
}

function TaskSheetForm({ open, onOpenChange, task }: TaskSheetProps) {
  const { data, update } = useDashboard()
  const [draft, setDraft] = React.useState<Task>(() => task ?? emptyTask())

  const save = () => {
    if (!draft.title.trim()) return toast.error("Informe o nome da tarefa.")
    const exists = data.tasks.some((item) => item.id === draft.id)
    update("tasks", exists ? data.tasks.map((item) => item.id === draft.id ? draft : item) : [draft, ...data.tasks])
    toast.success(exists ? "Tarefa atualizada." : "Tarefa adicionada.")
    onOpenChange(false)
  }
  const remove = () => {
    update("tasks", data.tasks.filter((item) => item.id !== draft.id))
    toast.success("Tarefa excluída.")
    onOpenChange(false)
  }
  const complete = () => setDraft((item) => ({ ...item, done: true, status: "Concluído" }))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-white/10 sm:max-w-lg">
        <SheetHeader className="border-b border-border p-6">
          <SheetTitle className="text-xl font-semibold">{task ? "Detalhes da tarefa" : "Nova tarefa"}</SheetTitle>
          <SheetDescription>Atualize responsáveis, prazos e materiais relacionados.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1"><div className="space-y-5 p-6">
          <Field label="Nome"><Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="O que precisa ser feito?" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Responsável"><Input value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })} /></Field>
            <Field label="Prazo"><Input value={draft.due} onChange={(event) => setDraft({ ...draft, due: event.target.value })} placeholder="DD/MM/AAAA ou Sem data" /></Field>
            <Field label="Status"><Select value={draft.status} onValueChange={(value) => setDraft({ ...draft, status: value as Task["status"], done: value === "Concluído" })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{taskStatuses.map((status) => <SelectItem value={status} key={status}>{status}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Prioridade"><Select value={draft.priority} onValueChange={(value) => setDraft({ ...draft, priority: value as Task["priority"] })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{priorities.map((priority) => <SelectItem value={priority} key={priority}>{priority}</SelectItem>)}</SelectContent></Select></Field>
          </div>
          <Field label="Categoria"><Select value={draft.category} onValueChange={(value) => setDraft({ ...draft, category: value })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem value={category} key={category}>{category}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Link ou material"><Input value={draft.link} onChange={(event) => setDraft({ ...draft, link: event.target.value })} placeholder="https://..." /></Field>
          <Field label="Observações"><Textarea rows={5} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></Field>
        </div></ScrollArea>
        <SheetFooter className="border-t border-border p-5 sm:flex-row">
          {task && <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" className="mr-auto"><Trash2 />Excluir</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir esta tarefa?</AlertDialogTitle><AlertDialogDescription>Essa ação não poderá ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={remove}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
          {!draft.done && <Button variant="outline" onClick={complete}><Check />Concluir</Button>}
          <Button onClick={save}>Salvar tarefa</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

type EventSheetProps = { open: boolean; onOpenChange: (open: boolean) => void; event?: CalendarEvent | null }

export function EventSheet(props: EventSheetProps) {
  if (!props.open) return null
  return <EventSheetForm key={props.event?.id ?? "new"} {...props}/>
}

function EventSheetForm({ open, onOpenChange, event }: EventSheetProps) {
  const { data, update } = useDashboard()
  const [draft, setDraft] = React.useState<CalendarEvent>(() => event ?? emptyEvent())

  const save = () => {
    if (!draft.title.trim()) return toast.error("Informe o nome do evento.")
    const exists = data.events.some((item) => item.id === draft.id)
    update("events", exists ? data.events.map((item) => item.id === draft.id ? draft : item) : [...data.events, draft])
    toast.success(exists ? "Evento atualizado." : "Evento adicionado.")
    onOpenChange(false)
  }
  const remove = () => {
    update("events", data.events.filter((item) => item.id !== draft.id))
    toast.success("Evento excluído.")
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-white/10 sm:max-w-lg">
        <SheetHeader className="border-b border-border p-6"><SheetTitle className="flex items-center gap-2 text-xl font-semibold"><CalendarDays className="text-primary" />{event ? "Detalhes do evento" : "Novo evento"}</SheetTitle><SheetDescription>Organize datas, fase, responsável e observações.</SheetDescription></SheetHeader>
        <ScrollArea className="flex-1"><div className="space-y-5 p-6">
          <Field label="Nome"><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data"><Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field>
            <Field label="Data final"><Input type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} /></Field>
            <Field label="Horário"><Input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} /></Field>
            <Field label="Tipo"><Select value={draft.type} onValueChange={(value) => setDraft({ ...draft, type: value })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{eventTypes.map((type) => <SelectItem value={type} key={type}>{type}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Fase"><Input value={draft.phase} onChange={(e) => setDraft({ ...draft, phase: e.target.value })} /></Field>
            <Field label="Responsável"><Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} /></Field>
            <Field label="Status"><Input value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} /></Field>
          </div>
          <Field label="Descrição"><Textarea rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
          <Field label="Link relacionado"><Input value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} placeholder="https://..." /></Field>
          <Field label="Observações"><Textarea rows={4} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></Field>
        </div></ScrollArea>
        <SheetFooter className="border-t border-border p-5 sm:flex-row">
          {event && <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" className="mr-auto"><Trash2 />Excluir</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir este evento?</AlertDialogTitle><AlertDialogDescription>Essa ação não poderá ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={remove}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
          {!draft.done && <Button variant="outline" onClick={() => setDraft({ ...draft, done: true, status: "Concluído" })}><Check />Concluir</Button>}
          <Button onClick={save}>Salvar evento</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
