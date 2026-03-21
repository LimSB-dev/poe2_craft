"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { Link } from "@/lib/i18n/navigation";
import {
  BASE_ITEM_DB,
  BASE_ITEM_SUB_TYPES_BY_EQUIPMENT,
  type IBaseItemEquipmentTypeType,
  type IBaseItemSubTypeType,
} from "@/lib/poe2-item-simulator/baseItemDb";
import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";

type TabType = "items" | "mods";
type EquipmentFilterType = "all" | IBaseItemEquipmentTypeType;
type SubTypeFilterType = "all" | IBaseItemSubTypeType;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export const DbWorkspace = (): ReactElement => {
  const t = useTranslations("simulator");

  const [activeTab, setActiveTab] = useState<TabType>("items");
  const [equipmentFilter, setEquipmentFilter] =
    useState<EquipmentFilterType>("all");
  const [subTypeFilter, setSubTypeFilter] = useState<SubTypeFilterType>("all");
  const [modSubTypeFilter, setModSubTypeFilter] =
    useState<SubTypeFilterType>("all");
  const [modTypeFilter, setModTypeFilter] = useState<"all" | "prefix" | "suffix" | "corruptedPrefix" | "corruptedSuffix">("all");
  const [search, setSearch] = useState<string>("");

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

  const allModSubTypes = useMemo(() => {
    const set = new Set<IBaseItemSubTypeType>();
    for (const record of MOD_DB.records) {
      for (const s of record.applicableSubTypes) { set.add(s); }
    }
    return Array.from(set).sort();
  }, []);

  const filteredMods = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOD_DB.records.filter((r) => {
      if (modTypeFilter !== "all" && r.modType !== modTypeFilter) { return false; }
      if (modSubTypeFilter !== "all" && !r.applicableSubTypes.includes(modSubTypeFilter)) { return false; }
      if (q) {
        const name = (() => { try { return t(`mods.${r.nameTemplateKey}`).toLowerCase(); } catch { return r.modKey.toLowerCase(); } })();
        if (!name.includes(q) && !r.modKey.includes(q)) { return false; }
      }
      return true;
    });
  }, [modTypeFilter, modSubTypeFilter, search, t]);

  const itemName = (key: string): string => {
    try { return t(`baseItems.${key}.name`); } catch { return key; }
  };
  const modName = (key: string): string => {
    try { return t(`mods.${key}`); } catch { return key; }
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
            <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">
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
            <span className="ml-1.5 text-xs font-normal text-zinc-400">({MOD_DB.records.length})</span>
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
                <option value="prefix">{t("dbView.prefix")}</option>
                <option value="suffix">{t("dbView.suffix")}</option>
                <option value="corruptedPrefix">{t("dbView.corruptedPrefix")}</option>
                <option value="corruptedSuffix">{t("dbView.corruptedSuffix")}</option>
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
            </>
          )}

          <span className="text-xs text-zinc-400 ml-auto">
            {activeTab === "items" ? filteredItems.length : filteredMods.length}건
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          {activeTab === "items" ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("dbView.colName")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("dbView.colSubType")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("dbView.colStatTags")}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("dbView.colArmour")}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("dbView.colEvasion")}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("dbView.colES")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("dbView.colReq")}</th>
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
                            {tag.toUpperCase()}
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
                      {[
                        r.requiredStrength > 0 ? `STR ${r.requiredStrength}` : null,
                        r.requiredDexterity > 0 ? `DEX ${r.requiredDexterity}` : null,
                        r.requiredIntelligence > 0 ? `INT ${r.requiredIntelligence}` : null,
                        `Lv.${r.levelRequirement}`,
                      ].filter(Boolean).join(" · ")}
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("dbView.colName")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("dbView.colModType")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("dbView.colTags")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("dbView.colStatReq")}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("dbView.colTiers")}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("dbView.colWeight")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t("dbView.colApplicable")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMods.map((r, i) => (
                  <tr
                    key={r.modKey}
                    className={`border-b border-zinc-100 dark:border-zinc-800 last:border-0 ${
                      i % 2 === 0 ? "" : "bg-zinc-50/50 dark:bg-zinc-900/30"
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                      {modName(r.nameTemplateKey)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.modType === "prefix"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : r.modType === "suffix"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                          : r.modType === "corruptedPrefix"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      }`}>
                        {r.modType === "prefix"
                          ? t("dbView.prefix")
                          : r.modType === "suffix"
                          ? t("dbView.suffix")
                          : r.modType === "corruptedPrefix"
                          ? t("dbView.corruptedPrefix")
                          : t("dbView.corruptedSuffix")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {r.modTags.map((tag) => (
                          <span key={tag} className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        {r.requiredItemTags.length === 0 ? (
                          <span className="text-zinc-300 dark:text-zinc-700 text-xs">–</span>
                        ) : r.requiredItemTags.map((tag) => (
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
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300 font-medium">
                      {r.tierCount}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                      {r.totalWeight.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {r.applicableSubTypes.map((s) => (
                          <span key={s} className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                            {subTypeLabel(s)}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMods.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">{t("baseFilter.noResults")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};
