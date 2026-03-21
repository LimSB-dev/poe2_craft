import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { loadLocaleMessages } from "@/lib/i18n/loadLocaleMessages";
import { routing, type AppLocaleType } from "@/lib/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  return {
    locale,
    messages: await loadLocaleMessages(locale as AppLocaleType),
  };
});
