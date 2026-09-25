"use client"

import * as React from "react"
import { AtSign, Check, Link2, ListChecks, MessageSquareText, Paperclip, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { useDashboard } from "@/components/data-provider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import type { Priority, Project, ProjectCard } from "@/lib/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
  card: ProjectCard | null
}

const priorities: Priority[] = ["Alta", "Média", "Baixa"]

function normalizeMention(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase()
}

export function ProjectCardDetailSheet({ open, onOpenChange, project, card }: Props) {
  if (!open || !project || !card) return null
  return <ProjectCardDetailForm key={project.id + ":" + card.id} open={open} onOpenChange={onOpenChange} project={project} card={card}/>
}

function ProjectCardDetailForm({ open, onOpenChange, project, card }: { open: boolean; onOpenChange: (open: boolean) => void; project: Project; card: ProjectCard }) {
  const { updateProject } = useDashboard()
  const { user } = useAuth()
  const [draft, setDraft] = React.useState<ProjectCard>(() => ({
    ...card,
    createdBy: card.createdBy || "",
    mentionedUsers: card.mentionedUsers || [],
    checklist: card.checklist || [],
    comments: card.comments || [],
    attachments: card.attachments || [],
    dependencies: card.dependencies || [],
  }))
  const [saving, setSaving] = React.useState(false)
  const [newChecklist, setNewChecklist] = React.useState("")
  const [newComment, setNewComment] = React.useState("")
  const [attachmentName, setAttachmentName] = React.useState("")
  const [attachmentUrl, setAttachmentUrl] = React.useState("")
  const [dependencyId, setDependencyId] = React.useState("")

  const save = async () => {
    if (!draft.title.trim() || saving) return
    setSaving(true)
    try {
      await updateProject({
        id: project.id,
        cards: project.cards.map((item) => item.id === draft.id ? draft : item),
      })
      toast.success("Card atualizado.")
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar card.")
    } finally {
      setSaving(false)
    }
  }

  const addChecklist = () => {
    const title = newChecklist.trim()
    if (!title) return
    setDraft((current) => ({
      ...current,
      checklist: [...(current.checklist || []), { id: crypto.randomUUID(), title, done: false }],
    }))
    setNewChecklist("")
  }

  const addComment = () => {
    const body = newComment.trim()
    if (!body) return
    const extracted = Array.from(body.matchAll(/@([\p{L}\p{N}._-]+)/gu)).map((match) => normalizeMention(match[1]))
    setDraft((current) => ({
      ...current,
      comments: [...(current.comments || []), {
        id: crypto.randomUUID(),
        author: user?.displayName || user?.username || "Usuário",
        body,
        createdAt: new Date().toISOString(),
      }],
      mentionedUsers: Array.from(new Set([...(current.mentionedUsers || []), ...extracted])),
    }))
    setNewComment("")
  }

  const addAttachment = () => {
    const name = attachmentName.trim()
    const url = attachmentUrl.trim()
    if (!name || !url) return
    try {
      const parsed = new URL(url)
      if (!["https:", "http:"].includes(parsed.protocol)) throw new Error("invalid")
    } catch {
      toast.error("Informe um link http(s) válido.")
      return
    }
    setDraft((current) => ({
      ...current,
      attachments: [...(current.attachments || []), { id: crypto.randomUUID(), name, url }],
    }))
    setAttachmentName("")
    setAttachmentUrl("")
  }

  const addDependency = () => {
    if (!dependencyId || dependencyId === draft.id) return
    setDraft((current) => ({
      ...current,
      dependencies: Array.from(new Set([...(current.dependencies || []), dependencyId])),
    }))
    setDependencyId("")
  }

  const dependencyCards = project.cards.filter((item) => item.id !== draft.id)
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className="w-full border-white/10 sm:max-w-2xl">
      <SheetHeader className="border-b border-border p-6">
        <SheetTitle className="text-xl font-semibold">Detalhes do card</SheetTitle>
        <SheetDescription>{project.name} · contexto, execução e histórico no mesmo card.</SheetDescription>
      </SheetHeader>
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título" className="sm:col-span-2"><Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })}/></Field>
            <Field label="Responsável"><Input value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })}/></Field>
            <Field label="Prazo"><Input type="date" value={draft.dueDate} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}/></Field>
            <Field label="Prioridade"><Select value={draft.priority} onValueChange={(value) => setDraft({ ...draft, priority: value as Priority })}><SelectTrigger className="w-full"><SelectValue/></SelectTrigger><SelectContent>{priorities.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Etapa"><Select value={draft.stageId} onValueChange={(value) => setDraft({ ...draft, stageId: value })}><SelectTrigger className="w-full"><SelectValue/></SelectTrigger><SelectContent>{project.stages.slice().sort((a,b) => a.order-b.order).map((stage) => <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Descrição" className="sm:col-span-2"><Textarea rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })}/></Field>
          </div>

          <Section icon={ListChecks} title="Checklist">
            <div className="space-y-2">{(draft.checklist || []).map((item) => <div key={item.id} className="flex items-center gap-2 rounded-lg border border-white/[.06] bg-black/15 p-2.5"><Checkbox checked={item.done} onCheckedChange={(checked) => setDraft((current) => ({ ...current, checklist: (current.checklist || []).map((entry) => entry.id === item.id ? { ...entry, done: checked === true } : entry) }))}/><span className={"min-w-0 flex-1 text-xs " + (item.done ? "text-zinc-600 line-through" : "text-zinc-300")}>{item.title}</span><Button variant="ghost" size="icon-xs" onClick={() => setDraft((current) => ({ ...current, checklist: (current.checklist || []).filter((entry) => entry.id !== item.id) }))}><Trash2/></Button></div>)}</div>
            <div className="mt-2 flex gap-2"><Input value={newChecklist} onChange={(event) => setNewChecklist(event.target.value)} placeholder="Novo item" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addChecklist() } }}/><Button variant="outline" onClick={addChecklist}><Plus/>Adicionar</Button></div>
          </Section>

          <Section icon={MessageSquareText} title="Comentários e @menções">
            <div className="space-y-2">{(draft.comments || []).map((comment) => <div key={comment.id} className="rounded-lg border border-white/[.06] bg-black/15 p-3"><div className="flex items-center gap-2 text-[10px] text-zinc-600"><AtSign className="size-3"/><span>{comment.author}</span><span>·</span><span>{new Date(comment.createdAt).toLocaleString("pt-BR")}</span></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-300">{comment.body}</p></div>)}</div>
            <Textarea className="mt-2" rows={3} value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="Escreva um comentário. Use @nome para mencionar."/>
            <Button className="mt-2" variant="outline" onClick={addComment}><MessageSquareText/>Adicionar comentário</Button>
          </Section>

          <Section icon={Paperclip} title="Anexos">
            <div className="space-y-2">{(draft.attachments || []).map((attachment) => <div key={attachment.id} className="flex items-center gap-2 rounded-lg border border-white/[.06] bg-black/15 p-2.5"><Link2 className="size-3.5 text-primary"/><a className="min-w-0 flex-1 truncate text-xs text-zinc-300 hover:text-primary" href={attachment.url} target="_blank" rel="noreferrer">{attachment.name}</a><Button variant="ghost" size="icon-xs" onClick={() => setDraft((current) => ({ ...current, attachments: (current.attachments || []).filter((entry) => entry.id !== attachment.id) }))}><Trash2/></Button></div>)}</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]"><Input value={attachmentName} onChange={(event) => setAttachmentName(event.target.value)} placeholder="Nome do arquivo"/><Input value={attachmentUrl} onChange={(event) => setAttachmentUrl(event.target.value)} placeholder="https://..."/><Button variant="outline" onClick={addAttachment}><Plus/></Button></div>
          </Section>

          <Section icon={Check} title="Dependências">
            <div className="flex flex-wrap gap-2">{(draft.dependencies || []).map((id) => { const dependency = project.cards.find((item) => item.id === id); return <button key={id} type="button" onClick={() => setDraft((current) => ({ ...current, dependencies: (current.dependencies || []).filter((entry) => entry !== id) }))} className="rounded-full border border-white/[.08] px-2.5 py-1 text-[10px] text-zinc-400 hover:border-red-400/30 hover:text-red-300">{dependency?.title || id} ×</button> })}</div>
            {dependencyCards.length ? <div className="mt-2 flex gap-2"><Select value={dependencyId} onValueChange={setDependencyId}><SelectTrigger className="min-w-0 flex-1"><SelectValue placeholder="Selecionar card bloqueador"/></SelectTrigger><SelectContent>{dependencyCards.filter((item) => !(draft.dependencies || []).includes(item.id)).map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={addDependency}><Plus/>Vincular</Button></div> : null}
          </Section>
        </div>
      </ScrollArea>
      <SheetFooter className="border-t border-border p-5">
        <div className="mr-auto text-[10px] text-zinc-600">Criado por {draft.createdBy || "registro legado"}</div>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        <Button onClick={() => void save()} disabled={saving || !draft.title.trim()}>{saving ? "Salvando..." : "Salvar card"}</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return <div className={"space-y-2 " + (className || "")}><Label className="text-[10px] uppercase tracking-[.14em] text-zinc-500">{label}</Label>{children}</div>
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-white/[.07] bg-white/[.015] p-4"><div className="mb-3 flex items-center gap-2"><Icon className="size-4 text-primary"/><h3 className="text-xs font-semibold">{title}</h3></div>{children}</section>
}
