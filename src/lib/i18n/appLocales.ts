/**
 * Supported UI locales (aligned with next-intl routing).
 * Kept free of `next-intl` imports so Jest and pure `lib/` modules can depend on it.
 */
export const APP_SUPPORTED_LOCALES = ["en", "ko", "ja", "zh-CN"] as const;

export type AppSupportedLocaleType = (typeof APP_SUPPORTED_LOCALES)[number];

export const resolveAppSupportedLocale = (
  locale: string,
): AppSupportedLocaleType => {
  if ((APP_SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    return locale as AppSupportedLocaleType;
  }
  return "en";
};
