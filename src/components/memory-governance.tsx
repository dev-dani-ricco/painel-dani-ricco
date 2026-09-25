"use client"

import * as React from "react"
import { History, LoaderCircle, ShieldAlert, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export type DeletableMemory = {
  id: string
  title: string
  kind: string
  created_at: string
  metadata: Record<string, unknown>
}

type AuditEntry = {
  id: string
  source_id: string
  source_title: string
  source_kind: string
  source_project_id: string
  source_original_filename: string | null
  source_mime_type: string | null
  source_storage_path: string | null
  source_size_bytes: number | null
  source_content_length: number
  source_content_sha256: string | null
  source_metadata: Record<string, unknown>
  source_created_at: string | null
  actor_username: string
  actor_display_name: string | null
  actor_role: string
  actor_ip: string | null
  user_agent: string | null
  request_id: string | null
  reason: string
  confirmation_text: string
  created_at: string
}

const CONFIRMATION = "APAGAR MEMÓRIA"

export function MemoryDeleteDialog({
  source,
  open,
  onOpenChange,
  onDeleted,
}: {
  source: DeletableMemory | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void | Promise<void>
}) {
  const [reason, setReason] = React.useState("")
  const [confirmation, setConfirmation] = React.useState("")
  const [deleting, setDeleting] = React.useState(false)

  function closeDialog() {
    if (deleting) return
    setReason("")
    setConfirmation("")
    setDeleting(false)
    onOpenChange(false)
  }

  async function remove() {
    if (!source || deleting) return
    setDeleting(true)
    try {
      const response = await fetch("/api/knowledge/sources/" + encodeURIComponent(source.id), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          confirmationText: confirmation,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Não foi possível apagar a memória.")

      toast.success("Memória apagada e ação registrada no log.")
      setReason("")
      setConfirmation("")
      onOpenChange(false)
      await onDeleted()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao apagar memória.")
    } finally {
      setDeleting(false)
    }
  }

  const valid =
    Boolean(source) &&
    reason.trim().length >= 10 &&
    confirmation.trim().toUpperCase() === CONFIRMATION

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true)
        else closeDialog()
      }}
    >
      <DialogContent className="border-red-500/20 bg-[#101010] text-white sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[.07]">
            <ShieldAlert className="size-4 text-red-400"/>
          </div>
          <DialogTitle>Apagar memória do Clone da Dani</DialogTitle>
          <DialogDescription>
            Esta ação remove a memória da recuperação futura do clone. O conteúdo não será preservado no log de auditoria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/[.07] bg-black/25 p-3">
            <p className="text-[9px] uppercase tracking-[.16em] text-zinc-600">Memória selecionada</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">{source?.title}</p>
            {source?.metadata?.topicLabel ? (
              <p className="mt-1 text-[10px] text-zinc-600">{String(source.metadata.topicLabel)}</p>
            ) : null}
          </div>

          <label className="block space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-500">
              Motivo da exclusão
            </span>
            <Textarea
              id="memory-delete-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explique explicitamente por que esta memória deve ser apagada…"
              className="min-h-24 resize-none border-white/10 bg-black/25 text-sm"
              aria-describedby="memory-delete-reason-help"
              required
            />
            <span id="memory-delete-reason-help" className="block text-[9px] text-zinc-600">
              O motivo ficará permanentemente registrado na auditoria.
            </span>
          </label>

          <label className="block space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-500">
              Confirmação
            </span>
            <p className="text-xs text-zinc-500">
              Digite <strong className="text-zinc-300">{CONFIRMATION}</strong> para confirmar.
            </p>
            <Input
              id="memory-delete-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              placeholder={CONFIRMATION}
              className="border-white/10 bg-black/25"
              aria-describedby="memory-delete-confirmation-help"
              required
            />
            <span id="memory-delete-confirmation-help" className="sr-only">
              A exclusão só será habilitada após digitar a confirmação solicitada.
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={deleting} onClick={closeDialog}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!valid || deleting}
            onClick={() => void remove()}
          >
            {deleting ? <LoaderCircle className="animate-spin"/> : <Trash2/>}
            Apagar memória
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function MemoryAuditPanel({ refreshToken = 0 }: { refreshToken?: number }) {
  const [entries, setEntries] = React.useState<AuditEntry[]>([])
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/knowledge/audit?limit=50", { cache: "no-store" })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Falha ao carregar auditoria.")
      setEntries(body.entries || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar auditoria.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [open, load, refreshToken])

  return (
    <section className="border-t border-white/[.06] p-5">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2">
          <History className="size-3.5 text-zinc-600"/>
          <span className="text-xs font-semibold text-zinc-400">Auditoria de exclusões</span>
        </span>
        <span className="text-[9px] text-zinc-700">{open ? "ocultar" : "ver log"}</span>
      </button>

      {open && (
        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
          {loading && (
            <div className="flex items-center gap-2 py-4 text-[10px] text-zinc-600">
              <LoaderCircle className="size-3.5 animate-spin"/> Carregando log…
            </div>
          )}
          {!loading && !entries.length && (
            <p className="py-4 text-center text-[10px] text-zinc-700">Nenhuma memória foi apagada.</p>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-white/[.05] bg-black/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium text-zinc-400">{entry.source_title}</p>
                  <p className="mt-1 text-[8px] uppercase tracking-wide text-zinc-700">
                    {entry.actor_username} · {new Date(entry.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <span className="rounded border border-red-500/15 bg-red-500/[.04] px-1.5 py-0.5 text-[8px] text-red-400">
                  apagada
                </span>
              </div>
              <p className="mt-2 text-[9px] leading-4 text-zinc-600">
                <span className="text-zinc-500">Motivo:</span> {entry.reason}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[8px] text-zinc-700">
                <span>tipo: {entry.source_kind}</span>
                <span>conteúdo: {entry.source_content_length} chars</span>
                {entry.source_content_sha256 ? <span>hash: {entry.source_content_sha256.slice(0, 12)}…</span> : null}
                {entry.actor_ip ? <span>IP: {entry.actor_ip}</span> : null}
                {entry.request_id ? <span>req: {entry.request_id}</span> : null}
              </div>
              {entry.user_agent ? (
                <p className="mt-1 truncate text-[8px] text-zinc-800" title={entry.user_agent}>
                  dispositivo: {entry.user_agent}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
