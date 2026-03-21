import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ko", "ja", "zh-CN"],
  defaultLocale: "ko",
  localePrefix: "as-needed",
});

export type AppLocaleType = (typeof routing.locales)[number];
