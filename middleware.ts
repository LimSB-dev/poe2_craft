import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/lib/i18n/routing";

const LOCALE_COOKIE_KEY = "NEXT_LOCALE";

const hasLocalePrefix = (pathname: string): boolean => {
  return routing.locales.some((loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`));
};

const shouldIgnorePath = (pathname: string): boolean => {
  if (pathname.startsWith("/api/")) {
    return true;
  }
  if (pathname.startsWith("/_next/")) {
    return true;
  }
  if (pathname === "/favicon.ico") {
    return true;
  }
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") {
    return true;
  }
  return false;
};

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  if (shouldIgnorePath(pathname)) {
    return NextResponse.next();
  }
  if (hasLocalePrefix(pathname)) {
    return NextResponse.next();
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE_KEY)?.value ?? "";
  const resolvedLocale = routing.locales.includes(cookieLocale as never)
    ? (cookieLocale as (typeof routing.locales)[number])
    : routing.defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname = `/${resolvedLocale}${pathname}`;

  return NextResponse.rewrite(url);
};

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};

