import type { Metadata } from "next"
import { OverviewPage } from "@/components/pages/overview"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
}

export default function Home() {
  return <OverviewPage />
}
