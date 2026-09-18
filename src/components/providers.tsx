"use client"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DataProvider } from "@/components/data-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster theme="dark" richColors position="bottom-right" />
      </TooltipProvider>
    </DataProvider>
  )
}
