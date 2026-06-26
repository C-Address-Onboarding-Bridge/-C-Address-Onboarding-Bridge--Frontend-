import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, getLocaleFromAcceptLanguage, normalizeLocale } from "@/lib/i18n";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, API routes, and assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if the pathname already has a valid locale prefix
  const pathnameWithoutTrailing = pathname.replace(/\/+$/, "");
  const segments = pathnameWithoutTrailing.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const localeInPath = normalizeLocale(firstSegment);

  if (localeInPath) {
    return NextResponse.next();
  }

  // No locale prefix — redirect based on Accept-Language header
  const preferredLocale = getLocaleFromAcceptLanguage(request.headers.get("accept-language")) ?? defaultLocale;
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/${preferredLocale}${pathname === "/" ? "" : pathname}`;

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
