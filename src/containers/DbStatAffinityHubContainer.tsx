"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { SiteTopBar } from "@/components/organisms";
import { Link } from "@/lib/i18n/navigation";
import { itemClassToDbPathSegment } from "@/lib/poe2db/dbItemClassRoute";
import { DB_ARMOUR_STAT_AFFINITY_VALUES } from "@/lib/poe2db/poe2dbStatAffinityPages";

export type DbStatAffinityHubContainerPropsType = {
  itemClass: IBaseItemSubTypeType;
};

export const DbStatAffinityHubContainer = ({
  itemClass,
}: DbStatAffinityHubContainerPropsType): ReactElement => {
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
    <>
      <header className="flex flex-col gap-2">
        <SiteTopBar
          pageHeading={t("dbView.statAffinityHubTitle", { label: classLabel })}
        />
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
      </header>

      <ul className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
    </>
  );
};

