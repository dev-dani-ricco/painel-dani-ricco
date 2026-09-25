import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CalendarPage } from "@/components/pages/calendar-page"
import { CoursePage, MembersPage } from "@/components/pages/course-members"
import { DebriefPage, LaunchPage, OfferPage, PreLaunchPage, ProductPage } from "@/components/pages/briefings"
import { MaterialsPage, SettingsPage } from "@/components/pages/materials-settings"
import { ProductionPage } from "@/components/pages/production"
import { ProjectsPage } from "@/components/pages/projects"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
}

const pages = {
  calendario: CalendarPage,
  projetos: ProjectsPage,
  produto: ProductPage,
  oferta: OfferPage,
  curso: CoursePage,
  "area-de-membros": MembersPage,
  producao: ProductionPage,
  "pre-lancamento": PreLaunchPage,
  lancamento: LaunchPage,
  debriefing: DebriefPage,
  materiais: MaterialsPage,
  configuracoes: SettingsPage,
} as const

export function generateStaticParams() {
  return Object.keys(pages).map((section) => ({ section }))
}

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  const Page = pages[section as keyof typeof pages]
  if (!Page) notFound()
  return <Page />
}
