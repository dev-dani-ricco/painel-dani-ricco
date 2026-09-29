import type { Metadata } from "next"
import { PageStudio } from "@/components/page-builder/page-studio"

export const metadata: Metadata = {
  title: "Page Studio | Dani Ricco",
  robots: { index:false, follow:false, noarchive:true, nosnippet:true },
}

export default function EditorPaginasPage() {
  return <PageStudio slug="imersao" />
}
