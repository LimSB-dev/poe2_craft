"use client";

import { Fragment, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import {
  BASE_ITEM_SUB_TYPES_BY_EQUIPMENT,
} from "@/lib/poe2-item-simulator/baseItemDb";
import { getModTypeDisplayName } from "@/lib/poe2-item-simulator/modTypeLabels";
import {
  buildModStatDisplayLines,
  getModTierDisplayRows,
} from "@/lib/poe2-item-simulator/modDbTierDisplay";
import { wikiTierSpawnContextFromBaseFilters } from "@/lib/poe2-item-simulator/wikiTierSpawnFilter";

export type DbModsTableViewContextType = {
  baseItemSubType: IBaseItemSubTypeType;
  itemStatTags: ReadonlyArray<IBaseItemStatTagType>;
};

export type DbModsTablePropsType = {
  records: readonly IModDbRecordType[];
  locale: string;
  /**
   * Current DB page (item class + optional armour stat affinity). When set, tier counts / weights /
   * T1 req. ilvl follow `mod_spawn_weights` for that slot (PoE2DB parity).
   */
  viewContext?: DbModsTableViewContextType;
};

type TierBucketType = "weapon" | "nonWeapon";

type GroupedModRowType = {
  groupKey: string;
  weaponRecords: IModDbRecordType[];
  nonWeaponRecords: IModDbRecordType[];
  displayRecord: IModDbRecordType;
  applicableSubTypes: string[];
  tierCount: number;
  totalWeight: number;
  /** Merged per-sub-type max tier rung counts (T1…Tn). */
  maxTierBySubType: Map<string, number>;
};

const SUB_TYPE_TO_EQUIPMENT_MAP = new Map<string, IBaseItemEquipmentTypeType>(
  Object.entries(BASE_ITEM_SUB_TYPES_BY_EQUIPMENT).flatMap(([equipmentType, subTypes]) => {
    return subTypes.map((subType) => {
      return [subType, equipmentType as IBaseItemEquipmentTypeType] as const;
    });
  }),
);

const ONE_HAND_SUB_TYPE_SET = new Set<string>([
  "claw",
  "dagger",
  "wand",
  "oneHandSword",
  "oneHandAxe",
  "oneHandMace",
  "sceptre",
  "spear",
  "flail",
  "talisman",
  "trap",
]);

const TWO_HAND_SUB_TYPE_SET = new Set<string>([
  "bow",
  "staff",
  "twoHandSword",
  "twoHandAxe",
  "twoHandMace",
  "quarterstaff",
  "crossbow",
]);

/** 위키 `mods.mod_groups` — DB 뷰에서 출혈/중독/점화 3 modKey를 한 행으로 묶는다(PoE2DB ModsView 묶음 표기와 동일). */
const REDUCED_AILMENT_DURATION_FAMILY = "ReducedAilmentDuration";

const dbViewGroupingTemplateKey = (record: IModDbRecordType): string => {
  if (record.modFamilyKey === REDUCED_AILMENT_DURATION_FAMILY) {
    return REDUCED_AILMENT_DURATION_FAMILY;
  }
  return record.nameTemplateKey;
};

const isReducedAilmentDurationFamilyGroup = (records: readonly IModDbRecordType[]): boolean => {
  return (
    records.length >= 2 &&
    records.every((r) => {
      return r.modFamilyKey === REDUCED_AILMENT_DURATION_FAMILY;
    })
  );
};

const sumFirstTierDisplayWeights = (
  records: readonly IModDbRecordType[],
  cache: ReadonlyMap<string, ReturnType<typeof getModTierDisplayRows>>,
): number => {
  return records.reduce((sum, r) => {
    const rows = cache.get(r.modKey) ?? [];
    const asc = [...rows].sort((a, b) => {
      return a.tier - b.tier;
    });
    return sum + (asc[0]?.weight ?? 0);
  }, 0);
};

const bumpMaxTierFromRecord = (
  record: IModDbRecordType,
  target: Map<string, number>,
): void => {
  if (record.maxTierBySubType !== undefined) {
    for (const st of record.applicableSubTypes) {
      const count = record.maxTierBySubType[st] ?? record.tierCount;
      target.set(st, Math.max(target.get(st) ?? 0, count));
    }
    return;
  }
  for (const st of record.applicableSubTypes) {
    target.set(st, Math.max(target.get(st) ?? 0, record.tierCount));
  }
};

const maxTierDepthForRecord = (record: IModDbRecordType): number => {
  if (record.applicableSubTypes.length === 0) {
    return record.tierCount;
  }
  return Math.max(
    ...record.applicableSubTypes.map((st) => {
      return record.maxTierBySubType?.[st] ?? record.tierCount;
    }),
  );
};

export const DbModsTable = ({
  records,
  locale,
  viewContext,
}: DbModsTablePropsType): ReactElement => {
  const t = useTranslations("simulator");
  const [expandedModKey, setExpandedModKey] = useState<string | null>(null);
  const [bucketByGroupKey, setBucketByGroupKey] = useState<Partial<Record<string, TierBucketType>>>(
    {},
  );

  const modName = (key: string): string => {
    // Remote rows may provide display text directly instead of i18n key.
    if (!/^[A-Za-z0-9_.-]+$/.test(key)) {
      return key;
    }
    if (typeof t.has === "function" && !t.has(`mods.${key}` as never)) {
      return key;
    }
    try {
      return t(`mods.${key}` as never);
    } catch {
      return key;
    }
  };

  const subTypeLabel = (s: string): string => {
    if (typeof t.has === "function" && !t.has(`itemClass.${s}` as never)) {
      return s;
    }
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

  const toBucket = (record: IModDbRecordType): TierBucketType => {
    const hasWeapon = record.applicableSubTypes.some((subType) => {
      return SUB_TYPE_TO_EQUIPMENT_MAP.get(subType) === "weapon";
    });
    if (hasWeapon) {
      return "weapon";
    }
    return "nonWeapon";
  };

  const getWeaponGroupLabel = (subTypes: readonly string[]): string | null => {
    const hasOneHand = subTypes.some((subType) => {
      return ONE_HAND_SUB_TYPE_SET.has(subType);
    });
    const hasTwoHand = subTypes.some((subType) => {
      return TWO_HAND_SUB_TYPE_SET.has(subType);
    });
    if (hasOneHand && !hasTwoHand) {
      return "한손 무기 티어";
    }
    if (hasTwoHand && !hasOneHand) {
      return "양손 무기 티어";
    }
    if (hasOneHand && hasTwoHand) {
      return "무기 혼합 티어";
    }
    return null;
  };

  const sectionKey = (record: IModDbRecordType): string => {
    if (record.modKey.startsWith("poe2db__")) {
      return record.modKey.split("__")[1] ?? "legacy";
    }
    return "legacy";
  };

  const wikiCtx = useMemo(() => {
    if (viewContext === undefined) {
      return undefined;
    }
    return wikiTierSpawnContextFromBaseFilters(viewContext);
  }, [viewContext]);

  const tierRowsCache = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getModTierDisplayRows>>();
    for (const record of records) {
      map.set(record.modKey, getModTierDisplayRows(record, wikiCtx));
    }
    return map;
  }, [records, wikiCtx]);

  const groupedRows = useMemo(() => {
    const groups = new Map<string, GroupedModRowType>();
    for (const record of records) {
      /** Per-class tier ladders must not merge (e.g. gloves T1 ≠ body T1). */
      const applicableKey = [...record.applicableSubTypes].sort().join("|");
      const key = [
        sectionKey(record),
        record.modType,
        dbViewGroupingTemplateKey(record),
        [...record.requiredItemTags].sort().join("|"),
        [...record.modTags].sort().join("|"),
        applicableKey,
      ].join("::");
      const current =
        groups.get(key) ??
        ({
          groupKey: key,
          weaponRecords: [],
          nonWeaponRecords: [],
          displayRecord: record,
          applicableSubTypes: [],
          tierCount: 0,
          totalWeight: 0,
          maxTierBySubType: new Map<string, number>(),
        } satisfies GroupedModRowType);
      const bucket = toBucket(record);
      if (bucket === "weapon") {
        current.weaponRecords.push(record);
      } else {
        current.nonWeaponRecords.push(record);
      }
      bumpMaxTierFromRecord(record, current.maxTierBySubType);
      current.displayRecord = current.weaponRecords[0] ?? current.nonWeaponRecords[0] ?? record;
      current.applicableSubTypes = Array.from(
        new Set([...current.applicableSubTypes, ...record.applicableSubTypes]),
      );
      current.tierCount = Math.max(
        ...current.weaponRecords.map((row) => row.tierCount),
        ...current.nonWeaponRecords.map((row) => row.tierCount),
        0,
      );
      current.totalWeight = [...current.weaponRecords, ...current.nonWeaponRecords].reduce(
        (sum, row) => {
          return sum + row.totalWeight;
        },
        0,
      );
      groups.set(key, current);
    }
    const baseRaw = [...groups.values()];
    const base = baseRaw.map((g) => {
      const allRecords = [...g.weaponRecords, ...g.nonWeaponRecords];
      if (!isReducedAilmentDurationFamilyGroup(allRecords)) {
        return g;
      }
      const sorted = [...allRecords].sort((a, b) => {
        return a.modKey.localeCompare(b.modKey);
      });
      const first = sorted[0];
      return {
        ...g,
        displayRecord: first ?? g.displayRecord,
        totalWeight: sumFirstTierDisplayWeights(sorted, tierRowsCache),
      };
    });
    if (viewContext === undefined || wikiCtx === undefined) {
      return base;
    }
    const focus = viewContext.baseItemSubType;
    return base.map((g) => {
      const allRecords = [...g.weaponRecords, ...g.nonWeaponRecords];
      let maxTier = 0;
      for (const r of allRecords) {
        maxTier = Math.max(maxTier, (tierRowsCache.get(r.modKey) ?? []).length);
      }
      const dr = g.displayRecord;
      const drRowsAsc = [...(tierRowsCache.get(dr.modKey) ?? [])].sort((a, b) => {
        return a.tier - b.tier;
      });
      const newWeight = isReducedAilmentDurationFamilyGroup(allRecords)
        ? sumFirstTierDisplayWeights(allRecords, tierRowsCache)
        : drRowsAsc[0]?.weight ?? g.totalWeight;
      const newMaxMap = new Map(g.maxTierBySubType);
      for (const r of allRecords) {
        if (r.applicableSubTypes.includes(focus)) {
          newMaxMap.set(focus, (tierRowsCache.get(r.modKey) ?? []).length);
          break;
        }
      }
      return {
        ...g,
        tierCount: maxTier,
        totalWeight: newWeight,
        maxTierBySubType: newMaxMap,
      };
    });
  }, [records, viewContext, wikiCtx, tierRowsCache]);

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
        {groupedRows.map((group, rowIndex) => {
          const isExpanded = expandedModKey === group.groupKey;
          const displayRecord = group.displayRecord;
          const allInGroup = [...group.weaponRecords, ...group.nonWeaponRecords];
          const displayName =
            isReducedAilmentDurationFamilyGroup(allInGroup)
              ? t("mods.reduced_ailment_duration_group")
              : modName(displayRecord.nameTemplateKey);
          const defaultBucket: TierBucketType = group.weaponRecords.length > 0 ? "weapon" : "nonWeapon";
          const selectedBucket = bucketByGroupKey[group.groupKey] ?? defaultBucket;
          const modTemplate = modName(displayRecord.nameTemplateKey);
          const tagChips =
            isReducedAilmentDurationFamilyGroup(allInGroup)
              ? Array.from(new Set(allInGroup.flatMap((r) => [...r.modTags])))
              : displayRecord.modTags;
          const selectedRecords = selectedBucket === "weapon" ? group.weaponRecords : group.nonWeaponRecords;
          const recordTierGroups = selectedRecords.map((row) => {
            const tierRows = tierRowsCache.get(row.modKey) ?? [];
            const sortedTierRows = [...tierRows].sort((a, b) => a.tier - b.tier);
            return { row, sortedTierRows };
          });
          const hasSynthetic = recordTierGroups.some((entry) => {
            return entry.sortedTierRows.some((tierRow) => tierRow.isSynthetic);
          });
          const bestTierRowForSummary =
            viewContext !== undefined
              ? [...(tierRowsCache.get(displayRecord.modKey) ?? [])].sort((a, b) => {
                  return a.tier - b.tier;
                })[0]
              : undefined;

          return (
            <Fragment key={group.groupKey}>
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
                      toggleMod(group.groupKey);
                    }}
                    aria-expanded={isExpanded}
                    aria-controls={`db-mod-tier-panel-${group.groupKey}`}
                    id={`db-mod-tier-trigger-${group.groupKey}`}
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
                    <span className="min-w-0 underline-offset-2 group-hover:underline">{displayName}</span>
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      displayRecord.modType === "prefix"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        : displayRecord.modType === "suffix"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                          : displayRecord.modType === "corruptedPrefix"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    }`}
                  >
                    {getModTypeDisplayName(displayRecord.modType, locale)}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {tagChips.map((tag) => (
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
                    {displayRecord.requiredItemTags.length === 0 ? (
                      <span className="text-zinc-300 dark:text-zinc-700 text-xs">–</span>
                    ) : (
                      displayRecord.requiredItemTags.map((tag) => (
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
                  <span className="block">{group.tierCount}</span>
                  {viewContext !== undefined && bestTierRowForSummary !== undefined ? (
                    <span className="mt-0.5 block text-[11px] font-normal leading-tight text-zinc-500 dark:text-zinc-400">
                      {t("dbView.bestTierReqIlvlShort", {
                        ilvl: bestTierRowForSummary.levelRequirement,
                      })}
                    </span>
                  ) : viewContext === undefined && group.applicableSubTypes.length === 1 ? (
                    <span className="mt-0.5 block text-[11px] font-normal leading-tight text-zinc-500 dark:text-zinc-400">
                      {t("dbView.maxTierStepsShort", {
                        count:
                          group.maxTierBySubType.get(group.applicableSubTypes[0] ?? "") ?? group.tierCount,
                      })}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                  {group.totalWeight.toLocaleString()}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {group.applicableSubTypes.map((subType) => {
                      const maxTierSteps = group.maxTierBySubType.get(subType) ?? group.tierCount;
                      return (
                        <span
                          key={subType}
                          className="inline-flex flex-col rounded px-1.5 py-0.5 text-xs leading-tight bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300"
                          title={t("dbView.applicableMaxTierHint", { count: maxTierSteps })}
                        >
                          <span className="font-medium">{subTypeLabel(subType)}</span>
                          <span className="text-[10px] font-normal text-amber-700/90 dark:text-amber-400/90">
                            {t("dbView.maxTierStepsShort", { count: maxTierSteps })}
                          </span>
                        </span>
                      );
                    })}
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
                      id={`db-mod-tier-panel-${group.groupKey}`}
                      role="region"
                      aria-labelledby={`db-mod-tier-trigger-${group.groupKey}`}
                      className="border-t border-zinc-200 bg-zinc-50/90 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      {group.weaponRecords.length > 0 || group.nonWeaponRecords.length > 0 ? (
                        <div className="mb-3 inline-flex overflow-hidden rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                          {group.weaponRecords.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setBucketByGroupKey((previous) => {
                                  return { ...previous, [group.groupKey]: "weapon" };
                                });
                              }}
                              className={`px-3 py-1.5 text-xs font-semibold ${
                                selectedBucket === "weapon"
                                  ? "bg-amber-500 text-white"
                                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              }`}
                            >
                              전투 장비 티어
                            </button>
                          ) : null}
                          {group.nonWeaponRecords.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setBucketByGroupKey((previous) => {
                                  return { ...previous, [group.groupKey]: "nonWeapon" };
                                });
                              }}
                              className={`px-3 py-1.5 text-xs font-semibold ${
                                selectedBucket === "nonWeapon"
                                  ? "bg-amber-500 text-white"
                                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              }`}
                            >
                              방어/장신구 티어
                            </button>
                          ) : null}
                        </div>
                      ) : null}
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
                            {recordTierGroups.flatMap(({ row, sortedTierRows }) => {
                              return sortedTierRows.map((tierRow, index) => {
                                const { lines, isPending } = buildModStatDisplayLines(
                                  modTemplate,
                                  tierRow.statRanges,
                                );
                                const showPendingLine = isPending || lines.length === 0;
                                const subTypeSummary = row.applicableSubTypes.map((subType) => {
                                  return subTypeLabel(subType);
                                });
                                const weaponGroupLabel = getWeaponGroupLabel(row.applicableSubTypes);
                                const ladderDepth =
                                  viewContext !== undefined
                                    ? (tierRowsCache.get(row.modKey) ?? []).length
                                    : maxTierDepthForRecord(row);
                                return (
                                  <Fragment key={`${row.modKey}-t${String(tierRow.tier)}`}>
                                    {index === 0 ? (
                                      <tr className="border-b border-zinc-700/70 bg-zinc-900/70 text-zinc-300">
                                        <td colSpan={6} className="px-4 py-2 text-xs font-semibold">
                                          {weaponGroupLabel !== null
                                            ? `${weaponGroupLabel} · ${subTypeSummary.join(", ")} · ${t(
                                                "dbView.maxTierStepsShort",
                                                { count: ladderDepth },
                                              )}`
                                            : `${subTypeSummary.join(", ")} · ${t("dbView.maxTierStepsShort", {
                                                count: ladderDepth,
                                              })}`}
                                        </td>
                                      </tr>
                                    ) : null}
                                    <tr className="align-top text-zinc-200">
                                      <td className="px-3 py-3 pl-4 align-middle">
                                        <span className="inline-flex min-w-[2.75rem] justify-center rounded-md border border-zinc-600/90 bg-zinc-800/95 px-2 py-1 text-xs font-bold tabular-nums text-zinc-100">
                                          T{tierRow.tier}
                                        </span>
                                      </td>
                                      <td className="px-3 py-3 align-middle text-zinc-500">
                                        {tierRow.tierRollName ?? t("dbView.tierAffixPlaceholder")}
                                      </td>
                                      <td className="px-3 py-3 align-middle text-right text-sm tabular-nums text-zinc-300">
                                        {tierRow.levelRequirement}
                                        {tierRow.requiredIntelligence !== undefined
                                          ? t("dbView.tierReqIntAppend", {
                                              value: tierRow.requiredIntelligence,
                                            })
                                          : null}
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
                                                    key={`${row.modKey}-t${String(tierRow.tier)}-${line}`}
                                                    className="leading-snug text-zinc-100"
                                                  >
                                                    {line}
                                                  </li>
                                                );
                                              })}
                                            </ul>
                                          )}
                                          {row.modTags.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                              {row.modTags.map((tag) => (
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
                                  </Fragment>
                                );
                              });
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

