const VERCEL_ORIGIN = "https://painel-dani-ricco.vercel.app"

function redirect(url: URL, hostname: string, pathname = url.pathname) {
  const target = new URL(url.toString())
  target.hostname = hostname
  target.pathname = pathname || "/"
  return Response.redirect(target.toString(), 308)
}

function diagnosticPath(pathname: string) {
  if (pathname === "/") return "/diagnostico"
  if (pathname.startsWith("/diagnostico")) return pathname
  if (pathname.startsWith("/api/diagnostico")) return pathname
  if (pathname.startsWith("/mapa-arquetipico")) return pathname
  if (pathname.startsWith("/resultado-completo")) return `/diagnostico${pathname}`
  if (pathname.startsWith("/resultado")) return `/diagnostico${pathname}`
  if (pathname.startsWith("/teste")) return `/diagnostico${pathname}`
  return "/diagnostico"
}

async function proxyToVercel(request: Request, pathname: string) {
  const incoming = new URL(request.url)
  const target = new URL(VERCEL_ORIGIN)
  target.pathname = pathname
  target.search = incoming.search

  const headers = new Headers(request.headers)
  headers.set("host", target.hostname)
  headers.set("x-forwarded-host", incoming.hostname)
  headers.set("x-dani-ricco-host", incoming.hostname)
  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  }

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = request.body
  }

  const response = await fetch(new Request(target.toString(), init))
  const responseHeaders = new Headers(response.headers)
  responseHeaders.delete("x-robots-tag")

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

const worker = {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const host = url.hostname.toLowerCase()
    const assetPath =
      url.pathname.startsWith("/_next/") ||
      url.pathname === "/favicon.ico" ||
      url.pathname === "/robots.txt" ||
      url.pathname === "/sitemap.xml" ||
      url.pathname.startsWith("/images/") ||
      url.pathname.startsWith("/fonts/") ||
      url.pathname.startsWith("/dani/")

    if (assetPath) {
      return proxyToVercel(request, url.pathname)
    }

    if (host === "www.daniricco.com.br") {
      return redirect(url, "daniricco.com.br")
    }

    if (host === "daniricco.com.br") {
      if (url.pathname === "/painel" || url.pathname.startsWith("/painel/")) {
        return redirect(url, "painel.daniricco.com.br", url.pathname.replace(/^\/painel/, "") || "/")
      }
      if (url.pathname === "/diagnostico" || url.pathname.startsWith("/diagnostico/")) {
        return redirect(url, "diagnostico.daniricco.com.br", url.pathname.replace(/^\/diagnostico/, "") || "/")
      }
      if (url.pathname !== "/") {
        return Response.redirect("https://daniricco.com.br/", 308)
      }
      return proxyToVercel(request, "/site")
    }

    if (host === "painel.daniricco.com.br") {
      return proxyToVercel(request, url.pathname)
    }

    if (host === "diagnostico.daniricco.com.br") {
      return proxyToVercel(request, diagnosticPath(url.pathname))
    }

    return new Response("Not found", { status: 404 })
  },
}

export default worker