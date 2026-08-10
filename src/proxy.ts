import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session-token";

const PROTECTED_PREFIXES = ["/kampane", "/odberatelia", "/nastavenia"];

function isProtected(pathname: string): boolean {
  if (pathname === "/") return true;
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

// Next.js 16 konvencia: proxy.ts (nahradzuje middleware.ts)
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("bovap_session")?.value;
  const userId = token ? await verifySessionToken(token) : null;

  // Neprihlásený → login (zapamätáme si, kam chcel ísť)
  if (!userId && isProtected(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Prihlásený sa nepošle naspäť na login
  if (userId && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/kampane/:path*", "/odberatelia/:path*", "/nastavenia/:path*", "/login"],
};
