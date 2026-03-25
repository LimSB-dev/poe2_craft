"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { LocaleSwitcher } from "@/components/organisms/LocaleSwitcher";
import { DB_EQUIPMENT_SECTION_ORDER } from "@/constants/db";
import { Link } from "@/lib/i18n/navigation";
import { BASE_ITEM_SUB_TYPES_BY_EQUIPMENT } from "@/lib/poe2-item-simulator/baseItemDb";
import { itemClassToDbPathSegment } from "@/lib/poe2db/dbItemClassRoute";

export const DbItemClassHub = (): ReactElement => {
  const t = useTranslations("simulator");

  const subTypeLabel = (s: string): string => {
    try {
      return t(`itemClass.${s}`);
    } catch {
      return s;
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 dark:bg-black px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-7xl flex flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-sc text-2xl font-bold text-zinc-950 dark:text-zinc-50">
              {t("dbView.hubTitle")}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("dbView.hubDescription")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <LocaleSwitcher />
            <Link
              href="/"
              className="text-xs text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
            >
              ← {t("title")}
            </Link>
          </div>
        </header>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("dbView.hubRouteHint")}</p>

        <div className="flex flex-col gap-10">
          {DB_EQUIPMENT_SECTION_ORDER.map((equipment) => {
            const subTypes = BASE_ITEM_SUB_TYPES_BY_EQUIPMENT[
              equipment
            ] as readonly IBaseItemSubTypeType[];
            return (
              <section
                key={equipment}
                aria-labelledby={`db-hub-${equipment}`}
                className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              >
                <h2
                  id={`db-hub-${equipment}`}
                  className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-800 dark:border-zinc-800 dark:text-zinc-200"
                >
                  {t(`equipmentType.${equipment}`)}
                </h2>
                <ul className="grid gap-2 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {subTypes.map((subType) => {
                    const pathSeg = itemClassToDbPathSegment(subType);
                    return (
                      <li key={subType}>
                        <Link
                          href={`/db/${pathSeg}`}
                          className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:border-amber-400/70 hover:bg-amber-500/10 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:border-amber-500/50"
                        >
                          <span>{subTypeLabel(subType)}</span>
                          <span className="text-xs font-normal text-zinc-400" aria-hidden="true">
                            →
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

