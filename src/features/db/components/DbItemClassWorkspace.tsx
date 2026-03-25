"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { LocaleSwitcher } from "@/components/organisms/LocaleSwitcher";
import { DB_MOD_PAGE_SIZE } from "@/constants/db";
import { Link } from "@/lib/i18n/navigation";
import {
  BASE_ITEM_DB,
  BASE_ITEM_SUB_TYPES_BY_EQUIPMENT,
} from "@/lib/poe2-item-simulator/baseItemDb";
import {
  formatBaseItemRequirementSummary,
  getAttributeRequirementPrefix,
} from "@/lib/poe2-item-simulator/coreAttributeLabels";
import { getModTypeDisplayName } from "@/lib/poe2-item-simulator/modTypeLabels";
import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";
import { itemClassToDbPathSegment } from "@/lib/poe2db/dbItemClassRoute";
import {
  POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE,
  resolvePoe2DbPathLocale,
} from "@/lib/poe2db/poe2dbItemClassPageUrl";
import {
  buildPoe2DbStatAffinitySourceSlug,
  DB_ARMOUR_STAT_AFFINITY_VALUES,
  matchesBaseItemToArmourStatAffinity,
  subTypeUsesPoe2DbStatAffinityPages,
} from "@/lib/poe2db/poe2dbStatAffinityPages";
import { toViewRecordsFromPoe2Db } from "@/lib/poe2db/toViewRecordsFromPoe2Db";

import { DbModsTable } from "./DbModsTable";

type ModSectionFilterType =
  | "all"
  | "normal"
  | "corrupted"
  | "desecrated"
  | "essence"
  | "perfect_essence"
  | "socketable"
  | "bonded"
  | "legacy";

const SUB_TYPE_TO_EQUIPMENT_LABEL = new Map<IBaseItemSubTypeType, IBaseItemEquipmentTypeType>(
  (
    Object.entries(BASE_ITEM_SUB_TYPES_BY_EQUIPMENT) as [
      IBaseItemEquipmentTypeType,
      readonly IBaseItemSubTypeType[],
    ][]
  ).flatMap(([equipmentType, subTypes]) => {
    return subTypes.map((subType) => {
      return [subType, equipmentType] as const;
    });
  }),
);

export type DbItemClassWorkspacePropsType = {
  itemClass: IBaseItemSubTypeType;
  /** When set (armour + PoE2DB stat page), bases and PoE2DB rows match that affinity (e.g. `Gloves_str_dex`). */
  statAffinity?: DbArmourStatAffinityRouteType;
};

export const DbItemClassWorkspace = ({
  itemClass,
  statAffinity,
}: DbItemClassWorkspacePropsType): ReactElement => {
  const locale = useLocale();
  const t = useTranslations("simulator");

  const [modTypeFilter, setModTypeFilter] = useState<
    "all" | "prefix" | "suffix" | "corruptedPrefix" | "corruptedSuffix"
  >("all");
  const [modSectionFilter, setModSectionFilter] = useState<ModSectionFilterType>("all");
  const [modPage, setModPage] = useState(1);
  const [search, setSearch] = useState<string>("");
  const [remoteModPayload, setRemoteModPayload] = useState<Poe2DbModifierApiResponseType | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;

    const load = async (): Promise<void> => {
      try {
        const response = await fetch("/api/db/poe2db-modifiers", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as Poe2DbModifierApiResponseType;
        if (!mounted) {
          return;
        }
        setRemoteModPayload(payload);
      } catch {
        // Keep local MOD_DB fallback when API or generated file is unavailable.
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const modRecords = useMemo(() => {
    if (remoteModPayload === null) {
      return MOD_DB.records;
    }
    let rows = remoteModPayload.rows;
    if (statAffinity !== undefined) {
      const slug = buildPoe2DbStatAffinitySourceSlug(itemClass, statAffinity);
      if (slug !== null) {
        rows = rows.filter((row) => {
          return row.sourcePageSlug === slug;
        });
      }
    }
    return toViewRecordsFromPoe2Db({
      ...remoteModPayload,
      rows,
      rowCount: rows.length,
    });
  }, [remoteModPayload, itemClass, statAffinity]);

  const poe2dbModifiersCalcUrl = useMemo(() => {
    const pathLocale = resolvePoe2DbPathLocale(locale);
    if (statAffinity !== undefined) {
      const slug = buildPoe2DbStatAffinitySourceSlug(itemClass, statAffinity);
      if (slug === null) {
        return null;
      }
      return `https://poe2db.tw/${pathLocale}/${slug}#ModifiersCalc`;
    }
    const wikiSlug = POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE[itemClass];
    return `https://poe2db.tw/${pathLocale}/${wikiSlug}#ModifiersCalc`;
  }, [locale, itemClass, statAffinity]);

  const getRecordSection = (record: IModDbRecordType): ModSectionFilterType => {
    if (record.modKey.startsWith("poe2db__")) {
      const section = record.modKey.split("__")[1];
      switch (section) {
        case "normal":
        case "corrupted":
        case "desecrated":
        case "essence":
        case "perfect_essence":
        case "socketable":
        case "bonded":
          return section;
        default:
          return "legacy";
      }
    }
    return "legacy";
  };

  const classLabel = (() => {
    try {
      return t(`itemClass.${itemClass}`);
    } catch {
      return itemClass;
    }
  })();

  const equipmentKey = SUB_TYPE_TO_EQUIPMENT_LABEL.get(itemClass);
  const equipmentLabel =
    equipmentKey !== undefined
      ? (() => {
          try {
            return t(`equipmentType.${equipmentKey}`);
          } catch {
            return equipmentKey;
          }
        })()
      : "";

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BASE_ITEM_DB.records.filter((r) => {
      if (r.subType !== itemClass) {
        return false;
      }
      if (statAffinity !== undefined) {
        if (!matchesBaseItemToArmourStatAffinity(r.statTags, statAffinity)) {
          return false;
        }
      }
      if (q) {
        const name = (() => {
          try {
            return t(`baseItems.${r.baseItemKey}.name`).toLowerCase();
          } catch {
            return r.baseItemKey.toLowerCase();
          }
        })();
        if (!name.includes(q) && !r.baseItemKey.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [itemClass, statAffinity, search, t]);

  const availableModSections = useMemo(() => {
    const forClass = modRecords.filter((r) => {
      return r.applicableSubTypes.includes(itemClass);
    });
    const set = new Set<ModSectionFilterType>();
    for (const record of forClass) {
      set.add(getRecordSection(record));
    }
    return Array.from(set).sort();
  }, [modRecords, itemClass]);

  const filteredMods = useMemo(() => {
    const q = search.trim().toLowerCase();
    const resolveModLabel = (templateKey: string, fallbackKey: string): string => {
      if (!/^[A-Za-z0-9_.-]+$/.test(templateKey)) {
        return templateKey;
      }
      if (typeof t.has === "function" && !t.has(`mods.${templateKey}` as never)) {
        return fallbackKey;
      }
      try {
        return t(`mods.${templateKey}` as never).toLowerCase();
      } catch {
        return fallbackKey;
      }
    };
    return modRecords.filter((r) => {
      if (!r.applicableSubTypes.includes(itemClass)) {
        return false;
      }
      if (modTypeFilter !== "all" && r.modType !== modTypeFilter) {
        return false;
      }
      if (modSectionFilter !== "all" && getRecordSection(r) !== modSectionFilter) {
        return false;
      }
      if (q) {
        const name = resolveModLabel(r.nameTemplateKey, r.modKey).toLowerCase();
        if (!name.includes(q) && !r.modKey.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [modRecords, itemClass, modTypeFilter, modSectionFilter, search, t]);

  const dbPathSeg = itemClassToDbPathSegment(itemClass);

  const modTotalPages = Math.max(1, Math.ceil(filteredMods.length / DB_MOD_PAGE_SIZE));
  const safeModPage = Math.min(modPage, modTotalPages);
  const pagedMods = filteredMods.slice(
    (safeModPage - 1) * DB_MOD_PAGE_SIZE,
    safeModPage * DB_MOD_PAGE_SIZE,
  );

  const itemName = (key: string): string => {
    try {
      return t(`baseItems.${key}.name`);
    } catch {
      return key;
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 dark:bg-black px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-7xl flex flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <Link
                href="/db"
                className="text-amber-700 underline-offset-2 hover:underline dark:text-amber-400"
              >
                {t("dbView.hubTitle")}
              </Link>
              <span aria-hidden="true"> / </span>
              {statAffinity !== undefined && subTypeUsesPoe2DbStatAffinityPages(itemClass) ? (
                <>
                  <Link
                    href={`/db/${dbPathSeg}`}
                    className="text-amber-700 underline-offset-2 hover:underline dark:text-amber-400"
                  >
                    {classLabel}
                  </Link>
                  <span aria-hidden="true"> / </span>
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {t(`dbView.statAffinity.${statAffinity}`)}
                  </span>
                </>
              ) : (
                <span className="text-zinc-600 dark:text-zinc-300">{classLabel}</span>
              )}
            </p>
            <h1 className="font-sc text-2xl font-bold text-zinc-950 dark:text-zinc-50">
              {statAffinity !== undefined
                ? t("dbView.itemClassStatPageHeading", {
                    label: classLabel,
                    stat: t(`dbView.statAffinity.${statAffinity}`),
                  })
                : t("dbView.itemClassPageHeading", { label: classLabel })}
            </h1>
            {equipmentLabel.length > 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{equipmentLabel}</p>
            ) : null}
            {statAffinity !== undefined && subTypeUsesPoe2DbStatAffinityPages(itemClass) ? (
              <nav className="flex flex-wrap gap-2 text-sm" aria-label={t("dbView.statAffinityNavAria")}>
                {DB_ARMOUR_STAT_AFFINITY_VALUES.map((affinity) => {
                  const isCurrent = affinity === statAffinity;
                  return (
                    <Link
                      key={affinity}
                      href={`/db/${dbPathSeg}/${affinity}`}
                      className={
                        isCurrent
                          ? "rounded-md bg-amber-500/15 px-2 py-1 font-semibold text-amber-800 dark:text-amber-200"
                          : "rounded-md px-2 py-1 text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
                      }
                      aria-current={isCurrent ? "page" : undefined}
                    >
                      {t(`dbView.statAffinity.${affinity}`)}
                    </Link>
                  );
                })}
              </nav>
            ) : null}
            {poe2dbModifiersCalcUrl !== null ? (
              <p>
                <a
                  href={poe2dbModifiersCalcUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-700 underline-offset-2 hover:underline dark:text-amber-400"
                >
                  {t("dbView.openPoe2dbModifiersCalc")}
                </a>
              </p>
            ) : null}
            <nav className="flex flex-wrap gap-3 text-sm" aria-label={t("dbView.itemClassNavAria")}>
              <a
                href="#BaseItems"
                className="text-amber-700 underline-offset-2 hover:underline dark:text-amber-400"
              >
                {t("dbView.sectionBaseItems")}
              </a>
              <a
                href="#ModifiersCalc"
                className="text-amber-700 underline-offset-2 hover:underline dark:text-amber-400"
              >
                {t("dbView.sectionModifiersCalc")}
              </a>
            </nav>
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

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onFocus={(e) => {
              e.target.select();
            }}
            onChange={(e) => {
              setSearch(e.target.value);
              setModPage(1);
            }}
            placeholder={t("dbView.searchPlaceholder")}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm w-48 md:w-56"
          />
          <select
            value={modTypeFilter}
            onChange={(e) => {
              setModTypeFilter(
                e.target.value as "all" | "prefix" | "suffix" | "corruptedPrefix" | "corruptedSuffix",
              );
              setModPage(1);
            }}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
          >
            <option value="all">{t("baseFilter.all")}</option>
            <option value="prefix">{getModTypeDisplayName("prefix", locale)}</option>
            <option value="suffix">{getModTypeDisplayName("suffix", locale)}</option>
            <option value="corruptedPrefix">{getModTypeDisplayName("corruptedPrefix", locale)}</option>
            <option value="corruptedSuffix">{getModTypeDisplayName("corruptedSuffix", locale)}</option>
          </select>
          <select
            value={modSectionFilter}
            onChange={(e) => {
              setModSectionFilter(e.target.value as ModSectionFilterType);
              setModPage(1);
            }}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
          >
            <option value="all">{t("dbView.modSectionAll")}</option>
            {availableModSections.map((section) => (
              <option key={section} value={section}>
                {t(`dbView.modSection.${section}` as never)}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-400 ml-auto tabular-nums">
            {t("dbView.itemClassCounts", {
              bases: filteredItems.length,
              mods: filteredMods.length,
            })}
          </span>
        </div>

        <section
          id="BaseItems"
          aria-labelledby="db-base-items-heading"
          className="scroll-mt-20 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
        >
          <div className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
            <h2
              id="db-base-items-heading"
              className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
            >
              {t("dbView.sectionBaseItems")}{" "}
              <span className="font-normal text-zinc-500 dark:text-zinc-400">
                ({filteredItems.length})
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">
                    {t("dbView.colName")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">
                    {t("dbView.colStatTags")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">
                    {t("dbView.colArmour")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">
                    {t("dbView.colEvasion")}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">
                    {t("dbView.colES")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">
                    {t("dbView.colReq")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((r, i) => (
                  <tr
                    key={r.baseItemKey}
                    className={`border-b border-zinc-100 dark:border-zinc-800 last:border-0 ${
                      i % 2 === 0 ? "" : "bg-zinc-50/50 dark:bg-zinc-900/30"
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {itemName(r.baseItemKey)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        {r.statTags.map((tag) => (
                          <span
                            key={tag}
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${
                              tag === "str"
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                                : tag === "dex"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                  : "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                            }`}
                          >
                            {getAttributeRequirementPrefix(tag, locale)}
                          </span>
                        ))}
                        {r.statTags.length === 0 && (
                          <span className="text-zinc-300 dark:text-zinc-700 text-xs">–</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {r.armour !== undefined ? (
                        <span className="text-amber-600 dark:text-amber-400">{r.armour}</span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">–</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {r.evasion !== undefined ? (
                        <span className="text-green-600 dark:text-green-400">{r.evasion}</span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">–</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {r.energyShield !== undefined ? (
                        <span className="text-sky-600 dark:text-sky-400">{r.energyShield}</span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">–</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">
                      {formatBaseItemRequirementSummary(r, locale)}
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                      {t("baseFilter.noResults")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section
          id="ModifiersCalc"
          aria-labelledby="db-modifiers-heading"
          className="scroll-mt-20 flex flex-col gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
        >
          <div className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
            <h2
              id="db-modifiers-heading"
              className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
            >
              {t("dbView.sectionModifiersCalc")}{" "}
              <span className="font-normal text-zinc-500 dark:text-zinc-400">
                ({filteredMods.length})
              </span>
            </h2>
          </div>
          {filteredMods.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {t("baseFilter.noResults")}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-end gap-2 px-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModPage((p) => {
                      return Math.max(1, p - 1);
                    });
                  }}
                  disabled={safeModPage <= 1}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
                >
                  {t("dbView.paginationPrev")}
                </button>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t("dbView.paginationPage", { page: safeModPage, total: modTotalPages })}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setModPage((p) => {
                      return Math.min(modTotalPages, p + 1);
                    });
                  }}
                  disabled={safeModPage >= modTotalPages}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
                >
                  {t("dbView.paginationNext")}
                </button>
              </div>
              <div className="overflow-x-auto px-2 pb-4">
                <DbModsTable records={pagedMods} locale={locale} />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

