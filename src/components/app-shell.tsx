"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell, BookOpen, Boxes, BrainCircuit, CalendarDays, ChartNoAxesColumnIncreasing, CheckSquare2, ChevronDown, ChevronRight, Cloud, CloudOff, LoaderCircle,
  ClipboardList, FileText, FolderOpen, KeyRound, LayoutDashboard, LogOut, Menu, PackageCheck, Plus,
  Search, Settings, Sparkles, UserRound,
} from "lucide-react"
import { useDashboard } from "@/components/data-provider"
import { useAuth } from "@/components/auth-provider"
import { roleLabel } from "@/lib/auth-config"
import { TaskSheet } from "@/components/entity-editors"
import { ProjectSwitcher } from "@/components/project-switcher"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DEFAULT_PROJECT_ID } from "@/lib/project-data"
import { cn } from "@/lib/utils"

export const navigation = [
  { href: "/", feature: "overview", group: "platform", title: "Visão Geral", short: "Visão Geral", icon: LayoutDashboard },
  { href: "/calendario", feature: "calendario", group: "platform", title: "Calendário", short: "Calendário", icon: CalendarDays },
  { href: "/minhas-tarefas", feature: "minhas_tarefas", group: "platform", title: "Minhas Tarefas", short: "Tarefas", icon: CheckSquare2 },
  { href: "/inteligencia", feature: "inteligencia", group: "platform", title: "Central de Inteligência", short: "Inteligência", icon: BrainCircuit },
  { href: "/projetos", feature: "projetos", group: "project", title: "Quadro do Projeto", short: "Kanban", icon: Boxes },
  { href: "/produto", feature: "produto", group: "project", title: "Briefing 01 — Produto", short: "Produto", icon: FileText },
  { href: "/oferta", feature: "oferta", group: "project", title: "Briefing 02 — Oferta", short: "Oferta", icon: Sparkles },
  { href: "/curso", feature: "curso", group: "project", title: "Entrega do Curso", short: "Entrega do Curso", icon: BookOpen },
  { href: "/area-de-membros", feature: "area_de_membros", group: "project", title: "Área de Membros", short: "Área de Membros", icon: Boxes },
  { href: "/producao", feature: "producao", group: "project", title: "Briefing 03 — Produção", short: "Produção", icon: ClipboardList },
  { href: "/pre-lancamento", feature: "pre_lancamento", group: "project", title: "Briefing 04 — Pré-Lançamento", short: "Pré-Lançamento", icon: CheckSquare2 },
  { href: "/lancamento", feature: "lancamento", group: "project", title: "Briefing 05 — Lançamento", short: "Lançamento", icon: ChartNoAxesColumnIncreasing },
  { href: "/debriefing", feature: "debriefing", group: "project", title: "Debriefing", short: "Debriefing", icon: PackageCheck },
  { href: "/materiais", feature: "materiais", group: "project", title: "Central de Materiais", short: "Materiais", icon: FolderOpen },
  { href: "/configuracoes", feature: "configuracoes", group: "admin", title: "Configurações", short: "Configurações", icon: Settings },
] as const

function Brand({ progress }: { progress?: number }) {
  return <div className="border-b border-sidebar-border px-5 py-5">
    <div className="flex items-center justify-between gap-3">
      <Image src="/dani/logo-branca.png" alt="Dani Ricco" width={150} height={50} className="h-auto w-[118px] object-contain" priority unoptimized/>
      <div className="text-right">
        <p className="impar-serif text-[18px] leading-none tracking-[.08em] text-zinc-200">IMPAR®</p>
        <div className="mt-2 ml-auto size-2 rounded-full bg-primary shadow-[0_0_14px_rgba(255,106,0,.6)]"/>
      </div>
    </div>
    <p className="mt-3 text-[8px] font-semibold uppercase tracking-[.2em] text-zinc-700">Plataforma de gestão</p>
    {typeof progress === "number" ? <>
      <div className="mt-4 flex items-center justify-between"><span className="text-[10px] text-zinc-500">Progresso do projeto</span><span className="text-[10px] font-semibold text-primary">{progress}%</span></div>
      <Progress value={progress} className="mt-2 h-1 bg-white/[.06]"/>
    </> : <div className="mt-4 flex items-center gap-2 text-[9px] text-zinc-600"><span className="size-1.5 rounded-full bg-primary"/>Ecossistema de marketing</div>}
  </div>
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { progress, activeProject } = useDashboard()
  const { user, has, logout } = useAuth()
  const visibleNavigation = navigation.filter((item) => has(item.feature))
  const platformItems = visibleNavigation.filter((item) => item.group === "platform")
  const allProjectItems = visibleNavigation.filter((item) => item.group === "project")
  const adminItems = visibleNavigation.filter((item) => item.group === "admin")
  const inProjectContext = pathname === "/projetos" || allProjectItems.some((item) => item.href === pathname)
  const legacyProject = activeProject?.id === DEFAULT_PROJECT_ID
  const projectItems = inProjectContext
    ? (legacyProject ? allProjectItems : allProjectItems.filter((item) => item.feature === "projetos"))
    : allProjectItems.filter((item) => item.feature === "projetos")
  const [projectExpanded, setProjectExpanded] = React.useState(inProjectContext)

  const initials = (user?.displayName || user?.username || "DR")
    .split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()

  const links = (items: typeof visibleNavigation, inset = false) => items.map(({ href, title, icon: Icon }) => {
    const active = href === "/" ? pathname === "/" : pathname === href
    return <Link href={href} onClick={onNavigate} key={href} className={cn(
      "group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium text-zinc-500 transition hover:bg-sidebar-accent hover:text-zinc-200",
      inset && "ml-2 border-l border-white/[.06] pl-4",
      active && "bg-sidebar-accent text-white",
    )}>
      <Icon className={cn("size-4 shrink-0 text-zinc-600", active && "text-primary")}/>
      <span className="min-w-0 flex-1 leading-4">{title}</span>
      {active && <span className="ml-auto size-1 shrink-0 rounded-full bg-primary"/>}
    </Link>
  })

  return <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-sidebar">
    <Brand progress={inProjectContext ? progress : undefined}/>
    <ScrollArea className="min-h-0 flex-1">
      <nav className="space-y-6 p-3 pb-7">
        {platformItems.length > 0 && <section><p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[.18em] text-zinc-700">Plataforma</p><div className="space-y-1">{links(platformItems)}</div></section>}
        {allProjectItems.length > 0 && <section>
          <p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[.18em] text-zinc-700">Projeto</p>
          <div className="overflow-hidden rounded-xl border border-white/[.08] bg-white/[.02]">
            <button
              type="button"
              onClick={() => setProjectExpanded((current) => !current)}
              className="flex w-full items-center gap-2 px-3 py-3 text-left transition hover:bg-white/[.025]"
            >
              <FolderOpen className="size-3.5 shrink-0 text-primary"/>
              <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-zinc-200">
                {inProjectContext ? (activeProject?.name || "Carregando projeto…") : "Projetos"}
              </span>
              <ChevronDown className={cn("size-3.5 shrink-0 text-zinc-600 transition-transform", projectExpanded && "rotate-180")}/>
            </button>
            {projectExpanded ? <div className="border-t border-white/[.06] p-2">
              <ProjectSwitcher compact onNavigate={onNavigate}/>
              <div className="mt-2 space-y-1">{links(projectItems)}</div>
              {inProjectContext && !legacyProject && activeProject?.stages.length ? <div className="mt-3 border-t border-white/[.05] pt-2">
                <p className="px-2 pb-1.5 text-[8px] font-semibold uppercase tracking-[.16em] text-zinc-700">Etapas</p>
                {activeProject.stages
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((stage) => <Link
                    key={stage.id}
                    href={"/projetos#stage-" + stage.id}
                    onClick={onNavigate}
                    className="flex min-h-8 items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-zinc-600 transition hover:bg-sidebar-accent hover:text-zinc-300"
                  >
                    <span className="grid size-5 shrink-0 place-items-center rounded-md border border-white/[.06] text-[8px] text-zinc-700">
                      {String(stage.order).padStart(2, "0")}
                    </span>
                    <span className="truncate">{stage.name}</span>
                  </Link>)}
              </div> : null}
            </div> : null}
          </div>
        </section>}
        {adminItems.length > 0 && <section><p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[.18em] text-zinc-700">Administração</p><div className="space-y-1">{links(adminItems)}</div></section>}
      </nav>
    </ScrollArea>
    <div className="shrink-0 border-t border-sidebar-border bg-sidebar p-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-8 shrink-0 border border-white/10"><AvatarFallback className="bg-[#222] text-[10px]">{initials}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{user?.displayName || user?.username || "Usuário"}</p>
          <p className="truncate text-[10px] text-zinc-600">{user ? roleLabel(user.role) : "Carregando..."}</p>
        </div>
        <Button variant="ghost" size="icon-xs" asChild title="Alterar minha senha"><Link href="/alterar-senha"><KeyRound/></Link></Button>
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
  const { data, progress, syncStatus, activeProject } = useDashboard()
  const { user } = useAuth()
  const [taskOpen, setTaskOpen] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const page = navigation.find((item) => item.href === pathname) ?? navigation[0]
  const projectRoutes = navigation.filter((item) => item.group === "project")
  const inProjectContext = pathname === "/projetos" || projectRoutes.some((item) => item.href === pathname)
  const topTitle = pathname === "/"
    ? "Central da Dani"
    : inProjectContext
      ? activeProject?.name || data.product.name
      : page.title

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true) } }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const SyncIcon = syncStatus === "saving" || syncStatus === "loading" ? LoaderCircle : syncStatus === "saved" ? Cloud : CloudOff
  const syncLabel = syncStatus === "saved" ? "Sincronizado" : syncStatus === "saving" ? "Salvando" : syncStatus === "loading" ? "Conectando" : "Modo offline"
  return <div className="min-h-screen overflow-x-hidden bg-background"><aside className="fixed inset-y-0 left-0 z-40 hidden h-dvh w-[272px] overflow-hidden border-r border-sidebar-border lg:block"><SidebarContent key={pathname}/></aside><div className="min-w-0 lg:pl-[272px]"><header className="fixed inset-x-0 top-0 z-30 border-b border-white/[.07] bg-background/95 backdrop-blur-xl lg:left-[272px]"><div className="flex h-16 min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8"><Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label="Abrir menu"><Menu/></Button></SheetTrigger><SheetContent side="left" className="h-dvh max-h-dvh w-[min(92vw,320px)] overflow-hidden border-sidebar-border p-0"><SheetTitle className="sr-only">Navegação</SheetTitle><SidebarContent key={"mobile-" + pathname} onNavigate={() => setMobileOpen(false)}/></SheetContent></Sheet><div className="min-w-0 flex-1 sm:flex-none"><div className="flex min-w-0 items-center gap-1 text-[10px] text-zinc-600"><span className="hidden min-[420px]:inline">Painel</span><ChevronRight className="hidden size-3 min-[420px]:block"/><span className="truncate text-zinc-400">{page.short}</span></div><p className="mt-0.5 max-w-[42vw] truncate text-sm font-semibold sm:max-w-[300px] lg:max-w-[360px]">{topTitle}</p></div>{inProjectContext && activeProject?.status ? <Badge variant="outline" className="hidden shrink-0 rounded-full border-primary/30 bg-primary/[.08] text-[10px] text-primary md:inline-flex">{activeProject.status}</Badge> : null}{inProjectContext ? <div className="ml-auto hidden w-28 items-center gap-2 xl:flex"><Progress value={progress} className="h-1 bg-white/[.08]"/><span className="text-[10px] text-zinc-500">{progress}%</span></div> : <div className="ml-auto"/>}<div className="hidden items-center gap-1.5 text-[10px] text-zinc-500 xl:flex" title="Status da sincronização"><SyncIcon className={cn("size-3.5", syncStatus === "saved" && "text-primary", (syncStatus === "saving" || syncStatus === "loading") && "animate-spin text-zinc-400")} /><span>{syncLabel}</span></div><Button variant="outline" size="icon" className="shrink-0" onClick={() => setSearchOpen(true)} aria-label="Abrir busca"><Search/></Button><Popover><PopoverTrigger asChild><Button variant="outline" size="icon" className="relative" aria-label="Notificações"><Bell/><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary"/></Button></PopoverTrigger><PopoverContent align="end" className="w-80 border-white/10 p-0"><div className="border-b border-border p-4"><p className="text-sm font-semibold">Notificações</p><p className="mt-1 text-xs text-muted-foreground">3 itens precisam da sua atenção.</p></div><div className="space-y-1 p-2">{data.tasks.filter((item) => item.owner === "Dani Ricco" && !item.done).slice(0,3).map((item) => <Link href="/producao" className="block rounded-lg p-3 text-xs hover:bg-muted" key={item.id}><p className="font-medium">{item.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.due} · {item.priority}</p></Link>)}</div></PopoverContent></Popover><div className="hidden items-center gap-2 2xl:flex"><UserRound className="size-4 text-zinc-600"/><span className="text-xs font-medium">{user?.displayName || user?.username || "Usuário"}</span></div><Button className="hidden h-9 bg-primary px-4 text-xs text-black hover:bg-primary/90 sm:inline-flex" onClick={() => setTaskOpen(true)}><Plus/>Adicionar tarefa</Button><Button size="icon" className="bg-primary text-black sm:hidden" onClick={() => setTaskOpen(true)} aria-label="Adicionar tarefa"><Plus/></Button></div>{inProjectContext ? <Progress value={progress} className="h-[2px] rounded-none bg-transparent xl:hidden"/> : null}</header><main className="mx-auto w-full max-w-[1600px] px-4 pb-4 pt-20 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">{children}</main></div><TaskSheet open={taskOpen} onOpenChange={setTaskOpen}/><GlobalSearch open={searchOpen} onOpenChange={setSearchOpen}/></div>
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  const publicHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "daniricco.com.br" ||
      window.location.hostname === "www.daniricco.com.br" ||
      window.location.hostname === "bio.daniricco.com.br")
  const publicRoute = pathname.startsWith("/site") || pathname.startsWith("/bio") || pathname.startsWith("/login") || pathname.startsWith("/alterar-senha") || pathname.startsWith("/sem-acesso") || publicHost

  React.useEffect(() => {
    if (!publicRoute && !loading && !user) router.replace("/login")
  }, [loading, publicRoute, router, user])

  if (publicRoute) return <>{children}</>
  if (loading || !user) return <div className="grid min-h-screen place-items-center bg-background text-zinc-500">
    <div className="flex items-center gap-2 text-xs"><LoaderCircle className="size-4 animate-spin text-primary"/>Carregando acesso e permissões…</div>
  </div>
  return <DashboardShell pathname={pathname}>{children}</DashboardShell>
}