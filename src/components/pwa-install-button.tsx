"use client"

import * as React from "react"
import { Download, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function PwaInstallButton() {
  const [promptEvent, setPromptEvent] = React.useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = React.useState(() => {
    if (typeof window === "undefined") return false
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    )
  })

  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js")
    }

    const beforeInstall = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as InstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
    }

    window.addEventListener("beforeinstallprompt", beforeInstall)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  if (installed) {
    return (
      <div className="hidden items-center gap-1.5 text-[10px] text-zinc-600 sm:flex">
        <Smartphone className="size-3.5"/> App instalado
      </div>
    )
  }

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice
      if (choice.outcome === "accepted") setPromptEvent(null)
      return
    }

    window.alert(
      "Para instalar como app: no Chrome/Edge, abra o menu do navegador e escolha “Instalar Dani IA” ou “Instalar este site como aplicativo”. No iPhone, use Compartilhar → Adicionar à Tela de Início.",
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={() => void install()} className="border-white/10 bg-white/[.02]">
      <Download/> Instalar app
    </Button>
  )
}
