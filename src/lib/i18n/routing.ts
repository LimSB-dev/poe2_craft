import { defineRouting } from "next-intl/routing";

import { APP_SUPPORTED_LOCALES } from "@/lib/i18n/appLocales";

export const routing = defineRouting({
  locales: [...APP_SUPPORTED_LOCALES],
  defaultLocale: "ko",
  localePrefix: "never",
});

export type AppLocaleType = (typeof routing.locales)[number];
