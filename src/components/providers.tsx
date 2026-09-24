"use client"

import { usePathname } from "next/navigation"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DataProvider } from "@/components/data-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const publicRoute = pathname.startsWith("/site")

  const content = (
    <TooltipProvider delayDuration={200}>
      {children}
      <Toaster theme={publicRoute ? "light" : "dark"} richColors position="bottom-right" />
    </TooltipProvider>
  )

  if (publicRoute) return content
  return <DataProvider>{content}</DataProvider>
}
