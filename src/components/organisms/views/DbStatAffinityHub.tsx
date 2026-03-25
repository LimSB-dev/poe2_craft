"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { LocaleSwitcher } from "@/components/organisms/navigation/LocaleSwitcher";
import { Link } from "@/lib/i18n/navigation";
import { itemClassToDbPathSegment } from "@/lib/poe2db/dbItemClassRoute";
import { DB_ARMOUR_STAT_AFFINITY_VALUES } from "@/lib/poe2db/poe2dbStatAffinityPages";

export type DbStatAffinityHubPropsType = {
  itemClass: IBaseItemSubTypeType;
};

export const DbStatAffinityHub = ({ itemClass }: DbStatAffinityHubPropsType): ReactElement => {
  const t = useTranslations("simulator");

  const classLabel = (() => {
    try {
      return t(`itemClass.${itemClass}`);
    } catch {
      return itemClass;
    }
  })();

  const pathSeg = itemClassToDbPathSegment(itemClass);

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 dark:bg-black px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <Link
                href="/db"
                className="text-amber-700 underline-offset-2 hover:underline dark:text-amber-400"
              >
                {t("dbView.hubTitle")}
              </Link>
              <span aria-hidden="true"> / </span>
              <span className="text-zinc-600 dark:text-zinc-300">{classLabel}</span>
            </p>
            <h1 className="font-sc text-2xl font-bold text-zinc-950 dark:text-zinc-50">
              {t("dbView.statAffinityHubTitle", { label: classLabel })}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("dbView.statAffinityHubDescription")}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end shrink-0">
            <LocaleSwitcher />
            <Link
              href="/"
              className="text-xs text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
            >
              ← {t("title")}
            </Link>
          </div>
        </header>

        <ul className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-2">
          {DB_ARMOUR_STAT_AFFINITY_VALUES.map((affinity) => {
            return (
              <li key={affinity}>
                <Link
                  href={`/db/${pathSeg}/${affinity}`}
                  className="flex h-full min-h-[3rem] w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:border-amber-400/70 hover:bg-amber-500/10 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:border-amber-500/50"
                >
                  <span>{t(`dbView.statAffinity.${affinity}`)}</span>
                  <span className="text-xs font-normal text-zinc-400" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

