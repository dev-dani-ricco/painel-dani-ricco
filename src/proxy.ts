import { type NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const routedHost =
    request.headers.get("x-dani-ricco-host") ||
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""

  const response = NextResponse.next()

  if (routedHost.toLowerCase().startsWith("painel.daniricco.com.br")) {
    response.headers.set(
      "X-Robots-Tag",
      "noindex, nofollow, noarchive, nosnippet, noimageindex",
    )
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
