"use client"

import { usePathname } from "next/navigation"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DataProvider } from "@/components/data-provider"
import { AuthProvider } from "@/components/auth-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const publicHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "daniricco.com.br" ||
      window.location.hostname === "www.daniricco.com.br" ||
      window.location.hostname === "bio.daniricco.com.br")
  const publicRoute = pathname.startsWith("/site") || pathname.startsWith("/bio") || pathname.startsWith("/login") || pathname.startsWith("/sem-acesso") || publicHost

  const content = (
    <TooltipProvider delayDuration={200}>
      {children}
      <Toaster theme={publicRoute ? "light" : "dark"} richColors position="bottom-right" />
    </TooltipProvider>
  )

  if (publicRoute) return <AuthProvider>{content}</AuthProvider>
  return <AuthProvider><DataProvider>{content}</DataProvider></AuthProvider>
}