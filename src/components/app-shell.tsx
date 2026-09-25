"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell, BookOpen, Boxes, BrainCircuit, CalendarDays, ChartNoAxesColumnIncreasing, CheckSquare2, ChevronRight, Cloud, CloudOff, LoaderCircle,
  ClipboardList, FileText, FolderOpen, LayoutDashboard, LogOut, Menu, PackageCheck, Plus,
  Search, Settings, Sparkles, UserRound,
} from "lucide-react"
import { useDashboard } from "@/components/data-provider"
import { useAuth } from "@/components/auth-provider"
import { roleLabel } from "@/lib/auth-config"
import { TaskSheet } from "@/components/entity-editors"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export const navigation = [
  { href: "/", feature: "overview", title: "Visão Geral", short: "Visão Geral", icon: LayoutDashboard },
  { href: "/inteligencia", feature: "inteligencia", title: "Central de Inteligência", short: "Inteligência", icon: BrainCircuit },
  { href: "/calendario", feature: "calendario", title: "Calendário", short: "Calendário", icon: CalendarDays },
  { href: "/produto", feature: "produto", title: "Briefing 01 — Produto", short: "Produto", icon: FileText },
  { href: "/oferta", feature: "oferta", title: "Briefing 02 — Oferta", short: "Oferta", icon: Sparkles },
  { href: "/curso", feature: "curso", title: "Entrega do Curso", short: "Entrega do Curso", icon: BookOpen },
  { href: "/area-de-membros", feature: "area_de_membros", title: "Área de Membros", short: "Área de Membros", icon: Boxes },
  { href: "/producao", feature: "producao", title: "Briefing 03 — Produção", short: "Produção", icon: ClipboardList },
  { href: "/pre-lancamento", feature: "pre_lancamento", title: "Briefing 04 — Pré-Lançamento", short: "Pré-Lançamento", icon: CheckSquare2 },
  { href: "/lancamento", feature: "lancamento", title: "Briefing 05 — Lançamento", short: "Lançamento", icon: ChartNoAxesColumnIncreasing },
  { href: "/debriefing", feature: "debriefing", title: "Debriefing", short: "Debriefing", icon: PackageCheck },
  { href: "/materiais", feature: "materiais", title: "Central de Materiais", short: "Materiais", icon: FolderOpen },
  { href: "/configuracoes", feature: "configuracoes", title: "Configurações", short: "Configurações", icon: Settings },
] as const

function Brand({ progress }: { progress: number }) {
  return <div className="border-b border-sidebar-border px-5 py-6"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold tracking-[.2em]">DANI RICCO</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-[.18em] text-zinc-600">Painel de lançamento</p></div><div className="size-2 rounded-full bg-primary shadow-[0_0_14px_rgba(255,106,0,.6)]"/></div><div className="mt-5 flex items-center justify-between"><span className="text-[10px] text-zinc-500">Progresso geral</span><span className="text-[10px] font-semibold text-primary">{progress}%</span></div><Progress value={progress} className="mt-2 h-1 bg-white/[.06]" /></div>
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { progress } = useDashboard()
  const { user, has, logout } = useAuth()
  const visibleNavigation = navigation.filter((item) => has(item.feature))
  const initials = (user?.displayName || user?.username || "DR")
    .split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()

  return <div className="flex h-full flex-col bg-sidebar">
    <Brand progress={progress}/>
    <ScrollArea className="flex-1">
      <nav className="space-y-1 p-3">
        {visibleNavigation.map(({ href, title, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname === href
          return <Link href={href} onClick={onNavigate} key={href} className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium text-zinc-500 transition hover:bg-sidebar-accent hover:text-zinc-200",
            active && "bg-sidebar-accent text-white",
          )}>
            <Icon className={cn("size-4 text-zinc-600", active && "text-primary")}/>
            <span>{title}</span>
            {active && <span className="ml-auto size-1 rounded-full bg-primary"/>}
          </Link>
        })}
      </nav>
    </ScrollArea>
    <div className="border-t border-sidebar-border p-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-8 border border-white/10"><AvatarFallback className="bg-[#222] text-[10px]">{initials}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{user?.displayName || user?.username || "Usuário"}</p>
          <p className="text-[10px] text-zinc-600">{user ? roleLabel(user.role) : "Carregando..."}</p>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={() => void logout()} title="Sair"><LogOut/></Button>
      </div>
    </div>
  </div>
}

function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data } = useDashboard()
  const { has } = useAuth()
  const router = useRouter()
  const go = (href: string) => { router.push(href); onOpenChange(false) }
  const visiblePages = navigation.filter((item) => has(item.feature))
  return <CommandDialog open={open} onOpenChange={onOpenChange} title="Busca global" description="Busque em todo o painel" showCloseButton><CommandInput placeholder="Busque tarefas, eventos, aulas ou materiais..."/><CommandList><CommandEmpty>Nenhum resultado encontrado.</CommandEmpty><CommandGroup heading="Páginas">{visiblePages.map((item) => <CommandItem key={item.href} value={`${item.title} ${item.short}`} onSelect={() => go(item.href)}><item.icon/>{item.title}</CommandItem>)}</CommandGroup>{has("producao") && <CommandGroup heading="Tarefas">{data.tasks.map((item) => <CommandItem key={item.id} value={`${item.title} ${item.category} ${item.owner}`} onSelect={() => go("/producao")}><CheckSquare2/><span className="truncate">{item.title}</span></CommandItem>)}</CommandGroup>}<CommandGroup heading="Eventos e aulas">{has("calendario") && data.events.map((item) => <CommandItem key={item.id} value={`${item.title} ${item.type} ${item.phase}`} onSelect={() => go("/calendario")}><CalendarDays/><span className="truncate">{item.title}</span></CommandItem>)}{has("curso") && data.lessons.map((item) => <CommandItem key={item.id} value={`${item.name} ${item.module}`} onSelect={() => go("/curso")}><BookOpen/><span className="truncate">{item.name}</span></CommandItem>)}</CommandGroup>{has("materiais") && <CommandGroup heading="Materiais">{data.materials.map((item) => <CommandItem key={item.id} value={`${item.name} ${item.description}`} onSelect={() => go("/materiais")}><FolderOpen/><span className="truncate">{item.name}</span></CommandItem>)}</CommandGroup>}</CommandList></CommandDialog>
}

function DashboardShell({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const { data, progress, syncStatus } = useDashboard()
  const { user } = useAuth()
  const [taskOpen, setTaskOpen] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const page = navigation.find((item) => item.href === pathname) ?? navigation[0]

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true) } }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const SyncIcon = syncStatus === "saving" || syncStatus === "loading" ? LoaderCircle : syncStatus === "saved" ? Cloud : CloudOff
  const syncLabel = syncStatus === "saved" ? "Sincronizado" : syncStatus === "saving" ? "Salvando" : syncStatus === "loading" ? "Conectando" : "Modo offline"
  return <div className="min-h-screen bg-background"><aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] border-r border-sidebar-border lg:block"><SidebarContent/></aside><div className="lg:pl-[272px]"><header className="sticky top-0 z-30 border-b border-white/[.07] bg-background/90 backdrop-blur-xl"><div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8"><Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden"><Menu/></Button></SheetTrigger><SheetContent side="left" className="w-[286px] border-sidebar-border p-0"><SheetTitle className="sr-only">Navegação</SheetTitle><SidebarContent onNavigate={() => setMobileOpen(false)}/></SheetContent></Sheet><div className="min-w-0"><div className="flex items-center gap-1 text-[10px] text-zinc-600"><span>Painel</span><ChevronRight className="size-3"/><span className="truncate text-zinc-400">{page.short}</span></div><p className="mt-0.5 truncate text-sm font-semibold">{data.product.name}</p></div><Badge variant="outline" className="hidden rounded-full border-primary/30 bg-primary/[.08] text-[10px] text-primary sm:inline-flex">{data.product.status}</Badge><div className="ml-auto hidden w-28 items-center gap-2 xl:flex"><Progress value={progress} className="h-1 bg-white/[.08]"/><span className="text-[10px] text-zinc-500">{progress}%</span></div><div className="hidden items-center gap-1.5 text-[10px] text-zinc-500 xl:flex" title="Status da sincronização"><SyncIcon className={cn("size-3.5", syncStatus === "saved" && "text-primary", (syncStatus === "saving" || syncStatus === "loading") && "animate-spin text-zinc-400")} /><span>{syncLabel}</span></div><Button variant="outline" size="icon" onClick={() => setSearchOpen(true)} aria-label="Abrir busca"><Search/></Button><Popover><PopoverTrigger asChild><Button variant="outline" size="icon" className="relative" aria-label="Notificações"><Bell/><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary"/></Button></PopoverTrigger><PopoverContent align="end" className="w-80 border-white/10 p-0"><div className="border-b border-border p-4"><p className="text-sm font-semibold">Notificações</p><p className="mt-1 text-xs text-muted-foreground">3 itens precisam da sua atenção.</p></div><div className="space-y-1 p-2">{data.tasks.filter((item) => item.owner === "Dani Ricco" && !item.done).slice(0,3).map((item) => <Link href="/producao" className="block rounded-lg p-3 text-xs hover:bg-muted" key={item.id}><p className="font-medium">{item.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.due} · {item.priority}</p></Link>)}</div></PopoverContent></Popover><div className="hidden items-center gap-2 2xl:flex"><UserRound className="size-4 text-zinc-600"/><span className="text-xs font-medium">{user?.displayName || user?.username || "Usuário"}</span></div><Button className="hidden h-9 bg-primary px-4 text-xs text-black hover:bg-primary/90 sm:inline-flex" onClick={() => setTaskOpen(true)}><Plus/>Adicionar tarefa</Button><Button size="icon" className="bg-primary text-black sm:hidden" onClick={() => setTaskOpen(true)} aria-label="Adicionar tarefa"><Plus/></Button></div><Progress value={progress} className="h-[2px] rounded-none bg-transparent xl:hidden"/></header><main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main></div><TaskSheet open={taskOpen} onOpenChange={setTaskOpen}/><GlobalSearch open={searchOpen} onOpenChange={setSearchOpen}/></div>
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const publicHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "daniricco.com.br" ||
      window.location.hostname === "www.daniricco.com.br" ||
      window.location.hostname === "bio.daniricco.com.br")
  const publicRoute = pathname.startsWith("/site") || pathname.startsWith("/bio") || pathname.startsWith("/login") || pathname.startsWith("/sem-acesso") || publicHost

  if (publicRoute) return <>{children}</>
  return <DashboardShell pathname={pathname}>{children}</DashboardShell>
}