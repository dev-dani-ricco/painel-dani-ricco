"use client"

import * as React from "react"
import { toast } from "sonner"
import { isAppData } from "@/lib/data-schema"
import { initialData } from "@/lib/initial-data"
import { createProjectInitialData, DEFAULT_PROJECT_ID } from "@/lib/project-data"
import type { AppData, Project } from "@/lib/types"

const STORAGE_PREFIX = "dani-ricco-launch-panel:v2"
const ACTIVE_PROJECT_KEY = "dani-ricco-active-project:v1"
export type SyncStatus = "loading" | "saving" | "saved" | "offline" | "error"

export type ProjectCreateInput = {
  name: string
  description: string
  objective: string
  successCriteria: string
  priority: "Alta" | "Média" | "Baixa"
  projectType: string
  responsibles: string[]
  startDate: string
  targetDate: string
  stages: string[]
}

type DataContextValue = {
  data: AppData
  hydrated: boolean
  syncStatus: SyncStatus
  progress: number
  projects: Project[]
  activeProjectId: string
  activeProject: Project | null
  setActiveProject: (id: string) => void
  createProject: (input: ProjectCreateInput) => Promise<Project>
  updateProject: (patch: Partial<Project> & { id: string }) => Promise<Project>
  update: <K extends keyof AppData>(
    key: K,
    value: AppData[K] | ((current: AppData[K]) => AppData[K]),
  ) => void
  reset: () => void
}

const DataContext = React.createContext<DataContextValue | null>(null)

function storageKey(projectId: string) {
  return STORAGE_PREFIX + ":" + projectId
}

function readLocal(projectId: string) {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(storageKey(projectId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isAppData(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeLocal(projectId: string, data: AppData) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(storageKey(projectId), JSON.stringify(data))
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<AppData>(initialData)
  const [projects, setProjects] = React.useState<Project[]>([])
  const [activeProjectId, setActiveProjectIdState] = React.useState(DEFAULT_PROJECT_ID)
  const [hydrated, setHydrated] = React.useState(false)
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>("loading")

  const loadVersion = React.useRef(0)
  const saveTimers = React.useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const activeProjectIdRef = React.useRef(activeProjectId)

  React.useEffect(() => {
    activeProjectIdRef.current = activeProjectId
  }, [activeProjectId])

  const refreshProjects = React.useCallback(async () => {
    const response = await fetch("/api/projects", { cache: "no-store" })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || "Falha ao carregar projetos")
    const next = (body.projects || []) as Project[]
    setProjects(next)

    const saved = typeof window !== "undefined"
      ? window.localStorage.getItem(ACTIVE_PROJECT_KEY)
      : null
    const desired = saved && next.some((project) => project.id === saved)
      ? saved
      : next.find((project) => project.id === DEFAULT_PROJECT_ID)?.id || next[0]?.id || DEFAULT_PROJECT_ID
    setActiveProjectIdState(desired)
    return next
  }, [])

  React.useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      void refreshProjects().catch((error) => {
        if (active) {
          console.error(error)
          setSyncStatus("offline")
        }
      })
    }, 0)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [refreshProjects])

  React.useEffect(() => {
    const version = ++loadVersion.current
    const local = readLocal(activeProjectId)
    const timer = window.setTimeout(() => {
      if (local) setData(local)
      setHydrated(false)
      setSyncStatus("loading")

      void fetch("/api/dashboard?projectId=" + encodeURIComponent(activeProjectId), { cache: "no-store" })
        .then(async (response) => {
          const body = await response.json()
          if (!response.ok) throw new Error(body.error || "Falha ao carregar projeto")
          if (version !== loadVersion.current || !isAppData(body.data)) return
          setData(body.data)
          writeLocal(activeProjectId, body.data)
          setHydrated(true)
          setSyncStatus("saved")
        })
        .catch((error) => {
          console.error(error)
          if (version !== loadVersion.current) return
          setHydrated(true)
          setSyncStatus(local ? "offline" : "error")
        })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [activeProjectId])

  const scheduleSave = React.useCallback((projectId: string, next: AppData) => {
    writeLocal(projectId, next)
    setSyncStatus("saving")
    const current = saveTimers.current.get(projectId)
    if (current) clearTimeout(current)

    const timer = setTimeout(() => {
      saveTimers.current.delete(projectId)
      void fetch("/api/dashboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, data: next }),
      }).then((response) => {
        if (!response.ok) throw new Error("Falha ao salvar")

        if (activeProjectIdRef.current === projectId) setSyncStatus("saved")
      }).catch((error) => {
        console.error(error)
        if (activeProjectIdRef.current === projectId) setSyncStatus("error")
      })
    }, 650)

    saveTimers.current.set(projectId, timer)
  }, [])

  const update = React.useCallback<DataContextValue["update"]>((key, value) => {
    setData((current) => {
      const nextValue = typeof value === "function"
        ? (value as (item: AppData[typeof key]) => AppData[typeof key])(current[key])
        : value
      const next = { ...current, [key]: nextValue }
      scheduleSave(activeProjectIdRef.current, next)
      return next
    })
  }, [scheduleSave])

  const setActiveProject = React.useCallback((id: string) => {
    if (!projects.some((project) => project.id === id)) return
    setActiveProjectIdState(id)
    if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_PROJECT_KEY, id)
  }, [projects])

  const createProject = React.useCallback(async (input: ProjectCreateInput) => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        stages: input.stages.map((name) => ({ name })),
      }),
    })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || "Falha ao criar projeto")
    const project = body.project as Project
    setProjects((current) => [...current, project])
    setActiveProjectIdState(project.id)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_PROJECT_KEY, project.id)
    }
    toast.success("Projeto criado. Workspace separado preparado.")
    return project
  }, [])

  const updateProject = React.useCallback(async (patch: Partial<Project> & { id: string }) => {
    const response = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })

    const body = await response.json()
    if (!response.ok) throw new Error(body.error || "Falha ao atualizar projeto")
    const project = body.project as Project
    setProjects((current) => current.map((item) => item.id === project.id ? project : item))
    return project
  }, [])

  const activeProject = React.useMemo(
    () => projects.find((project) => project.id === activeProjectId) || null,
    [activeProjectId, projects],
  )

  const reset = React.useCallback(() => {
    const resetData = activeProjectId === DEFAULT_PROJECT_ID
      ? initialData
      : createProjectInitialData(
          activeProject?.name || "Novo projeto",
          activeProject?.status || "Planejamento",
        )
    setData(resetData)
    scheduleSave(activeProjectId, resetData)
    toast.success("Dados do projeto restaurados e sincronizados.")
  }, [activeProject?.name, activeProject?.status, activeProjectId, scheduleSave])

  const progress = React.useMemo(() => {
    const points = [
      ...data.tasks.map((item) => item.done || item.status === "Concluído"),
      ...data.lessons.map((item) => item.status === "Pronta"),

      ...data.memberItems.map((item) => item.status === "Concluído"),
    ]
    return points.length
      ? Math.round((points.filter(Boolean).length / points.length) * 100)
      : 0
  }, [data.lessons, data.memberItems, data.tasks])

  const value = React.useMemo<DataContextValue>(() => ({
    data,
    hydrated,
    syncStatus,
    progress,
    projects,
    activeProjectId,
    activeProject,
    setActiveProject,
    createProject,
    updateProject,
    update,
    reset,
  }), [
    activeProject,
    activeProjectId,
    createProject,
    data,
    hydrated,
    progress,
    projects,
    reset,
    setActiveProject,

    syncStatus,
    update,
    updateProject,
  ])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useDashboard() {
  const context = React.useContext(DataContext)
  if (!context) throw new Error("useDashboard deve ser usado dentro de DataProvider")
  return context
}
