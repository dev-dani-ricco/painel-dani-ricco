"use client"

import * as React from "react"
import { ArrowRight, Inbox, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const active = ["Em produção", "Em aprovação", "Em preparação", "Data-chave", "Alta"].includes(status)
  const done = ["Concluído", "Pronta", "Confirmado"].includes(status)
  return <Badge variant="outline" className={cn("rounded-full border-white/10 bg-white/[.03] px-2.5 py-1 text-[10px] font-semibold text-zinc-400", active && "border-primary/30 bg-primary/10 text-primary", done && "text-zinc-200", className)}>{status}</Badge>
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-5"><div>{eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}<h2 className="text-xl font-semibold tracking-[-.02em] sm:text-2xl">{title}</h2></div>{action}</div>
}

export function MetricCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return <Card className="border-white/[.08] bg-card py-0"><CardContent className="p-5 sm:p-6"><p className="eyebrow">{label}</p><div className="mt-4 text-2xl font-semibold tracking-[-.03em] sm:text-3xl">{value}</div>{hint && <p className="mt-2 text-sm leading-5 text-muted-foreground">{hint}</p>}</CardContent></Card>
}

export function ModuleCover({ number, title, description, progress }: { number?: string; title: string; description: string; progress: number }) {
  return (
    <section className="relative mb-8 overflow-hidden rounded-2xl border border-white/10 bg-[#141414] p-6 sm:p-8 lg:p-10">
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_78%_14%,rgba(245,245,245,.17),transparent_22%),linear-gradient(125deg,transparent_56%,rgba(255,255,255,.05)_56%,rgba(255,255,255,.05)_57%,transparent_57%)]" />
      <div className="absolute -right-12 -top-24 h-72 w-72 rotate-12 rounded-[40%] border border-white/10 bg-white/[.025]" />
      <div className="relative flex min-h-44 flex-col justify-between gap-10 sm:min-h-52">
        <div className="flex items-start justify-between"><p className="eyebrow text-zinc-400">PAINEL DE LANÇAMENTO</p>{number && <span className="text-7xl font-bold leading-none tracking-[-.08em] text-white/[.08] sm:text-8xl">{number}</span>}</div>
        <div className="max-w-3xl"><div className="mb-5 h-1 w-12 bg-primary"/><h1 className="text-3xl font-semibold tracking-[-.035em] sm:text-4xl lg:text-[2.75rem]">{title}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base sm:leading-7">{description}</p><div className="mt-6 flex items-center gap-3"><Progress value={progress} className="h-1.5 max-w-xs bg-white/[.08]"/><span className="text-xs font-semibold text-primary">{progress}%</span></div></div>
      </div>
    </section>
  )
}

export function EmptyState({ title, description, onAdd }: { title: string; description: string; onAdd?: () => void }) {
  return <Card className="border-dashed border-white/10 bg-transparent py-0"><CardContent className="flex min-h-56 flex-col items-center justify-center p-8 text-center sm:p-10"><span className="mb-5 flex size-11 items-center justify-center rounded-full border border-white/10 bg-card"><Inbox className="size-4 text-zinc-500" /></span><h3 className="text-base font-semibold">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>{onAdd && <Button size="sm" variant="outline" className="mt-5" onClick={onAdd}><Plus />Adicionar item</Button>}</CardContent></Card>
}

export type EditorField = { key: string; label: string; type?: "text" | "textarea" | "date" | "url"; options?: string[]; placeholder?: string }

type RecordEditorProps = {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; record: Record<string, string>; fields: EditorField[]; onSave: (record: Record<string, string>) => void; onDelete?: () => void
}

export function RecordEditorDialog(props: RecordEditorProps) {
  if (!props.open) return null
  return <RecordEditorForm key={props.record.id ?? props.title} {...props}/>
}

function RecordEditorForm({ open, onOpenChange, title, description, record, fields, onSave, onDelete }: RecordEditorProps) {
  const [draft, setDraft] = React.useState(record)
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[88dvh] overflow-y-auto border-white/10 sm:max-w-2xl"><DialogHeader><DialogTitle className="text-xl">{title}</DialogTitle>{description && <DialogDescription>{description}</DialogDescription>}</DialogHeader><div className="grid gap-5 py-3 sm:grid-cols-2">{fields.map((field) => {
    const fieldId = `record-editor-${field.key}`
    return <div className={cn("space-y-2", field.type === "textarea" && "sm:col-span-2")} key={field.key}><Label htmlFor={field.options ? undefined : fieldId} className="eyebrow">{field.label}</Label>{field.options ? <Select value={draft[field.key] ?? ""} onValueChange={(value) => setDraft({ ...draft, [field.key]: value })}><SelectTrigger className="w-full" aria-label={field.label}><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent>{field.options.map((option) => <SelectItem value={option} key={option}>{option}</SelectItem>)}</SelectContent></Select> : field.type === "textarea" ? <Textarea id={fieldId} rows={4} value={draft[field.key] ?? ""} onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })} placeholder={field.placeholder}/> : <Input id={fieldId} type={field.type === "url" ? "url" : field.type === "date" ? "date" : "text"} value={draft[field.key] ?? ""} onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })} placeholder={field.placeholder}/>}</div>
  })}</div><DialogFooter className="gap-2">{onDelete && <Button variant="destructive" className="mr-auto" onClick={onDelete}><Trash2 />Excluir</Button>}<Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={() => onSave(draft)}>Salvar alterações</Button></DialogFooter></DialogContent></Dialog>
}

export function StrategicFields({ values, onChange, columns = 2 }: { values: Record<string, string>; onChange: (key: string, value: string) => void; columns?: 1 | 2 }) {
  return <div className={cn("grid gap-5", columns === 2 && "lg:grid-cols-2")}>{Object.entries(values).map(([key, value], index) => {
    const fieldId = `strategic-field-${index}`
    return <Card className="border-white/[.08] bg-card py-0" key={key}><CardContent className="p-5"><Label htmlFor={fieldId} className="eyebrow">{key}</Label><Textarea id={fieldId} className="mt-3 min-h-28 resize-y border-white/10 bg-black/20 leading-6" value={value} onChange={(event) => onChange(key, event.target.value)} placeholder={`Preencha ${key.toLocaleLowerCase("pt-BR")}`} /></CardContent></Card>
  })}</div>
}

export function TextLink({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <Button variant="ghost" className="h-auto min-h-0 p-0 text-sm text-zinc-400 hover:bg-transparent hover:text-white" onClick={onClick}>{children}<ArrowRight /></Button>
}
