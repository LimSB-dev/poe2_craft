"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { LocaleSwitcher } from "@/components/organisms/navigation/LocaleSwitcher";
import { Link } from "@/lib/i18n/navigation";

export const ItemSimulatorHeader = (): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorWorkspace");

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-2 min-w-0">
        <h1 className="font-sc text-2xl font-bold text-zinc-950 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 max-w-2xl">
          {t("intro")}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <LocaleSwitcher />
        <Link
          href="/strategy"
          className="text-sm font-medium text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
        >
          {t("nav.strategy")}
        </Link>
        <Link
          href="/rl"
          className="text-sm font-medium text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
        >
          {t("nav.rl")}
        </Link>
        <Link
          href="/optimizer"
          className="text-sm font-medium text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
        >
          {t("nav.optimizer")}
        </Link>
        <Link
          href="/crafting-lab"
          className="text-sm font-medium text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
        >
          {t("nav.craftingLab")}
        </Link>
        <Link
          href="/db"
          className="text-sm font-medium text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
        >
          {t("nav.db")}
        </Link>
      </div>
    </header>
  );
};
