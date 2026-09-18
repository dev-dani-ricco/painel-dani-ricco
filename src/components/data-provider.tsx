"use client"

import * as React from "react"
import { toast } from "sonner"
import { isAppData } from "@/lib/data-schema"
import { initialData } from "@/lib/initial-data"
import type { AppData } from "@/lib/types"

const STORAGE_KEY = "dani-ricco-launch-panel:v1"
export type SyncStatus = "loading" | "saving" | "saved" | "offline" | "error"

let storeData = initialData
let storeInitialized = false
let hasLocalSnapshot = false
let localChanges = 0
let remoteHydrationStarted = false
let syncStatus: SyncStatus = "loading"
let queuedData: AppData | null = null
let saveInProgress = false
let saveTimer: ReturnType<typeof setTimeout> | null = null

const listeners = new Set<() => void>()
const statusListeners = new Set<() => void>()

function initializeStore() {
  if (storeInitialized || typeof window === "undefined") return
  storeInitialized = true
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    const parsed: unknown = JSON.parse(saved)
    if (isAppData(parsed)) { storeData = parsed; hasLocalSnapshot = true }
  } catch { storeData = initialData }
}

function getSnapshot() { initializeStore(); return storeData }
function subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener) }
function getStatusSnapshot() { return syncStatus }
function subscribeStatus(listener: () => void) { statusListeners.add(listener); return () => statusListeners.delete(listener) }
function setSyncStatus(status: SyncStatus) { if (syncStatus === status) return; syncStatus = status; statusListeners.forEach((listener) => listener()) }

function setStore(next: AppData, options: { syncRemote: boolean; countChange?: boolean }) {
  storeData = next
  if (options.countChange) localChanges += 1
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  listeners.forEach((listener) => listener())
  if (options.syncRemote) scheduleRemoteSave(next)
}

async function flushRemoteSave() {
  if (saveInProgress || !queuedData) return
  const data = queuedData
  queuedData = null
  saveInProgress = true
  setSyncStatus("saving")
  try {
    const response = await fetch("/api/dashboard", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) })
    if (!response.ok) throw new Error(`Falha ao salvar: ${response.status}`)
    setSyncStatus(queuedData ? "saving" : "saved")
  } catch (error) {
    console.error(error)
    setSyncStatus("error")
  } finally {
    saveInProgress = false
    if (queuedData) void flushRemoteSave()
  }
}

function scheduleRemoteSave(data: AppData, immediate = false) {
  queuedData = data
  setSyncStatus("saving")
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => { saveTimer = null; void flushRemoteSave() }, immediate ? 0 : 650)
}

async function hydrateFromDatabase() {
  if (remoteHydrationStarted) return
  remoteHydrationStarted = true
  initializeStore()
  const changesAtStart = localChanges
  const localData = storeData
  try {
    const response = await fetch("/api/dashboard", { cache: "no-store" })
    if (!response.ok) throw new Error(`Falha ao carregar: ${response.status}`)
    const payload: unknown = await response.json()
    if (!payload || typeof payload !== "object" || !("data" in payload)) throw new Error("Resposta inválida do banco")
    const { data, isNew } = payload as { data: unknown; isNew?: boolean }
    if (!isAppData(data)) throw new Error("Dados inválidos recebidos do banco")
    if (isNew && hasLocalSnapshot) { scheduleRemoteSave(localData, true); return }
    if (changesAtStart === localChanges) { setStore(data, { syncRemote: false }); setSyncStatus("saved") }
    else scheduleRemoteSave(storeData, true)
  } catch (error) { console.error(error); setSyncStatus("offline") }
}

type DataContextValue = {
  data: AppData
  hydrated: boolean
  syncStatus: SyncStatus
  progress: number
  update: <K extends keyof AppData>(key: K, value: AppData[K] | ((current: AppData[K]) => AppData[K])) => void
  reset: () => void
}

const DataContext = React.createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const data = React.useSyncExternalStore(subscribe, getSnapshot, () => initialData)
  const currentSyncStatus = React.useSyncExternalStore(subscribeStatus, getStatusSnapshot, () => "loading" as const)
  React.useEffect(() => { void hydrateFromDatabase() }, [])

  const update = React.useCallback<DataContextValue["update"]>((key, value) => {
    const current = getSnapshot()
    const nextValue = typeof value === "function" ? (value as (item: AppData[typeof key]) => AppData[typeof key])(current[key]) : value
    setStore({ ...current, [key]: nextValue }, { syncRemote: true, countChange: true })
  }, [])
  const reset = React.useCallback(() => { setStore(initialData, { syncRemote: true, countChange: true }); toast.success("Dados de demonstração restaurados e sincronizados.") }, [])

  const progress = React.useMemo(() => {
    const points = [...data.tasks.map((item) => item.done || item.status === "Concluído"), ...data.lessons.map((item) => item.status === "Pronta"), ...data.memberItems.map((item) => item.status === "Concluído")]
    return points.length ? Math.round((points.filter(Boolean).length / points.length) * 100) : 0
  }, [data.lessons, data.memberItems, data.tasks])
  const value = React.useMemo(() => ({ data, hydrated: currentSyncStatus !== "loading", syncStatus: currentSyncStatus, progress, update, reset }), [currentSyncStatus, data, progress, reset, update])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useDashboard() {
  const context = React.useContext(DataContext)
  if (!context) throw new Error("useDashboard deve ser usado dentro de DataProvider")
  return context
}
