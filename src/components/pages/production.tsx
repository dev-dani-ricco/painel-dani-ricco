"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus } from "lucide-react"
import { useDashboard } from "@/components/data-provider"
import { TaskSheet } from "@/components/entity-editors"
import { ModuleCover, SectionHeading, StatusBadge } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Task, TaskStatus } from "@/lib/types"

const columns: { title: string; status: TaskStatus; aliases?: TaskStatus[] }[] = [
  { title: "A iniciar", status: "A iniciar", aliases: ["Aguardando definição da Dani"] },
  { title: "Em produção", status: "Em produção" },
  { title: "Em aprovação", status: "Em aprovação" },
  { title: "Concluído", status: "Concluído" },
]

export function ProductionPage() {
  const { data, update } = useDashboard()
  const [editing, setEditing] = React.useState<Task | null>(null)
  const [open, setOpen] = React.useState(false)
  const [category, setCategory] = React.useState("all")
  const categories = Array.from(new Set(data.tasks.map((task) => task.category)))
  const visible = data.tasks.filter((task) => category === "all" || task.category === category)
  const progress = data.tasks.length ? Math.round((data.tasks.filter((task) => task.done || task.status === "Concluído").length / data.tasks.length) * 100) : 0
  const edit = (task?: Task) => { setEditing(task ?? null); setOpen(true) }
  const moveOrder = (task: Task, amount: number) => { const index = data.tasks.findIndex((item) => item.id === task.id); const target = index + amount; if (target < 0 || target >= data.tasks.length) return; const next = [...data.tasks]; [next[index], next[target]] = [next[target], next[index]]; update("tasks", next) }
  const setStatus = (task: Task, status: TaskStatus) => update("tasks", data.tasks.map((item) => item.id === task.id ? { ...item, status, done: status === "Concluído" } : item))

  return <div><ModuleCover number="03" title="Produção" description="Tudo o que precisa ser criado para o produto e a campanha." progress={progress}/><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><SectionHeading eyebrow="FLUXO DE TRABALHO" title="Produção do lançamento"/><div className="flex gap-2"><Select value={category} onValueChange={setCategory}><SelectTrigger className="w-48"><SelectValue placeholder="Categoria"/></SelectTrigger><SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{categories.map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent></Select><Button className="text-black" onClick={() => edit()}><Plus/>Adicionar tarefa</Button></div></div><div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">{columns.map((column) => { const items = visible.filter((task) => task.status === column.status || column.aliases?.includes(task.status)); return <section className="rounded-xl border border-white/[.07] bg-white/[.018] p-3" key={column.status}><div className="mb-3 flex items-center px-1 py-2"><span className={`mr-2 size-1.5 rounded-full ${column.status === "Em produção" ? "bg-primary" : "bg-zinc-700"}`}/><h3 className="text-xs font-semibold">{column.title}</h3><span className="ml-auto text-[10px] text-zinc-600">{items.length}</span></div><div className="space-y-3">{items.map((task) => <Card className="group border-white/[.08] bg-card py-0 transition hover:-translate-y-0.5 hover:border-white/20" key={task.id}><CardContent className="p-4"><div className="flex items-center"><StatusBadge status={task.priority}/><div className="ml-auto flex items-center text-zinc-700"><Button variant="ghost" size="icon-xs" onClick={() => moveOrder(task, -1)} aria-label="Mover para cima"><ArrowUp/></Button><Button variant="ghost" size="icon-xs" onClick={() => moveOrder(task, 1)} aria-label="Mover para baixo"><ArrowDown/></Button><GripVertical className="ml-1 size-3.5"/></div></div><button className="mt-4 block w-full text-left" onClick={() => edit(task)}><p className="text-sm font-semibold leading-5">{task.title}</p><p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-600">{task.category}</p></button><div className="mt-5 flex items-center gap-2"><Select value={task.status} onValueChange={(value) => setStatus(task, value as TaskStatus)}><SelectTrigger className="h-7 min-w-0 flex-1 border-white/[.08] bg-black/20 text-[10px]"><SelectValue/></SelectTrigger><SelectContent>{columns.map((item) => <SelectItem value={item.status} key={item.status}>{item.title}</SelectItem>)}<SelectItem value="Aguardando definição da Dani">Aguardando Dani</SelectItem></SelectContent></Select><Button variant="ghost" size="icon-sm" onClick={() => edit(task)} aria-label="Editar tarefa"><Pencil/></Button></div><div className="mt-4 flex justify-between text-[10px] text-zinc-600"><span>{task.owner}</span><span>{task.due}</span></div></CardContent></Card>)}{items.length === 0 && <div className="rounded-lg border border-dashed border-white/[.07] p-8 text-center text-[10px] text-zinc-700">Nenhuma tarefa</div>}</div></section>})}</div><TaskSheet open={open} onOpenChange={setOpen} task={editing}/></div>
}
