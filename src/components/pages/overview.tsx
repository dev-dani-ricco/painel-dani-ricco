"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowRight, ArrowUpRight, AtSign, BrainCircuit, CalendarDays,
  FolderKanban, Globe2, Layers3, Link2, PanelsTopLeft, RefreshCw,
} from "lucide-react"
import { useDashboard } from "@/components/data-provider"
import { SectionHeading, TextLink } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { DANI_ECOSYSTEM_RESOURCES, type DaniEcosystemResource } from "@/lib/dani-ecosystem"

const ecosystemIcons = {
  site: Globe2,
  bio: PanelsTopLeft,
  landing_page: Link2,
  social: AtSign,
} as const

const healthLabel = {
  online: "Online",
  degraded: "Atenção",
  offline: "Indisponível",
  unknown: "Não verificado",
} as const

const healthDot = {
  online: "bg-emerald-400",  degraded: "bg-amber-400",
  offline: "bg-red-400",
  unknown: "bg-zinc-600",
} as const

export function OverviewPage() {
  const router = useRouter()
  const { projects, activeProjectId, setActiveProject } = useDashboard()
  const [ecosystemResources, setEcosystemResources] = React.useState<DaniEcosystemResource[]>(DANI_ECOSYSTEM_RESOURCES)
  const [refreshingHealth, setRefreshingHealth] = React.useState(false)

  React.useEffect(() => {
    let active = true
    void fetch("/api/ecosystem", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao carregar ecossistema")
        return response.json() as Promise<{ assets?: DaniEcosystemResource[] }>
      })
      .then((body) => {
        if (active && Array.isArray(body.assets) && body.assets.length) setEcosystemResources(body.assets)
      })
      .catch((error) => console.error(error))
    return () => { active = false }
  }, [])

  const refreshHealth = async () => {
    if (refreshingHealth) return
    setRefreshingHealth(true)
    try {
      const response = await fetch("/api/ecosystem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh-health" }),      })
      const body = await response.json() as { assets?: DaniEcosystemResource[]; error?: string }
      if (!response.ok) throw new Error(body.error || "Falha ao verificar ecossistema")
      if (Array.isArray(body.assets)) setEcosystemResources(body.assets)
    } catch (error) {
      console.error(error)
    } finally {
      setRefreshingHealth(false)
    }
  }

  const openProject = (projectId: string) => {
    setActiveProject(projectId)
    router.push("/projetos")
  }

  return <div className="space-y-10">
    <section className="overflow-hidden rounded-2xl border border-white/[.08] bg-card">
      <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-5">
            <Image src="/dani/logo-branca.png" alt="Dani Ricco" width={190} height={64} className="h-auto w-[150px] object-contain sm:w-[175px]" priority unoptimized/>
            <span className="h-8 w-px bg-white/10"/>
            <div>
              <p className="impar-serif text-2xl tracking-[.08em] text-zinc-100">IMPAR®</p>
              <p className="mt-1 text-[8px] font-semibold uppercase tracking-[.2em] text-zinc-600">Método · Ecossistema</p>
            </div>
          </div>
          <p className="eyebrow mt-9">CENTRAL DE GESTÃO</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-[-.04em] sm:text-5xl">Um ponto único para o time enxergar o ecossistema e escolher onde trabalhar.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">A Visão Geral é transversal. Nenhum lançamento é aberto automaticamente aqui; o contexto específico começa quando um projeto é selecionado.</p>          <div className="mt-7 flex flex-wrap gap-2">
            <Button onClick={() => router.push("/projetos")}><FolderKanban/>Projetos</Button>
            <Button variant="outline" onClick={() => router.push("/calendario")}><CalendarDays/>Calendário</Button>
            <Button variant="outline" onClick={() => router.push("/inteligencia")}><BrainCircuit/>Inteligência</Button>
          </div>
        </div>
        <div className="relative hidden min-h-[320px] overflow-hidden border-l border-white/[.07] lg:block">
          <Image src="/dani/fan-side.jpg" alt="Dani Ricco" fill className="object-cover object-[center_24%] opacity-80" sizes="340px" unoptimized/>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"/>
          <div className="absolute inset-x-5 bottom-5 border-t border-white/20 pt-4">
            <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-zinc-300">Comunicação de Impacto</p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <SectionHeading
        eyebrow="ECOSSISTEMA DIGITAL"
        title="Central da Dani"
        action={<TextLink onClick={() => void refreshHealth()}>{refreshingHealth ? "Verificando..." : "Verificar saúde"}</TextLink>}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ecosystemResources.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((resource) => {
          const Icon = ecosystemIcons[resource.category]
          return <a key={resource.key} href={resource.url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-xl border border-white/[.08] bg-card transition hover:-translate-y-0.5 hover:border-primary/30">
            <div className="relative aspect-[16/7] overflow-hidden border-b border-white/[.06] bg-black/30">
              <Image src={resource.previewImage} alt={resource.previewAlt} fill className="object-cover object-center opacity-70 transition duration-300 group-hover:scale-[1.025] group-hover:opacity-90" sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" unoptimized/>              <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent"/>
              <span className="absolute left-3 top-3 grid size-8 place-items-center rounded-lg border border-white/10 bg-black/55 text-primary backdrop-blur"><Icon className="size-4"/></span>
              <ArrowUpRight className="absolute right-3 top-3 size-4 text-white/45 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"/>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[8px] font-semibold uppercase tracking-[.17em] text-zinc-700">{resource.eyebrow}</p>
                <span className="inline-flex items-center gap-1.5 text-[8px] text-zinc-600">
                  <span className={"size-1.5 rounded-full " + healthDot[resource.health]}/>
                  {healthLabel[resource.health]}
                </span>
              </div>
              <h3 className="mt-1 text-sm font-semibold text-zinc-200">{resource.title}</h3>
              <p className="mt-2 min-h-10 text-[10px] leading-5 text-zinc-600">{resource.description}</p>
              <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[8px] text-zinc-700">
                <span>{resource.product || "Produto não definido"}</span>
                <span>·</span>
                <span>{resource.responsible || "Responsável não definido"}</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[8px] text-zinc-700">
                <span className="size-1.5 rounded-full bg-primary"/>
                {resource.source === "painel-dani-ricco" ? "Fonte interna conectada" : "Recurso externo mapeado"}
              </div>
            </div>
          </a>
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[9px] text-zinc-700">
        <RefreshCw className={"size-3 " + (refreshingHealth ? "animate-spin" : "")}/>
        Inventário persistente com status operacional sob demanda.
      </div>
    </section>
    <section>
      <SectionHeading eyebrow="PROJETOS" title="Escolha onde o time vai trabalhar" action={<TextLink onClick={() => router.push("/projetos")}>Gerenciar projetos</TextLink>}/>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => <button type="button" key={project.id} onClick={() => openProject(project.id)} className={"group rounded-xl border p-5 text-left transition hover:-translate-y-0.5 " + (project.id === activeProjectId ? "border-primary/25 bg-primary/[.025]" : "border-white/[.08] bg-card hover:border-white/15")}>
          <div className="flex items-start justify-between gap-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/[.07] bg-black/20 text-zinc-500 group-hover:text-primary"><Layers3 className="size-4"/></span>
            <ArrowRight className="size-4 shrink-0 text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-primary"/>
          </div>
          <p className="mt-5 text-[8px] font-semibold uppercase tracking-[.17em] text-zinc-700">{project.projectType}</p>
          <h3 className="mt-1 text-sm font-semibold text-zinc-200">{project.name}</h3>
          <p className="mt-2 line-clamp-2 min-h-10 text-[10px] leading-5 text-zinc-600">{project.objective || project.description || "Projeto sem descrição."}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-[9px] text-zinc-600"><span>{project.status}</span><span>·</span><span>{project.cards.length} cards</span><span>·</span><span>{project.stages.length} etapas</span></div>
        </button>)}
      </div>
      {!projects.length ? <div className="rounded-xl border border-dashed border-white/[.08] p-8 text-center text-xs text-zinc-600">Nenhum projeto disponível.</div> : null}
    </section>
  </div>
}
