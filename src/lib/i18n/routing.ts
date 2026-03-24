import { defineRouting } from "next-intl/routing";

import { APP_SUPPORTED_LOCALES } from "./appLocales";

export const routing = defineRouting({
  locales: [...APP_SUPPORTED_LOCALES],
  defaultLocale: "ko",
  localePrefix: "as-needed",
});

export type AppLocaleType = (typeof routing.locales)[number];
