import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { loadLocaleMessages } from "@/lib/i18n/loadLocaleMessages";
import { routing, type AppLocaleType } from "@/lib/i18n/routing";

const LOCALE_COOKIE_KEY = "NEXT_LOCALE";

const resolveLocaleFromCookie = async (): Promise<string> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE_KEY)?.value;
  if (
    raw !== undefined &&
    raw !== "" &&
    hasLocale(routing.locales, raw)
  ) {
    return raw;
  }
  return routing.defaultLocale;
};

export default getRequestConfig(async ({ requestLocale }) => {
  const segmentLocale = await requestLocale;
  const locale =
    segmentLocale !== undefined && hasLocale(routing.locales, segmentLocale)
      ? segmentLocale
      : await resolveLocaleFromCookie();

  return {
    locale,
    messages: await loadLocaleMessages(locale as AppLocaleType),
  };
});
