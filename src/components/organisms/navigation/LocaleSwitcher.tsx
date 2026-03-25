"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { routing } from "@/lib/i18n/routing";
import type { ChangeEvent, ReactElement } from "react";

import type { AbstractIntlMessages } from "next-intl";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setLocaleState } from "@/store/localeSlice";

export const LocaleSwitcher = (): ReactElement => {
  const t = useTranslations("simulator.localeSwitcher");
  const locale = useAppSelector((state) => state.locale.locale);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleChange = async (event: ChangeEvent<HTMLSelectElement>): Promise<void> => {
    const nextLocale = event.target.value;
    if (!routing.locales.includes(nextLocale as never)) {
      return;
    }

    document.cookie = `NEXT_LOCALE=${encodeURIComponent(nextLocale)}; Path=/; Max-Age=31536000; SameSite=Lax`;

    try {
      const response = await fetch(`/api/intl-bundle?locale=${encodeURIComponent(nextLocale)}`, {
        cache: "no-store",
      });
      if (response.ok) {
        const messages = (await response.json()) as AbstractIntlMessages;
        dispatch(setLocaleState({ locale: nextLocale as never, messages }));
      }
    } finally {
      router.refresh();
    }
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
