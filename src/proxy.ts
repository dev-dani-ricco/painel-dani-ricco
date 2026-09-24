import { type NextRequest, NextResponse } from "next/server"

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Dani Ricco Intelligence", charset="UTF-8"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
    },
  })
}

function knowledgeAccessAllowed(request: NextRequest) {
  const expectedUser = process.env.DANI_PANEL_USER
  const expectedPassword = process.env.DANI_PANEL_PASSWORD

  if (!expectedUser || !expectedPassword) {
    return process.env.NODE_ENV !== "production"
  }

  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Basic ")) return false

  try {
    const decoded = atob(authorization.slice(6))
    const separator = decoded.indexOf(":")
    if (separator < 0) return false
    const user = decoded.slice(0, separator)
    const password = decoded.slice(separator + 1)
    return user === expectedUser && password === expectedPassword
  } catch {
    return false
  }
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const protectedKnowledge =
    pathname === "/inteligencia" ||
    pathname.startsWith("/api/knowledge/")

  if (protectedKnowledge && !knowledgeAccessAllowed(request)) {
    return unauthorized()
  }

  const routedHost =
    request.headers.get("x-dani-ricco-host") ||
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""

  const response = NextResponse.next()

  if (
    protectedKnowledge ||
    routedHost.toLowerCase().startsWith("painel.daniricco.com.br")
  ) {
    response.headers.set(
      "X-Robots-Tag",
      "noindex, nofollow, noarchive, nosnippet, noimageindex",
    )
    response.headers.set("Cache-Control", "no-store")
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
