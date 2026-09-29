import type { Metadata } from "next"
import { ImmersaoContentStudio } from "@/components/page-builder/imersao-content-studio"

export const metadata: Metadata = {
  title: "Conteúdo da Imersão | Dani Ricco",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
}

export default function ImmersaoContentPage() {
  return <ImmersaoContentStudio />
}