import { type NextRequest, NextResponse } from "next/server"
import { routeFeature } from "@/lib/auth-config"
import { SESSION_COOKIE, verifySession } from "@/lib/auth-session"

const PUBLIC_HOSTS = new Set([
  "daniricco.com.br",
  "www.daniricco.com.br",
  "bio.daniricco.com.br",
])

function noIndex(response: NextResponse) {
  response.headers.set(
    "X-Robots-Tag",
    "noindex, nofollow, noarchive, nosnippet, noimageindex",
  )
  response.headers.set("Cache-Control", "no-store")
  return response
}
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const routedHost = (
    request.headers.get("x-dani-ricco-host") ||
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  ).split(":")[0].toLowerCase()

  const publicHost = PUBLIC_HOSTS.has(routedHost)
  const publicPath =
    pathname.startsWith("/site") ||
    pathname.startsWith("/bio") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/sem-acesso")
  if (publicHost || publicPath) {
    return pathname.startsWith("/login") || pathname.startsWith("/sem-acesso")
      ? noIndex(NextResponse.next())
      : NextResponse.next()
  }

  const publicAuthApi =
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout" ||
    pathname === "/api/auth/me"

  if (publicAuthApi) return noIndex(NextResponse.next())

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value)
  const isApi = pathname.startsWith("/api/")

  if (!session) {
    if (isApi) {
      return noIndex(NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }))
    }
    const login = request.nextUrl.clone()
    login.pathname = "/login"
    login.searchParams.set("next", pathname)
    return noIndex(NextResponse.redirect(login))
  }

  const feature = routeFeature(pathname)
  if (feature && !session.permissions.includes(feature)) {
    if (isApi) {
      return noIndex(NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }))
    }
    const denied = request.nextUrl.clone()
    denied.pathname = "/sem-acesso"
    denied.search = ""
    return noIndex(NextResponse.redirect(denied))
  }

  return noIndex(NextResponse.next())
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
