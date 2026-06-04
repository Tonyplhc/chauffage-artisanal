import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware Edge — check d'existence du cookie de session uniquement.
 * La vérification HMAC se fait dans chaque route serveur via requireAdminApi.
 */

const SESSION_COOKIE = "ca-admin-session";

const PROTECTED = [/^\/admin(\/|$)/, /^\/api\/admin(\/|$)/];
const PUBLIC_UNDER_ADMIN = [
  /^\/admin\/login$/,
  /^\/api\/admin\/login$/,
  /^\/api\/admin\/logout$/,
  /^\/api\/admin\/users\/probe$/,
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED.some((r) => r.test(pathname))) return NextResponse.next();
  if (PUBLIC_UNDER_ADMIN.some((r) => r.test(pathname))) return NextResponse.next();

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
