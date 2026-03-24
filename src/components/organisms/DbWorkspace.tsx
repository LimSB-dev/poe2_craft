"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { DbModsTable } from "@/components/organisms/DbModsTable";
import { LocaleSwitcher } from "@/components/organisms/LocaleSwitcher";
import { Link } from "@/lib/i18n/navigation";
import {
  BASE_ITEM_DB,
  BASE_ITEM_SUB_TYPES_BY_EQUIPMENT,
  type IBaseItemEquipmentTypeType,
  type IBaseItemSubTypeType,
} from "@/lib/poe2-item-simulator/baseItemDb";
import {
  formatBaseItemRequirementSummary,
  getAttributeRequirementPrefix,
} from "@/lib/poe2-item-simulator/coreAttributeLabels";
import { getModTypeDisplayName } from "@/lib/poe2-item-simulator/modTypeLabels";
import { MOD_DB, type IModDbRecordType } from "@/lib/poe2-item-simulator/modDb";
import type { IBaseItemStatTagType } from "@/lib/poe2-item-simulator/baseItemDb";
import type { Poe2DbModifierApiResponseType } from "@/lib/poe2-item-simulator/poe2dbModifiersApiTypes";

type TabType = "items" | "mods";
type EquipmentFilterType = "all" | IBaseItemEquipmentTypeType;
type SubTypeFilterType = "all" | IBaseItemSubTypeType;
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

const MOD_PAGE_SIZE = 100;

const parseRequiredTags = (rawTags: string | null): IBaseItemStatTagType[] => {
  if (rawTags === null) {
    return [];
  }
  const tags = rawTags.toLowerCase();
  const out: IBaseItemStatTagType[] = [];
  if (tags.includes("str")) {
    out.push("str");
  }
  if (tags.includes("dex")) {
    out.push("dex");
  }
  if (tags.includes("int")) {
    out.push("int");
  }
  return out;
};

const toModType = (
  section: string,
  modGenerationTypeId: number | null,
): IModDbRecordType["modType"] => {
  if (section === "corrupted" || section === "desecrated") {
    return modGenerationTypeId === 1 ? "corruptedPrefix" : "corruptedSuffix";
  }
  return modGenerationTypeId === 1 ? "prefix" : "suffix";
};

const toViewRecordsFromPoe2Db = (
  payload: Poe2DbModifierApiResponseType,
): IModDbRecordType[] => {
  const toTemplateAndRanges = (
    statLineText: string,
  ): { template: string; ranges: Array<{ min: number; max: number }> } => {
    const ranges: Array<{ min: number; max: number }> = [];
    let working = statLineText;

    working = working.replace(
      /(-?\d+(?:\.\d+)?)\s*[—~\-]\s*(-?\d+(?:\.\d+)?)/g,
      (_match, minRaw: string, maxRaw: string) => {
        const min = Number.parseFloat(minRaw);
        const max = Number.parseFloat(maxRaw);
        if (Number.isFinite(min) && Number.isFinite(max)) {
          ranges.push({ min, max });
          return `__POE2DB_RANGE_${String(ranges.length - 1)}__`;
        }
        return _match;
      },
    );

    working = working.replace(/-?\d+(?:\.\d+)?/g, (numberRaw) => {
      const value = Number.parseFloat(numberRaw);
      if (!Number.isFinite(value)) {
        return numberRaw;
      }
      ranges.push({ min: value, max: value });
      return `__POE2DB_RANGE_${String(ranges.length - 1)}__`;
    });

    const template = working.replace(/__POE2DB_RANGE_\d+__/g, "#");
    return { template, ranges };
  };

  type GroupedType = {
    key: string;
    modType: IModDbRecordType["modType"];
    section: string;
    template: string;
    modTags: Set<string>;
    applicableSubTypes: Set<IBaseItemSubTypeType>;
    requiredItemTags: Set<IBaseItemStatTagType>;
    members: Array<{
      requiredLevel: number;
      weight: number;
      ranges: Array<{ min: number; max: number }>;
    }>;
  };

  const groups = new Map<string, GroupedType>();

  for (const row of payload.rows) {
    const statLine = row.statLineText.length > 0 ? row.statLineText : row.modifierName;
    const parsed = toTemplateAndRanges(statLine);
    const modType = toModType(row.section, row.modGenerationTypeId);
    const modFamiliesKey = [...row.modFamilies].sort().join("|");
    const requiredTags = parseRequiredTags(row.itemClassTags);
    const requiredTagsKey = [...requiredTags].sort().join("|");
    const groupKey = [
      row.section,
      String(modType),
      modFamiliesKey,
      requiredTagsKey,
      parsed.template,
    ].join("::");

    const current = groups.get(groupKey) ?? {
      key: groupKey,
      modType,
      section: row.section,
      template: parsed.template,
      modTags: new Set<string>(),
      applicableSubTypes: new Set<IBaseItemSubTypeType>(),
      requiredItemTags: new Set<IBaseItemStatTagType>(),
      members: [],
    };

    for (const family of row.modFamilies) {
      current.modTags.add(family);
    }
    if (row.itemClassCode !== null) {
      current.applicableSubTypes.add(row.itemClassCode as IBaseItemSubTypeType);
    }
    for (const requiredTag of requiredTags) {
      current.requiredItemTags.add(requiredTag);
    }
    current.members.push({
      requiredLevel: row.requiredLevel ?? 1,
      weight: row.dropChanceValue ?? 0,
      ranges: parsed.ranges,
    });

    groups.set(groupKey, current);
  }

  const records: IModDbRecordType[] = [];
  let index = 0;

  for (const grouped of groups.values()) {
    const sortedMembers = [...grouped.members].sort((a, b) => {
      if (b.requiredLevel !== a.requiredLevel) {
        return b.requiredLevel - a.requiredLevel;
      }
      return b.weight - a.weight;
    });
    const tiers = sortedMembers.map((member, tierIndex) => {
      return {
        tier: tierIndex + 1,
        levelRequirement: member.requiredLevel,
        weight: member.weight,
        statRanges: member.ranges,
      };
    });

    const tierCount = Math.max(1, tiers.length);
    const maxLevelRequirement = tiers[0]?.levelRequirement ?? 1;
    const totalWeight = tiers.reduce((sum, tier) => {
      return sum + tier.weight;
    }, 0);

    records.push({
      modKey: `poe2db__${grouped.section}__${String(index)}`,
      modType: grouped.modType,
      applicableSubTypes: [...grouped.applicableSubTypes],
      requiredItemTags: [...grouped.requiredItemTags],
      modTags: [...grouped.modTags].slice(0, 4),
      tierCount,
      maxLevelRequirement,
      totalWeight,
      nameTemplateKey: grouped.template,
      tiers,
    });
    index += 1;
  }

  return records;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export const DbWorkspace = (): ReactElement => {
  const locale = useLocale();
  const t = useTranslations("simulator");

  const [activeTab, setActiveTab] = useState<TabType>("items");
  const [equipmentFilter, setEquipmentFilter] =
    useState<EquipmentFilterType>("all");
  const [subTypeFilter, setSubTypeFilter] = useState<SubTypeFilterType>("all");
  const [modSubTypeFilter, setModSubTypeFilter] =
    useState<SubTypeFilterType>("all");
  const [modTypeFilter, setModTypeFilter] = useState<"all" | "prefix" | "suffix" | "corruptedPrefix" | "corruptedSuffix">("all");
  const [modSectionFilter, setModSectionFilter] = useState<ModSectionFilterType>("all");
  const [modPage, setModPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [remoteModRecords, setRemoteModRecords] = useState<IModDbRecordType[] | null>(null);

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
        setRemoteModRecords(toViewRecordsFromPoe2Db(payload));
      } catch {
        // Keep local MOD_DB fallback when API or generated file is unavailable.
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const modRecords = remoteModRecords ?? MOD_DB.records;

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

  const availableSubTypes = useMemo(() => {
    if (equipmentFilter === "all") {
      const set = new Set<IBaseItemSubTypeType>();
      for (const list of Object.values(BASE_ITEM_SUB_TYPES_BY_EQUIPMENT)) {
        for (const s of list) { set.add(s); }
      }
      return Array.from(set);
    }
    return [...BASE_ITEM_SUB_TYPES_BY_EQUIPMENT[equipmentFilter]];
  }, [equipmentFilter]);

  const normalizedSubType: SubTypeFilterType =
    subTypeFilter === "all" || availableSubTypes.includes(subTypeFilter)
      ? subTypeFilter
      : "all";

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BASE_ITEM_DB.records.filter((r) => {
      if (equipmentFilter !== "all" && r.equipmentType !== equipmentFilter) { return false; }
      if (normalizedSubType !== "all" && r.subType !== normalizedSubType) { return false; }
      if (q) {
        const name = (() => { try { return t(`baseItems.${r.baseItemKey}.name`).toLowerCase(); } catch { return r.baseItemKey.toLowerCase(); } })();
        if (!name.includes(q) && !r.baseItemKey.includes(q)) { return false; }
      }
      return true;
    });
  }, [equipmentFilter, normalizedSubType, search, t]);

  const availableModSections = useMemo(() => {
    const set = new Set<ModSectionFilterType>();
    for (const record of modRecords) {
      set.add(getRecordSection(record));
    }
    return Array.from(set).sort();
  }, [modRecords]);

  const allModSubTypes = useMemo(() => {
    const set = new Set<IBaseItemSubTypeType>();
    for (const record of modRecords) {
      for (const s of record.applicableSubTypes) { set.add(s); }
    }
    return Array.from(set).sort();
  }, [modRecords]);

  const filteredMods = useMemo(() => {
    const q = search.trim().toLowerCase();
    return modRecords.filter((r) => {
      if (modTypeFilter !== "all" && r.modType !== modTypeFilter) { return false; }
      if (modSubTypeFilter !== "all" && !r.applicableSubTypes.includes(modSubTypeFilter)) { return false; }
      if (modSectionFilter !== "all" && getRecordSection(r) !== modSectionFilter) { return false; }
      if (q) {
        const name = (() => {
          try {
            return t(`mods.${r.nameTemplateKey}` as never).toLowerCase();
          } catch {
            return r.modKey.toLowerCase();
          }
        })();
        if (!name.includes(q) && !r.modKey.includes(q)) { return false; }
      }
      return true;
    });
  }, [modRecords, modTypeFilter, modSubTypeFilter, modSectionFilter, search, t]);

  const modTotalPages = Math.max(1, Math.ceil(filteredMods.length / MOD_PAGE_SIZE));
  const normalizedModPage = Math.min(modPage, modTotalPages);
  const pagedMods = useMemo(() => {
    const start = (normalizedModPage - 1) * MOD_PAGE_SIZE;
    return filteredMods.slice(start, start + MOD_PAGE_SIZE);
  }, [filteredMods, normalizedModPage]);

  const itemName = (key: string): string => {
    try { return t(`baseItems.${key}.name`); } catch { return key; }
  };
  const subTypeLabel = (s: string): string => {
    try { return t(`itemClass.${s}`); } catch { return s; }
  };

  const TAB_CLS = (active: boolean): string =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      active
        ? "border-amber-500 text-amber-600 dark:text-amber-400"
        : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
    }`;

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 dark:bg-black px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-7xl flex flex-col gap-6">

        {/* Header */}
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-sc text-2xl font-bold text-zinc-950 dark:text-zinc-50">
              {t("dbView.title")}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("dbView.description")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <LocaleSwitcher />
            <Link href="/" className="text-xs text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline">
              ← {t("title")}
            </Link>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button type="button" onClick={() => { setActiveTab("items"); setSearch(""); }} className={TAB_CLS(activeTab === "items")}>
            {t("dbView.tabItems")}
            <span className="ml-1.5 text-xs font-normal text-zinc-400">({BASE_ITEM_DB.records.length})</span>
          </button>
          <button type="button" onClick={() => { setActiveTab("mods"); setSearch(""); }} className={TAB_CLS(activeTab === "mods")}>
            {t("dbView.tabMods")}
            <span className="ml-1.5 text-xs font-normal text-zinc-400">({modRecords.length})</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onFocus={(e) => { e.target.select(); }}
            onChange={(e) => { setSearch(e.target.value); }}
            placeholder="검색..."
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm w-48"
          />

          {activeTab === "items" && (
            <>
              <select
                value={equipmentFilter}
                onChange={(e) => {
                  setEquipmentFilter(e.target.value as EquipmentFilterType);
                  setSubTypeFilter("all");
                }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
              >
                <option value="all">{t("baseFilter.all")}</option>
                <option value="weapon">{t("equipmentType.weapon")}</option>
                <option value="offhand">{t("equipmentType.offhand")}</option>
                <option value="armour">{t("equipmentType.armour")}</option>
                <option value="jewellery">{t("equipmentType.jewellery")}</option>
              </select>
              <select
                value={normalizedSubType}
                onChange={(e) => { setSubTypeFilter(e.target.value as SubTypeFilterType); }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
              >
                <option value="all">{t("baseFilter.all")}</option>
                {availableSubTypes.map((s) => (
                  <option key={s} value={s}>{subTypeLabel(s)}</option>
                ))}
              </select>
            </>
          )}

          {activeTab === "mods" && (
            <>
              <select
                value={modTypeFilter}
                onChange={(e) => { setModTypeFilter(e.target.value as "all" | "prefix" | "suffix" | "corruptedPrefix" | "corruptedSuffix"); }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
              >
                <option value="all">{t("baseFilter.all")}</option>
                <option value="prefix">
                  {getModTypeDisplayName("prefix", locale)}
                </option>
                <option value="suffix">
                  {getModTypeDisplayName("suffix", locale)}
                </option>
                <option value="corruptedPrefix">
                  {getModTypeDisplayName("corruptedPrefix", locale)}
                </option>
                <option value="corruptedSuffix">
                  {getModTypeDisplayName("corruptedSuffix", locale)}
                </option>
              </select>
              <select
                value={modSubTypeFilter}
                onChange={(e) => { setModSubTypeFilter(e.target.value as SubTypeFilterType); }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
              >
                <option value="all">{t("baseFilter.all")}</option>
                {allModSubTypes.map((s) => (
                  <option key={s} value={s}>{subTypeLabel(s)}</option>
                ))}
              </select>
              <select
                value={modSectionFilter}
                onChange={(e) => { setModSectionFilter(e.target.value as ModSectionFilterType); }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
              >
                <option value="all">{t("dbView.modSectionAll")}</option>
                {availableModSections.map((section) => (
                  <option key={section} value={section}>
                    {t(`dbView.modSection.${section}` as never)}
                  </option>
                ))}
              </select>
              <div className="ml-1 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => { setModPage((prev) => Math.max(1, prev - 1)); }}
                  disabled={normalizedModPage <= 1}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
                >
                  {t("dbView.paginationPrev")}
                </button>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t("dbView.paginationPage", { page: normalizedModPage, total: modTotalPages })}
                </span>
                <button
                  type="button"
                  onClick={() => { setModPage((prev) => Math.min(modTotalPages, prev + 1)); }}
                  disabled={normalizedModPage >= modTotalPages}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
                >
                  {t("dbView.paginationNext")}
                </button>
              </div>
            </>
          )}

          <span className="text-xs text-zinc-400 ml-auto">
            {activeTab === "items"
              ? filteredItems.length
              : t("dbView.paginationCount", {
                  shown: pagedMods.length,
                  total: filteredMods.length,
                })}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          {activeTab === "items" ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">{t("dbView.colName")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">{t("dbView.colSubType")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">{t("dbView.colStatTags")}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">{t("dbView.colArmour")}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">{t("dbView.colEvasion")}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">{t("dbView.colES")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 font-sc uppercase tracking-wide">{t("dbView.colReq")}</th>
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
                    <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {subTypeLabel(r.subType)}
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
                      ) : <span className="text-zinc-300 dark:text-zinc-700">–</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {r.evasion !== undefined ? (
                        <span className="text-green-600 dark:text-green-400">{r.evasion}</span>
                      ) : <span className="text-zinc-300 dark:text-zinc-700">–</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {r.energyShield !== undefined ? (
                        <span className="text-sky-600 dark:text-sky-400">{r.energyShield}</span>
                      ) : <span className="text-zinc-300 dark:text-zinc-700">–</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">
                      {formatBaseItemRequirementSummary(r, locale)}
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">{t("baseFilter.noResults")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <DbModsTable records={pagedMods} locale={locale} />
          )}
        </div>

      </div>
    </div>
  );
};
