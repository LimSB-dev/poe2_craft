import { hasLocale } from "next-intl";
import { NextResponse } from "next/server";
import { loadLocaleMessages } from "@/lib/i18n/loadLocaleMessages";
import { routing, type AppLocaleType } from "@/lib/i18n/routing";

const getLocaleFromSearchParams = (searchParams: URLSearchParams): AppLocaleType => {
  const raw = searchParams.get("locale");
  if (raw && hasLocale(routing.locales, raw)) {
    return raw;
  }
  return routing.defaultLocale;
};

const GET = async (request: Request): Promise<NextResponse> => {
  const { searchParams } = new URL(request.url);
  const locale = getLocaleFromSearchParams(searchParams);
  const messages = await loadLocaleMessages(locale);
  return NextResponse.json(messages);
};

export { GET };
