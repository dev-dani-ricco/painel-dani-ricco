import type { Metadata } from "next"
import { ImersaoContentStudio } from "@/components/imersao-content/content-studio"

export const metadata: Metadata = {
  title: "Conteúdo da Imersão | Dani Ricco",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
}

export default function ImersaoConteudoPage() {
  return <ImersaoContentStudio />
}
