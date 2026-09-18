"use client"

import * as React from "react"
import { CalendarRange, ChevronLeft, ChevronRight, Clock3, Filter, Plus } from "lucide-react"
import { useDashboard } from "@/components/data-provider"
import { EventSheet, TaskSheet } from "@/components/entity-editors"
import { EmptyState, SectionHeading, StatusBadge } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { CalendarEvent, Task } from "@/lib/types"

const iso = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
const addDays = (value: Date, amount: number) => { const next = new Date(value); next.setDate(next.getDate() + amount); return next }
const mondayOf = (value: Date) => { const date = new Date(value); const day = date.getDay(); date.setDate(date.getDate() - (day === 0 ? 6 : day - 1)); return date }
const formatDay = (value: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(value).replace(".", "")
const weekdays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]

function eventOccursOn(event: CalendarEvent, day: Date) {
  const current = iso(day)
  return current >= event.date && current <= (event.endDate || event.date)
}

export function CalendarPage() {
  const { data, update } = useDashboard()
  const [view, setView] = React.useState<"week" | "month">("week")
  const [focusDate, setFocusDate] = React.useState(() => new Date("2026-09-21T12:00:00"))
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null)
  const [eventOpen, setEventOpen] = React.useState(false)
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [taskOpen, setTaskOpen] = React.useState(false)
  const [phase, setPhase] = React.useState("all")
  const [owner, setOwner] = React.useState("all")
  const [type, setType] = React.useState("all")
  const filteredEvents = data.events.filter((event) => (phase === "all" || event.phase === phase) && (owner === "all" || event.owner === owner) && (type === "all" || event.type === type))
  const weekStart = mondayOf(focusDate)
  const days = Array.from({ length: 5 }, (_, index) => addDays(weekStart, index))
  const today = iso(new Date())
  const pending = data.tasks.filter((task) => task.owner === "Dani Ricco" && !task.done)
  const openEvent = (event: CalendarEvent) => { setSelectedEvent(event); setEventOpen(true) }
  const newEvent = () => { setSelectedEvent(null); setEventOpen(true) }
  const openTask = (task: Task) => { setSelectedTask(task); setTaskOpen(true) }
  const toggleTask = (task: Task) => update("tasks", data.tasks.map((item) => item.id === task.id ? { ...item, done: !item.done, status: !item.done ? "Concluído" : "A iniciar" } : item))
  const move = (amount: number) => setFocusDate((current) => view === "week" ? addDays(current, amount * 7) : new Date(current.getFullYear(), current.getMonth() + amount, 1, 12))

  const phases = Array.from(new Set(data.events.map((event) => event.phase)))
  const owners = Array.from(new Set(data.events.map((event) => event.owner)))
  const types = Array.from(new Set(data.events.map((event) => event.type)))

  return <div className="space-y-6">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow">PLANEJAMENTO OPERACIONAL</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.035em]">Calendário do lançamento</h1><p className="mt-2 text-sm text-muted-foreground">Agenda, entregas e decisões da semana em um só lugar.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setFocusDate(new Date())}>Semana atual</Button><Button variant="outline" size="icon" onClick={() => move(-1)} aria-label="Anterior"><ChevronLeft/></Button><Button variant="outline" size="icon" onClick={() => move(1)} aria-label="Próximo"><ChevronRight/></Button><Button variant="outline" onClick={() => setView((current) => current === "week" ? "month" : "week")}><CalendarRange/>{view === "week" ? "Ver visão mensal" : "Ver agenda semanal"}</Button><Button className="text-black" onClick={newEvent}><Plus/>Novo evento</Button></div></div>
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[.08] bg-card p-3"><Filter className="ml-1 size-4 text-zinc-600"/><span className="mr-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Filtros</span><Select value={phase} onValueChange={setPhase}><SelectTrigger className="w-40"><SelectValue placeholder="Fase"/></SelectTrigger><SelectContent><SelectItem value="all">Todas as fases</SelectItem>{phases.map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent></Select><Select value={owner} onValueChange={setOwner}><SelectTrigger className="w-40"><SelectValue placeholder="Responsável"/></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{owners.map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent></Select><Select value={type} onValueChange={setType}><SelectTrigger className="w-40"><SelectValue placeholder="Tipo"/></SelectTrigger><SelectContent><SelectItem value="all">Todos os tipos</SelectItem>{types.map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent></Select></div>

    {view === "week" ? <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"><section><SectionHeading eyebrow="SEMANA" title={`${formatDay(days[0])} — ${formatDay(days[4])}`}/><div className="space-y-3">{days.map((day, index) => { const dayEvents = filteredEvents.filter((event) => eventOccursOn(event, day)); const isToday = iso(day) === today; return <Card className={cn("border-white/[.08] bg-card py-0", isToday && "border-primary/50")} key={iso(day)}><CardContent className="grid min-h-28 gap-4 p-4 sm:grid-cols-[120px_1fr] sm:p-5"><div className="border-b border-white/[.07] pb-3 sm:border-b-0 sm:border-r sm:pb-0"><div className="flex items-baseline gap-2 sm:block"><p className={cn("text-xs font-semibold", isToday && "text-primary")}>{weekdays[index]}</p><p className="mt-1 text-2xl font-semibold tracking-tight">{day.getDate().toString().padStart(2, "0")}</p></div><p className="mt-2 text-[10px] text-zinc-600">{day.toLocaleDateString("pt-BR", { month: "long" })}</p>{isToday && <StatusBadge status="Hoje" className="mt-3"/>}</div><div className="space-y-2">{dayEvents.length ? dayEvents.map((event) => <button className="flex w-full items-start gap-3 rounded-lg border border-white/[.08] bg-black/20 p-3 text-left transition hover:border-primary/30 hover:bg-white/[.03]" key={event.id} onClick={() => openEvent(event)}><div className="mt-0.5 flex min-w-12 items-center gap-1 text-[10px] text-zinc-500"><Clock3 className="size-3"/>{event.time}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{event.title}</p><div className="mt-2 flex flex-wrap gap-2"><StatusBadge status={event.type}/><StatusBadge status={event.status}/></div></div></button>) : <div className="flex h-full min-h-20 items-center justify-center rounded-lg border border-dashed border-white/[.07] text-xs text-zinc-700">Agenda livre</div>}</div></CardContent></Card>})}</div></section><aside><SectionHeading eyebrow="SUA SEMANA" title="Minhas pendências"/><Card className="border-white/[.08] bg-card py-0"><CardContent className="divide-y divide-white/[.07] p-0">{pending.map((task) => <div className="flex items-start gap-3 p-4" key={task.id}><Checkbox checked={task.done} onCheckedChange={() => toggleTask(task)} className="mt-0.5"/><button className="min-w-0 flex-1 text-left" onClick={() => openTask(task)}><p className="text-xs font-semibold leading-5">{task.title}</p><div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-600"><span>{task.due}</span><StatusBadge status={task.priority}/></div></button></div>)}</CardContent></Card></aside></div> : <MonthView focusDate={focusDate} events={filteredEvents} onEvent={openEvent} onCreate={(date) => { setFocusDate(date); newEvent() }}/>} 
    <EventSheet open={eventOpen} onOpenChange={setEventOpen} event={selectedEvent}/><TaskSheet open={taskOpen} onOpenChange={setTaskOpen} task={selectedTask}/>
  </div>
}

function MonthView({ focusDate, events, onEvent, onCreate }: { focusDate: Date; events: CalendarEvent[]; onEvent: (event: CalendarEvent) => void; onCreate: (date: Date) => void }) {
  const start = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1, 12)
  start.setDate(start.getDate() - start.getDay())
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index))
  const month = focusDate.getMonth()
  return <section><SectionHeading eyebrow="VISÃO MENSAL" title={focusDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}/><div className="overflow-hidden rounded-xl border border-white/[.08] bg-card"><div className="grid grid-cols-7 border-b border-white/[.08]">{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => <div className="p-3 text-center text-[10px] font-semibold uppercase tracking-widest text-zinc-600" key={day}>{day}</div>)}</div><div className="grid grid-cols-7">{days.map((day) => { const dayEvents = events.filter((event) => eventOccursOn(event, day)); return <div className={cn("min-h-28 border-b border-r border-white/[.06] p-2", day.getMonth() !== month && "opacity-35")} key={iso(day)}><button className="mb-2 flex size-6 items-center justify-center rounded-full text-[11px] text-zinc-500 hover:bg-white/10" onClick={() => onCreate(day)}>{day.getDate()}</button><div className="space-y-1">{dayEvents.slice(0,3).map((event) => <button className={cn("block w-full truncate rounded border border-white/[.07] bg-white/[.035] px-2 py-1.5 text-left text-[9px] font-semibold hover:border-primary/40", ["Data-chave", "Lançamento"].includes(event.status) && "border-primary/40 text-primary")} onClick={() => onEvent(event)} key={event.id}>{event.title}</button>)}{dayEvents.length > 3 && <p className="px-1 text-[9px] text-zinc-600">+{dayEvents.length - 3} eventos</p>}</div></div>})}</div></div>{events.length === 0 && <div className="mt-4"><EmptyState title="Nenhum evento com esses filtros" description="Ajuste os filtros ou crie um novo evento para este período."/></div>}</section>
}
