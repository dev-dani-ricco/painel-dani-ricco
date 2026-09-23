import Link from "next/link"
import { ArrowRight, Check, Eye, LockKeyhole, MessageCircleMore, MoveUpRight, Sparkles } from "lucide-react"
import { PublicFrame } from "@/components/diagnostico/public-frame"
import { getArchetype } from "@/lib/archetypes"
import { getDiagnosticResult } from "@/lib/diagnostic-db"

export const metadata = {
  title: "Mapa Arquetípico IMPAR® | Dani Ricco",
  description: "Desbloqueie sua combinação arquetípica aplicada à presença, comunicação e posicionamento.",
}

function SalesCta({ href, external, className = "" }: { href: string; external: boolean; className?: string }) {
  return (
    <Link href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={`inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[#671b31] px-7 text-xs font-bold uppercase tracking-[.14em] text-white transition hover:bg-[#4d1124] ${className}`}>
      Quero descobrir minha combinação <ArrowRight className="size-4" />
    </Link>
  )
}

function checkoutHref(sessionId: string) {
  const configured = process.env.NEXT_PUBLIC_MAPA_ARQUETIPICO_CHECKOUT_URL
  if (configured) {
    try {
      const url = new URL(configured)
      if (sessionId) url.searchParams.set("session_id", sessionId)
      return url.toString()
    } catch {}
  }
  if (sessionId === "preview" || process.env.NODE_ENV === "development") {
    return `/diagnostico/resultado-completo/${encodeURIComponent(sessionId || "preview")}?preview=1`
  }
  return "#desbloquear"
}

export default async function ArchetypeMapSalesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const raw = query.session
  const sessionId = typeof raw === "string" ? raw : ""
  const record = sessionId && sessionId !== "preview" ? await getDiagnosticResult(sessionId) : null
  const primary = sessionId === "preview" ? getArchetype("sabia") : record ? getArchetype(record.primaryArchetype) : null
  const cta = checkoutHref(sessionId)
  const externalCheckout = /^https?:\/\//.test(cta)

  return (
    <PublicFrame>
      <main>
        <section className="relative overflow-hidden bg-[#f8f5f2]">
          <div className="absolute -right-28 top-0 size-[34rem] rounded-full border border-[#6d2136]/8" />
          <div className="absolute -right-10 top-20 size-[25rem] rounded-full border border-[#6d2136]/8" />
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#772640]">Mapa Arquetípico IMPAR®</p>
              <h1 className="impar-serif mt-5 text-5xl leading-[1.02] text-[#2f171f] sm:text-7xl">Você descobriu sua força dominante. Agora descubra a combinação que torna sua presença única.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#725f64] sm:text-lg">Seu arquétipo predominante explica grande parte da maneira como você se comunica. Mas ele não trabalha sozinho. Existe uma segunda força influenciando sua imagem, sua linguagem, seu comportamento e a forma como as pessoas percebem você.</p>
              {primary && <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-[#6d2136]/15 bg-white/70 px-4 py-2"><span className="size-2 rounded-full bg-[#7a2941]"/><span className="text-xs text-[#6f555d]">Seu predominante: <strong className="text-[#4a2330]">{primary.name}</strong></span></div>}
              <div className="mt-8"><SalesCta href={cta} external={externalCheckout} /></div>
            </div>
            <div className="relative rounded-[2rem] border border-[#6d2136]/14 bg-white p-7 shadow-[0_32px_90px_rgba(76,25,42,.12)] sm:p-9">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8f747c]">Sua combinação</p><p className="impar-serif mt-2 text-4xl text-[#4b1b2b]">{primary?.name ?? "Predominante"} + <span className="blur-[6px] select-none">ARQUÉTIPO</span></p></div><span className="flex size-12 items-center justify-center rounded-full bg-[#681b31] text-white"><LockKeyhole className="size-5"/></span></div>
              <div className="mt-8 grid gap-3">
                {["Como as duas forças se complementam", "Onde sua comunicação ganha potência", "Qual excesso pode enfraquecer sua percepção", "Como traduzir a combinação nos 3 pilares do IMPAR®"].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl bg-[#f6f0ee] p-4 text-sm text-[#5f4950]"><Check className="size-4 shrink-0 text-[#792540]"/>{item}</div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#6d2136]/10 bg-[#531426] text-white">
          <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
            <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#e3c3cb]">A combinação muda a leitura</p>
            <h2 className="impar-serif mt-4 max-w-4xl text-4xl leading-tight sm:text-5xl">Um mesmo arquétipo predominante pode comunicar mensagens completamente diferentes.</h2>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {[['Sábia + Governante','Conhecimento que chega através de autoridade, direção e estrutura.'],['Sábia + Amante','Conhecimento que ganha magnetismo, sensibilidade e força de conexão.'],['Sábia + Rebelde','Conhecimento usado para questionar padrões e provocar novas leituras.']].map(([title,copy]) => <article key={title} className="rounded-2xl border border-white/14 bg-white/[.06] p-6"><p className="impar-serif text-2xl">{title}</p><p className="mt-3 text-sm leading-6 text-[#ead8dc]">{copy}</p></article>)}
            </div>
            <p className="mt-7 text-xs text-[#d9bbc3]">Exemplos de combinações para demonstrar a lógica do método — não representam seu resultado oculto.</p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div><p className="text-[10px] font-bold uppercase tracking-[.26em] text-[#792540]">O que você desbloqueia</p><h2 className="impar-serif mt-4 text-4xl leading-tight text-[#321920] sm:text-5xl">Não é apenas o nome do seu segundo arquétipo.</h2><p className="mt-5 text-base leading-7 text-[#766268]">O Mapa Arquetípico IMPAR® transforma o resultado em direção prática para a forma como você quer ser percebida.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[['Arquétipo predominante','A força que conduz naturalmente sua comunicação.'],['Arquétipo secundário','A energia que modifica e personaliza sua expressão.'],['Combinação dos dois','Como as duas forças trabalham juntas e onde entram em tensão.'],['Comunicação visual','Códigos que reforçam ou enfraquecem a percepção desejada.'],['Comunicação verbal','Tom, linguagem, narrativa e forma natural de influência.'],['Comunicação comportamental','Postura, liderança, relacionamento e presença.'],['Sua potência','Onde a combinação tende a gerar mais valor percebido.'],['Sua sombra','Quando uma força começa a trabalhar contra a outra.']].map(([title,copy]) => <article key={title} className="rounded-2xl border border-[#6d2136]/12 bg-white/70 p-5"><p className="text-sm font-bold text-[#452731]">{title}</p><p className="mt-2 text-xs leading-5 text-[#837078]">{copy}</p></article>)}
            </div>
          </div>
        </section>

        <section className="bg-[#efe6e3]">
          <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
            <div className="text-center"><p className="text-[10px] font-bold uppercase tracking-[.26em] text-[#792540]">Método IMPAR®</p><h2 className="impar-serif mx-auto mt-4 max-w-3xl text-4xl leading-tight text-[#321920] sm:text-5xl">Presença não é estética. É comunicação.</h2><p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#78646a]">A leitura é organizada por três dimensões que precisam sustentar a mesma mensagem.</p></div>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl bg-[#f8f5f2] p-6"><Eye className="size-5 text-[#772640]"/><h3 className="impar-serif mt-4 text-2xl text-[#3f222b]">Visual</h3><p className="mt-2 text-sm leading-6 text-[#806d72]">O que é percebido antes mesmo de você falar.</p></article>
              <article className="rounded-2xl bg-[#f8f5f2] p-6"><MessageCircleMore className="size-5 text-[#772640]"/><h3 className="impar-serif mt-4 text-2xl text-[#3f222b]">Verbal</h3><p className="mt-2 text-sm leading-6 text-[#806d72]">O que suas palavras fazem as pessoas compreenderem, sentirem e desejarem.</p></article>
              <article className="rounded-2xl bg-[#f8f5f2] p-6"><MoveUpRight className="size-5 text-[#772640]"/><h3 className="impar-serif mt-4 text-2xl text-[#3f222b]">Comportamental</h3><p className="mt-2 text-sm leading-6 text-[#806d72]">O que sua postura confirma depois da primeira impressão.</p></article>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div><div className="flex items-center gap-2 text-[#792540]"><Sparkles className="size-4"/><p className="text-[10px] font-bold uppercase tracking-[.22em]">Aplicação por Dani Ricco</p></div><h2 className="impar-serif mt-4 text-4xl leading-tight text-[#321920] sm:text-5xl">Você não precisa se transformar em uma personagem.</h2><p className="mt-5 text-base leading-7 text-[#745f66]">A proposta é reconhecer características que já existem em você e aprender a comunicá-las com mais intenção. Ser IMPAR não é fórmula. É comunicar o que é único com força, coerência e valor.</p></div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#6d2136]/10 bg-[#6d2136]/10 sm:grid-cols-3">
              {[['22 anos','estudo e aplicação'],['+5.000','profissionais'],['+1.000','horas presenciais'],['11+ países','repertório'],['+3MM','contas alcançadas'],['IMPAR®','visual · verbal · comportamental']].map(([value,label]) => <div key={label} className="bg-[#f8f5f2] p-5 text-center"><p className="impar-serif text-2xl text-[#591a2d]">{value}</p><p className="mt-1 text-[9px] uppercase tracking-[.12em] text-[#887178]">{label}</p></div>)}
            </div>
          </div>
        </section>

        <section id="desbloquear" className="bg-[#3f0f1e] text-white">
          <div className="mx-auto w-full max-w-4xl px-5 py-16 text-center sm:px-8 sm:py-24">
            <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#ddbec6]">Você já descobriu parte da resposta</p>
            <h2 className="impar-serif mt-5 text-4xl leading-tight sm:text-6xl">Agora descubra o que acontece quando suas duas forças principais se encontram.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#e5d1d6]">Desbloqueie o Mapa Arquetípico IMPAR® e transforme o diagnóstico em direção para sua presença e comunicação.</p>
            <div className="mt-8"><SalesCta href={cta} external={externalCheckout} className="bg-white text-[#511426] hover:bg-[#f6ecef]" /></div>
            {cta === "#desbloquear" && <p className="mt-5 text-xs text-[#cbaab3]">A etapa de pagamento está pronta para conexão com o checkout oficial. Nenhuma cobrança é iniciada nesta prévia.</p>}
          </div>
        </section>
      </main>
    </PublicFrame>
  )
}