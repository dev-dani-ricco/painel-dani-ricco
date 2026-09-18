"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CalendarDays, Check, Circle, Clock3, Flag, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useDashboard } from "@/components/data-provider"
import { TaskSheet } from "@/components/entity-editors"
import { MetricCard, SectionHeading, StatusBadge, TextLink } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import type { Task } from "@/lib/types"

const phases = ["Produto", "Oferta", "Produção", "Pré-Lançamento", "Lançamento", "Debriefing"]
const milestones = [["19/09", "Último Workshop Imagem que Vende de 2026"], ["26/09", "Início da campanha de antecipação e Lista VIP"], ["26/10", "Intensificação da campanha"], ["06/11", "Lançamento oficial e abertura do carrinho"]]

export function OverviewPage() {
  const router = useRouter()
  const { data, progress, update } = useDashboard()
  const [selected, setSelected] = React.useState<Task | null>(null)
  const [taskOpen, setTaskOpen] = React.useState(false)
  const focusTitles = ["Validar estrutura e módulos do curso", "Definir dois dias de gravação", "Aprovar linha editorial da campanha", "Enviar provas e depoimentos do Workshop Imagem que Vende"]
  const focus = focusTitles.map((title) => data.tasks.find((task) => task.title === title)).filter(Boolean) as Task[]
  const approvals = data.tasks.filter((task) => task.status === "Em aprovação")
  const inProgress = data.tasks.filter((task) => !task.done && task.status !== "A iniciar").length
  const toggle = (task: Task) => update("tasks", data.tasks.map((item) => item.id === task.id ? { ...item, done: !item.done, status: !item.done ? "Concluído" : "A iniciar" } : item))
  const open = (task: Task) => { setSelected(task); setTaskOpen(true) }
  const approve = (task: Task) => { update("tasks", data.tasks.map((item) => item.id === task.id ? { ...item, done: true, status: "Concluído" } : item)); toast.success("Material aprovado.") }

  return <div className="space-y-8">
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-card p-6 sm:p-8 lg:p-10">
      <div className="absolute inset-y-0 right-0 hidden w-2/5 lg:block [background-image:radial-gradient(circle_at_70%_30%,rgba(255,106,0,.12),transparent_27%),linear-gradient(135deg,transparent_45%,rgba(255,255,255,.04)_45%,rgba(255,255,255,.04)_46%,transparent_46%)]"/>
      <div className="relative max-w-3xl"><div className="flex flex-wrap items-center gap-3"><p className="eyebrow">PRODUTO DIGITAL · 2026</p><StatusBadge status={data.product.status}/></div><h1 className="mt-6 text-4xl font-semibold tracking-[-.045em] sm:text-5xl lg:text-6xl">{data.product.name}</h1><p className="mt-3 text-base font-medium text-primary sm:text-lg">{data.product.concept}</p><p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-400">{data.product.description}</p><div className="mt-8 flex flex-wrap items-center gap-3"><Button className="h-10 px-4 text-xs text-black" onClick={() => router.push("/calendario")}><CalendarDays/>Ver calendário</Button><div className="ml-0 min-w-52 flex-1 sm:ml-3 sm:max-w-xs"><div className="mb-2 flex justify-between text-[10px]"><span className="text-zinc-500">Progresso geral</span><span className="font-semibold text-primary">{progress}%</span></div><Progress value={progress} className="h-1.5 bg-white/[.08]"/></div></div></div>
      <div className="relative mt-10 flex flex-wrap items-center gap-3 border-t border-white/[.07] pt-5 text-xs"><Flag className="size-4 text-primary"/><span className="text-zinc-500">Próxima data-chave</span><span className="font-semibold">19 de setembro · Workshop Imagem que Vende</span></div>
    </section>

    <section><SectionHeading eyebrow="LEITURA RÁPIDA" title="Hoje no lançamento"/><div className="grid grid-cols-2 gap-3 lg:grid-cols-5"><MetricCard label="Etapa atual" value="Produção" hint="Fase 03 de 06"/><MetricCard label="Próxima entrega" value="28/08" hint="Estrutura do curso"/><MetricCard label="Em andamento" value={inProgress}/><MetricCard label="Aprovações" value={approvals.length}/><MetricCard label="Progresso geral" value={`${progress}%`}/></div></section>

    <div className="grid gap-8 xl:grid-cols-[1.55fr_.85fr]">
      <section><SectionHeading eyebrow="PRIORIDADES" title="Foco da Dani agora" action={<TextLink onClick={() => router.push("/producao")}>Ver produção</TextLink>}/><Card className="border-white/[.08] bg-card py-0"><CardContent className="divide-y divide-white/[.07] p-0">{focus.map((task) => <div className="group flex items-start gap-3 p-4 sm:items-center sm:p-5" key={task.id}><Checkbox checked={task.done} onCheckedChange={() => toggle(task)} className="mt-0.5 sm:mt-0"/><button className="min-w-0 flex-1 text-left" onClick={() => open(task)}><p className="text-sm font-semibold leading-5 group-hover:text-primary">{task.title}</p><div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-zinc-600"><Clock3 className="size-3"/><span>{task.due}</span><StatusBadge status={task.status}/></div></button><Button variant="ghost" size="icon-sm" onClick={() => open(task)} aria-label="Abrir tarefa"><ArrowRight/></Button></div>)}</CardContent></Card></section>
      <section><SectionHeading eyebrow="APROVAÇÕES" title="Aguardando sua aprovação"/><div className="space-y-3">{approvals.slice(0,4).map((task) => <Card className="border-white/[.08] bg-card py-0" key={task.id}><CardContent className="p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold leading-5">{task.title}</p><p className="mt-2 text-[10px] text-zinc-600">{task.owner} · {task.due}</p></div><Sparkles className="size-4 shrink-0 text-primary"/></div><div className="mt-4 flex gap-2"><Button size="sm" onClick={() => approve(task)}><Check/>Aprovar</Button><Button size="sm" variant="outline" onClick={() => { open(task); toast.info("Registre o ajuste nas observações.") }}>Solicitar ajuste</Button></div></CardContent></Card>)}{approvals.length === 0 && <Card className="border-dashed bg-transparent py-0"><CardContent className="p-8 text-center text-xs text-zinc-500">Tudo aprovado por aqui.</CardContent></Card>}</div></section>
    </div>

    <section><SectionHeading eyebrow="JORNADA" title="Fases do lançamento"/><div className="overflow-x-auto rounded-xl border border-white/[.08] bg-card p-5"><div className="flex min-w-[760px] items-center">{phases.map((phase, index) => <React.Fragment key={phase}><div className="flex min-w-24 flex-col items-center text-center"><span className={`flex size-8 items-center justify-center rounded-full border text-[10px] font-semibold ${index < 3 ? "border-primary bg-primary text-black" : "border-white/10 text-zinc-600"}`}>{index < 3 ? <Check className="size-3.5"/> : `0${index + 1}`}</span><span className={`mt-3 text-[11px] font-semibold ${index === 2 ? "text-primary" : "text-zinc-500"}`}>{phase}</span></div>{index < phases.length - 1 && <div className={`h-px flex-1 ${index < 2 ? "bg-primary" : "bg-white/10"}`}/>}</React.Fragment>)}</div></div></section>
    <section><SectionHeading eyebrow="AGENDA ESTRATÉGICA" title="Próximos marcos"/><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{milestones.map(([date, title], index) => <Card className="group border-white/[.08] bg-card py-0 transition hover:-translate-y-0.5 hover:border-primary/30" key={date}><CardContent className="p-5"><div className="flex items-center justify-between"><span className="text-xl font-semibold text-primary">{date}</span><Circle className="size-2 fill-current text-zinc-700"/></div><p className="mt-7 text-sm font-semibold leading-5">{title}</p><p className="mt-3 text-[10px] uppercase tracking-widest text-zinc-600">MARCO 0{index + 1}</p></CardContent></Card>)}</div></section>
    <TaskSheet open={taskOpen} onOpenChange={setTaskOpen} task={selected}/>
  </div>
}
