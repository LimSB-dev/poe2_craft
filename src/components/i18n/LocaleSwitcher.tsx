"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import type { ChangeEvent, ReactElement } from "react";

export const LocaleSwitcher = (): ReactElement => {
  const t = useTranslations("simulator.localeSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const nextLocale = event.target.value;
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <label className="flex items-center gap-2 text-sm shrink-0">
      <span className="text-zinc-600 dark:text-zinc-400">{t("label")}</span>
      <select
        value={locale}
        onChange={handleChange}
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm"
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {t(`localeNames.${loc}`)}
          </option>
        ))}
      </select>
    </label>
  );
};
