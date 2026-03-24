"use client";

import { Fragment, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import { getModTypeDisplayName } from "@/lib/poe2-item-simulator/modTypeLabels";
import type { IModDbRecordType } from "@/lib/poe2-item-simulator/modDb";
import {
  buildModStatDisplayLines,
  getModTierDisplayRows,
} from "@/lib/poe2-item-simulator/modDbTierDisplay";

export type DbModsTablePropsType = {
  records: readonly IModDbRecordType[];
  locale: string;
};

export const DbModsTable = ({ records, locale }: DbModsTablePropsType): ReactElement => {
  const t = useTranslations("simulator");
  const [expandedModKey, setExpandedModKey] = useState<string | null>(null);

  const modName = (key: string): string => {
    try {
      return t(`mods.${key}` as never);
    } catch {
      return key;
    }
  };

  const subTypeLabel = (s: string): string => {
    try {
      return t(`itemClass.${s}`);
    } catch {
      return s;
    }
  };

  const toggleMod = (modKey: string): void => {
    setExpandedModKey((previous) => {
      if (previous === modKey) {
        return null;
      }
      return modKey;
    });
  };

  const tierRowsCache = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getModTierDisplayRows>>();
    for (const record of records) {
      map.set(record.modKey, getModTierDisplayRows(record));
    }
    return map;
  }, [records]);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">
            {t("dbView.colName")}
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">
            {t("dbView.colModType")}
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">
            {t("dbView.colTags")}
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">
            {t("dbView.colStatReq")}
          </th>
          <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">
            {t("dbView.colTiers")}
          </th>
          <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">
            {t("dbView.colWeight")}
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">
            {t("dbView.colApplicable")}
          </th>
        </tr>
      </thead>
      <tbody>
        {records.map((record, rowIndex) => {
          const isExpanded = expandedModKey === record.modKey;
          const displayName = modName(record.nameTemplateKey);
          const tierRows = tierRowsCache.get(record.modKey) ?? [];
          const hasSynthetic = tierRows.some((row) => row.isSynthetic);
          const sortedTierRows = [...tierRows].sort((a, b) => b.tier - a.tier);
          const modTemplate = modName(record.nameTemplateKey);

          return (
            <Fragment key={record.modKey}>
              <tr
                className={`border-b border-zinc-100 dark:border-zinc-800 last:border-0 ${
                  rowIndex % 2 === 0 ? "" : "bg-zinc-50/50 dark:bg-zinc-900/30"
                }`}
              >
                <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                  <button
                    type="button"
                    className="group flex w-full max-w-md items-start gap-2 rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                    onClick={() => {
                      toggleMod(record.modKey);
                    }}
                    aria-expanded={isExpanded}
                    aria-controls={`db-mod-tier-panel-${record.modKey}`}
                    id={`db-mod-tier-trigger-${record.modKey}`}
                    aria-label={
                      isExpanded
                        ? t("dbView.modTierCollapseAria", { name: displayName })
                        : t("dbView.modTierExpandAria", { name: displayName })
                    }
                  >
                    <span
                      className="mt-0.5 inline-block shrink-0 text-zinc-400 transition-transform group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                      aria-hidden="true"
                    >
                      {isExpanded ? "▼" : "▶"}
                    </span>
                    <span className="min-w-0 underline-offset-2 group-hover:underline">
                      {displayName}
                    </span>
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      record.modType === "prefix"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        : record.modType === "suffix"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                          : record.modType === "corruptedPrefix"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    }`}
                  >
                    {getModTypeDisplayName(record.modType, locale)}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {record.modTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    {record.requiredItemTags.length === 0 ? (
                      <span className="text-zinc-300 dark:text-zinc-700 text-xs">–</span>
                    ) : (
                      record.requiredItemTags.map((tag) => (
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
                          {tag.toUpperCase()}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300 font-medium">
                  {record.tierCount}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                  {record.totalWeight.toLocaleString()}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {record.applicableSubTypes.map((subType) => (
                      <span
                        key={subType}
                        className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                      >
                        {subTypeLabel(subType)}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
              {isExpanded ? (
                <tr
                  className={`border-b border-zinc-200 dark:border-zinc-800 ${
                    rowIndex % 2 === 0 ? "" : "bg-zinc-50/50 dark:bg-zinc-900/30"
                  }`}
                >
                  <td colSpan={7} className="px-0 py-0">
                    <div
                      id={`db-mod-tier-panel-${record.modKey}`}
                      role="region"
                      aria-labelledby={`db-mod-tier-trigger-${record.modKey}`}
                      className="border-t border-zinc-200 bg-zinc-50/90 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      {hasSynthetic ? (
                        <p className="mb-3 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                          {t("dbView.tierSyntheticDisclaimer")}
                        </p>
                      ) : null}
                      <div className="overflow-x-auto rounded-xl border border-zinc-700/80 bg-zinc-950/80 dark:border-zinc-700 dark:bg-zinc-950/90">
                        <table className="w-full min-w-[min(100%,52rem)] text-left text-[13px]">
                          <thead>
                            <tr className="border-b border-zinc-700/90 bg-zinc-900/90 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                              <th scope="col" className="px-3 py-2.5 pl-4">
                                {t("dbView.tierColTier")}
                              </th>
                              <th scope="col" className="px-3 py-2.5">
                                {t("dbView.tierColAffix")}
                              </th>
                              <th scope="col" className="px-3 py-2.5 text-right tabular-nums">
                                {t("dbView.tierColItemLevel")}
                              </th>
                              <th scope="col" className="min-w-[12rem] px-3 py-2.5">
                                {t("dbView.tierColModifier")}
                              </th>
                              <th scope="col" className="px-3 py-2.5 text-right">
                                {t("dbView.tierColWeight")}
                              </th>
                              <th scope="col" className="w-10 px-2 py-2.5">
                                <span className="sr-only">{t("dbView.tierInfoAria")}</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/90">
                            {sortedTierRows.map((tierRow) => {
                              const { lines, isPending } = buildModStatDisplayLines(
                                modTemplate,
                                tierRow.statRanges,
                              );
                              const showPendingLine = isPending || lines.length === 0;
                              return (
                                <tr
                                  key={`${record.modKey}-t${String(tierRow.tier)}`}
                                  className="align-top text-zinc-200"
                                >
                                  <td className="px-3 py-3 pl-4 align-middle">
                                    <span className="inline-flex min-w-[2.75rem] justify-center rounded-md border border-zinc-600/90 bg-zinc-800/95 px-2 py-1 text-xs font-bold tabular-nums text-zinc-100">
                                      T{tierRow.tier}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 align-middle text-zinc-500">
                                    {t("dbView.tierAffixPlaceholder")}
                                  </td>
                                  <td className="px-3 py-3 align-middle text-right text-sm tabular-nums text-zinc-300">
                                    {tierRow.levelRequirement}
                                  </td>
                                  <td className="px-3 py-3 align-middle">
                                    <div className="flex flex-col gap-2">
                                      {showPendingLine ? (
                                        <p className="text-xs italic leading-snug text-zinc-500">
                                          {t("dbView.tierStatsPending")}
                                        </p>
                                      ) : (
                                        <ul className="flex flex-col gap-1.5">
                                          {lines.map((line) => {
                                            return (
                                              <li
                                                key={`${record.modKey}-t${String(tierRow.tier)}-${line}`}
                                                className="leading-snug text-zinc-100"
                                              >
                                                {line}
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      )}
                                      {record.modTags.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                                          {record.modTags.map((tag) => (
                                            <span
                                              key={tag}
                                              className="inline-flex rounded-full bg-sky-950/90 px-2 py-0.5 text-[11px] font-medium text-sky-200 ring-1 ring-sky-700/50"
                                            >
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 align-middle text-right">
                                    <span className="inline-flex min-w-[2.75rem] justify-center rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-semibold tabular-nums text-amber-200 ring-1 ring-amber-400/35">
                                      {tierRow.weight.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="px-2 py-3 align-middle text-center">
                                    <span
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600 text-[11px] font-semibold text-zinc-500"
                                      title={t("dbView.tierInfoAria")}
                                      aria-hidden="true"
                                    >
                                      i
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          );
        })}
        {records.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
              {t("baseFilter.noResults")}
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
};
