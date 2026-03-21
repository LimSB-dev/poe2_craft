"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { Link } from "@/lib/i18n/navigation";
import { BASE_ITEMS } from "@/lib/poe2-item-simulator/baseItems";
import {
  BASE_ITEM_DB,
  BASE_ITEM_SUB_TYPES_BY_EQUIPMENT,
  type IBaseItemDbRecordType,
  type IBaseItemEquipmentTypeType,
  type IBaseItemSubTypeType,
} from "@/lib/poe2-item-simulator/baseItemDb";
import {
  resolveSimulationCounts,
  rollSimulation,
} from "@/lib/poe2-item-simulator/roller";
import type {
  IBaseItemDefinition,
  IItemSimulationResultType,
  IModDefinition,
  ItemRarityType,
} from "@/lib/poe2-item-simulator/types";

const ModListSection = ({
  title,
  mods,
  emptyLabel,
}: {
  title: string;
  mods: ReadonlyArray<IModDefinition>;
  emptyLabel: string;
}): ReactElement => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h3>
      <ul className="flex flex-col gap-1">
        {mods.length === 0 ? (
          <li className="text-sm text-zinc-500 dark:text-zinc-500">
            {emptyLabel}
          </li>
        ) : (
          mods.map((modDefinition) => (
            <li
              key={modDefinition.modKey}
              className="text-sm text-zinc-800 dark:text-zinc-200 flex flex-wrap items-center gap-2"
            >
              <span>{modDefinition.displayName}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                T{modDefinition.tier}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

const PanelShell = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}): ReactElement => {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm">
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
          {title}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </header>
      {children}
    </section>
  );
};

type EquipmentFilterType = "all" | IBaseItemEquipmentTypeType;
type SubTypeFilterType = "all" | IBaseItemSubTypeType;

export const ItemSimulatorWorkspace = (): ReactElement => {
  const t = useTranslations("simulator");
  const tPanels = useTranslations("simulator.panels");
  const tOptions = useTranslations("simulator.options");
  const tMods = useTranslations("simulator.mods");

  const firstBaseItem: IBaseItemDefinition | undefined = BASE_ITEMS[0];
  const baseItemRecords: ReadonlyArray<IBaseItemDbRecordType> =
    BASE_ITEM_DB.records;
  const [selectedBaseItemKey, setSelectedBaseItemKey] = useState<string>(
    firstBaseItem ? firstBaseItem.baseItemKey : "",
  );
  const [equipmentTypeFilter, setEquipmentTypeFilter] =
    useState<EquipmentFilterType>("all");
  const [subTypeFilter, setSubTypeFilter] = useState<SubTypeFilterType>("all");
  const [minimumRequiredStrength, setMinimumRequiredStrength] =
    useState<number>(0);
  const [maximumRequiredStrength, setMaximumRequiredStrength] =
    useState<number>(999);
  const [minimumRequiredDexterity, setMinimumRequiredDexterity] =
    useState<number>(0);
  const [maximumRequiredDexterity, setMaximumRequiredDexterity] =
    useState<number>(999);
  const [minimumRequiredIntelligence, setMinimumRequiredIntelligence] =
    useState<number>(0);
  const [maximumRequiredIntelligence, setMaximumRequiredIntelligence] =
    useState<number>(999);
  const [minimumRequiredLevel, setMinimumRequiredLevel] = useState<number>(1);
  const [maximumRequiredLevel, setMaximumRequiredLevel] = useState<number>(100);
  const [minimumArmour, setMinimumArmour] = useState<number>(0);
  const [maximumArmour, setMaximumArmour] = useState<number>(9999);
  const [minimumEvasion, setMinimumEvasion] = useState<number>(0);
  const [maximumEvasion, setMaximumEvasion] = useState<number>(9999);
  const [minimumEnergyShield, setMinimumEnergyShield] = useState<number>(0);
  const [maximumEnergyShield, setMaximumEnergyShield] = useState<number>(9999);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [rarity, setRarity] = useState<ItemRarityType>("rare");
  const [desiredPrefixCount, setDesiredPrefixCount] = useState<number>(2);
  const [desiredSuffixCount, setDesiredSuffixCount] = useState<number>(2);
  const [simulationResult, setSimulationResult] =
    useState<IItemSimulationResultType | null>(null);

  const availableSubTypes = useMemo(() => {
    if (equipmentTypeFilter === "all") {
      const dedupe = new Set<IBaseItemSubTypeType>();
      for (const subTypes of Object.values(BASE_ITEM_SUB_TYPES_BY_EQUIPMENT)) {
        for (const subType of subTypes) {
          dedupe.add(subType);
        }
      }
      return Array.from(dedupe);
    }
    return [...BASE_ITEM_SUB_TYPES_BY_EQUIPMENT[equipmentTypeFilter]];
  }, [equipmentTypeFilter]);

  const normalizedSubTypeFilter: SubTypeFilterType =
    subTypeFilter === "all" || availableSubTypes.includes(subTypeFilter)
      ? subTypeFilter
      : "all";

  const filteredBaseItemRecords = useMemo(() => {
    return baseItemRecords.filter((record) => {
      if (
        equipmentTypeFilter !== "all" &&
        record.equipmentType !== equipmentTypeFilter
      ) {
        return false;
      }
      if (
        normalizedSubTypeFilter !== "all" &&
        record.subType !== normalizedSubTypeFilter
      ) {
        return false;
      }
      if (record.requiredStrength < minimumRequiredStrength) {
        return false;
      }
      if (record.requiredStrength > maximumRequiredStrength) {
        return false;
      }
      if (record.requiredDexterity < minimumRequiredDexterity) {
        return false;
      }
      if (record.requiredDexterity > maximumRequiredDexterity) {
        return false;
      }
      if (record.requiredIntelligence < minimumRequiredIntelligence) {
        return false;
      }
      if (record.requiredIntelligence > maximumRequiredIntelligence) {
        return false;
      }
      if (record.levelRequirement < minimumRequiredLevel) {
        return false;
      }
      if (record.levelRequirement > maximumRequiredLevel) {
        return false;
      }
      const armour = record.armour ?? 0;
      if (armour < minimumArmour || armour > maximumArmour) {
        return false;
      }
      const evasion = record.evasion ?? 0;
      if (evasion < minimumEvasion || evasion > maximumEvasion) {
        return false;
      }
      const energyShield = record.energyShield ?? 0;
      if (energyShield < minimumEnergyShield || energyShield > maximumEnergyShield) {
        return false;
      }
      return true;
    });
  }, [
    baseItemRecords,
    equipmentTypeFilter,
    normalizedSubTypeFilter,
    minimumRequiredStrength,
    maximumRequiredStrength,
    minimumRequiredDexterity,
    maximumRequiredDexterity,
    minimumRequiredIntelligence,
    maximumRequiredIntelligence,
    minimumRequiredLevel,
    maximumRequiredLevel,
    minimumArmour,
    maximumArmour,
    minimumEvasion,
    maximumEvasion,
    minimumEnergyShield,
    maximumEnergyShield,
  ]);

  const effectiveSelectedBaseItemKey = useMemo(() => {
    const exists = filteredBaseItemRecords.some(
      (record) => record.baseItemKey === selectedBaseItemKey,
    );
    if (exists) {
      return selectedBaseItemKey;
    }
    const first = filteredBaseItemRecords[0];
    return first ? first.baseItemKey : "";
  }, [filteredBaseItemRecords, selectedBaseItemKey]);

  const selectedBaseItem: IBaseItemDefinition | undefined = BASE_ITEMS.find(
    (baseItem) => {
      return baseItem.baseItemKey === effectiveSelectedBaseItemKey;
    },
  );
  const selectedBaseItemRecord: IBaseItemDbRecordType | undefined =
    filteredBaseItemRecords.find((record) => {
      if (!selectedBaseItem) {
        return false;
      }
      return record.baseItemKey === selectedBaseItem.baseItemKey;
    });

  const effectiveCounts = resolveSimulationCounts(
    rarity,
    desiredPrefixCount,
    desiredSuffixCount,
  );

  const handleRarityChange = (nextRarity: ItemRarityType): void => {
    setRarity(nextRarity);
    if (nextRarity === "magic") {
      setDesiredPrefixCount(1);
      setDesiredSuffixCount(0);
    } else {
      setDesiredPrefixCount(2);
      setDesiredSuffixCount(2);
    }
  };

  const handleSimulate = (): void => {
    if (!selectedBaseItem) {
      return;
    }
    const roll = rollSimulation({
      rarity,
      desiredPrefixCount,
      desiredSuffixCount,
    });
    setSimulationResult({
      baseItem: selectedBaseItem,
      roll,
    });
  };

  const prefixOptions = rarity === "magic" ? [0, 1] : [0, 1, 2, 3];
  const suffixOptions = rarity === "magic" ? [0, 1] : [0, 1, 2, 3];

  const baseName = (baseItem: IBaseItemDefinition): string => {
    try {
      return t(`baseItems.${baseItem.baseItemKey}.name`);
    } catch {
      return baseItem.baseItemKey;
    }
  };

  const itemClassLabel = (baseItem: IBaseItemDefinition): string => {
    return t(`itemClass.${baseItem.itemClassKey}`);
  };

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 dark:bg-black px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-6xl flex flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">
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
              {t("strategyView.navLabel")}
            </Link>
            <Link
              href="/rl"
              className="text-sm font-medium text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
            >
              {t("rlView.navLabel")}
            </Link>
            <Link
              href="/optimizer"
              className="text-sm font-medium text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
            >
              {t("optimizerView.navLabel")}
            </Link>
            <Link
              href="/db"
              className="text-sm font-medium text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
            >
              {t("dbView.navLabel")}
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          <PanelShell
            title={tPanels("baseItem.title")}
            description={tPanels("baseItem.description")}
          >
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {t("baseFilter.baseItem")}
                  <span className="ml-1.5 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                    ({filteredBaseItemRecords.length})
                  </span>
                </span>
                {filteredBaseItemRecords.length === 0 ? (
                  <div className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {t("baseFilter.noResults")}
                  </div>
                ) : (
                  <select
                    value={effectiveSelectedBaseItemKey}
                    onChange={(event) => {
                      setSelectedBaseItemKey(event.target.value);
                    }}
                    className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                  >
                    {filteredBaseItemRecords.map((record) => {
                      const def = BASE_ITEMS.find(
                        (b) => b.baseItemKey === record.baseItemKey,
                      );
                      const label = def ? baseName(def) : record.baseItemKey;
                      return (
                        <option key={record.baseItemKey} value={record.baseItemKey}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                )}
              </label>

              {selectedBaseItemRecord && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 px-3 py-2 flex flex-col gap-1">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {selectedBaseItem && itemClassLabel(selectedBaseItem)}
                  </div>
                  {(selectedBaseItemRecord.armour !== undefined ||
                    selectedBaseItemRecord.evasion !== undefined ||
                    selectedBaseItemRecord.energyShield !== undefined) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums">
                      {selectedBaseItemRecord.armour !== undefined && (
                        <span className="text-xs text-amber-700 dark:text-amber-400">
                          {t("baseFilter.armour")} {selectedBaseItemRecord.armour}
                        </span>
                      )}
                      {selectedBaseItemRecord.evasion !== undefined && (
                        <span className="text-xs text-green-700 dark:text-green-400">
                          {t("baseFilter.evasion")} {selectedBaseItemRecord.evasion}
                        </span>
                      )}
                      {selectedBaseItemRecord.energyShield !== undefined && (
                        <span className="text-xs text-sky-700 dark:text-sky-400">
                          {t("baseFilter.energyShield")} {selectedBaseItemRecord.energyShield}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">
                    {t("baseFilter.requirementSummary", {
                      str: selectedBaseItemRecord.requiredStrength,
                      dex: selectedBaseItemRecord.requiredDexterity,
                      int: selectedBaseItemRecord.requiredIntelligence,
                      level: selectedBaseItemRecord.levelRequirement,
                    })}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => { setIsFilterOpen((prev) => !prev); }}
                className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors self-start"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className={`size-3.5 shrink-0 transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`}
                >
                  <path
                    fillRule="evenodd"
                    d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("baseFilter.filterToggle")}
              </button>

              {isFilterOpen && (
              <div className="flex flex-col gap-3">

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {t("baseFilter.type")}
                </span>
                <select
                  value={equipmentTypeFilter}
                  onChange={(event) => {
                    const value = event.target.value as EquipmentFilterType;
                    if (
                      value === "all" ||
                      value === "weapon" ||
                      value === "offhand" ||
                      value === "armour" ||
                      value === "jewellery"
                    ) {
                      setEquipmentTypeFilter(value);
                      setSubTypeFilter("all");
                    }
                  }}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                >
                  <option value="all">{t("baseFilter.all")}</option>
                  <option value="weapon">{t("equipmentType.weapon")}</option>
                  <option value="offhand">{t("equipmentType.offhand")}</option>
                  <option value="armour">{t("equipmentType.armour")}</option>
                  <option value="jewellery">
                    {t("equipmentType.jewellery")}
                  </option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {t("baseFilter.subType")}
                </span>
                <select
                  value={normalizedSubTypeFilter}
                  onChange={(event) => {
                    const value = event.target.value as SubTypeFilterType;
                    if (
                      value === "all" ||
                      availableSubTypes.includes(value as IBaseItemSubTypeType)
                    ) {
                      setSubTypeFilter(value);
                    }
                  }}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                >
                  <option value="all">{t("baseFilter.all")}</option>
                  {availableSubTypes.map((subType) => (
                    <option key={subType} value={subType}>
                      {t(`itemClass.${subType}`)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-2">
                {(
                  [
                    {
                      label: t("baseFilter.requiredLevel"),
                      minValue: minimumRequiredLevel,
                      maxValue: maximumRequiredLevel,
                      onMinChange: (value: number) =>
                        setMinimumRequiredLevel(
                          Math.max(1, Math.min(value, maximumRequiredLevel)),
                        ),
                      onMaxChange: (value: number) =>
                        setMaximumRequiredLevel(
                          Math.max(minimumRequiredLevel, Math.min(100, value)),
                        ),
                      absMin: 1,
                      absMax: 100,
                    },
                    {
                      label: t("baseFilter.armour"),
                      minValue: minimumArmour,
                      maxValue: maximumArmour,
                      onMinChange: (value: number) =>
                        setMinimumArmour(
                          Math.max(0, Math.min(value, maximumArmour)),
                        ),
                      onMaxChange: (value: number) =>
                        setMaximumArmour(
                          Math.max(minimumArmour, Math.min(9999, value)),
                        ),
                      absMin: 0,
                      absMax: 9999,
                    },
                    {
                      label: t("baseFilter.evasion"),
                      minValue: minimumEvasion,
                      maxValue: maximumEvasion,
                      onMinChange: (value: number) =>
                        setMinimumEvasion(
                          Math.max(0, Math.min(value, maximumEvasion)),
                        ),
                      onMaxChange: (value: number) =>
                        setMaximumEvasion(
                          Math.max(minimumEvasion, Math.min(9999, value)),
                        ),
                      absMin: 0,
                      absMax: 9999,
                    },
                    {
                      label: t("baseFilter.energyShield"),
                      minValue: minimumEnergyShield,
                      maxValue: maximumEnergyShield,
                      onMinChange: (value: number) =>
                        setMinimumEnergyShield(
                          Math.max(0, Math.min(value, maximumEnergyShield)),
                        ),
                      onMaxChange: (value: number) =>
                        setMaximumEnergyShield(
                          Math.max(minimumEnergyShield, Math.min(9999, value)),
                        ),
                      absMin: 0,
                      absMax: 9999,
                    },
                    {
                      label: t("baseFilter.requiredStr"),
                      minValue: minimumRequiredStrength,
                      maxValue: maximumRequiredStrength,
                      onMinChange: (value: number) =>
                        setMinimumRequiredStrength(
                          Math.max(0, Math.min(value, maximumRequiredStrength)),
                        ),
                      onMaxChange: (value: number) =>
                        setMaximumRequiredStrength(
                          Math.max(
                            minimumRequiredStrength,
                            Math.min(999, value),
                          ),
                        ),
                      absMin: 0,
                      absMax: 999,
                    },
                    {
                      label: t("baseFilter.requiredDex"),
                      minValue: minimumRequiredDexterity,
                      maxValue: maximumRequiredDexterity,
                      onMinChange: (value: number) =>
                        setMinimumRequiredDexterity(
                          Math.max(
                            0,
                            Math.min(value, maximumRequiredDexterity),
                          ),
                        ),
                      onMaxChange: (value: number) =>
                        setMaximumRequiredDexterity(
                          Math.max(
                            minimumRequiredDexterity,
                            Math.min(999, value),
                          ),
                        ),
                      absMin: 0,
                      absMax: 999,
                    },
                    {
                      label: t("baseFilter.requiredInt"),
                      minValue: minimumRequiredIntelligence,
                      maxValue: maximumRequiredIntelligence,
                      onMinChange: (value: number) =>
                        setMinimumRequiredIntelligence(
                          Math.max(
                            0,
                            Math.min(value, maximumRequiredIntelligence),
                          ),
                        ),
                      onMaxChange: (value: number) =>
                        setMaximumRequiredIntelligence(
                          Math.max(
                            minimumRequiredIntelligence,
                            Math.min(999, value),
                          ),
                        ),
                      absMin: 0,
                      absMax: 999,
                    },
                  ] as const
                ).map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {stat.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={stat.absMin}
                        max={stat.absMax}
                        value={stat.minValue}
                        onFocus={(event) => { event.target.select(); }}
                        onChange={(event) => {
                          const next = Number.parseInt(event.target.value, 10);
                          if (Number.isFinite(next)) {
                            stat.onMinChange(next);
                          }
                        }}
                        className="min-w-0 flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs text-center"
                      />
                      <span className="shrink-0 text-xs text-zinc-400">~</span>
                      <input
                        type="number"
                        min={stat.absMin}
                        max={stat.absMax}
                        value={stat.maxValue}
                        onFocus={(event) => { event.target.select(); }}
                        onChange={(event) => {
                          const next = Number.parseInt(event.target.value, 10);
                          if (Number.isFinite(next)) {
                            stat.onMaxChange(next);
                          }
                        }}
                        className="min-w-0 flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>

              </div>
              )}

            </div>
          </PanelShell>

          <PanelShell
            title={tPanels("options.title")}
            description={tPanels("options.description")}
          >
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {tOptions("targetRarity")}
                </span>
                <select
                  value={rarity}
                  onChange={(event) => {
                    const value = event.target.value as ItemRarityType;
                    if (value === "magic" || value === "rare") {
                      handleRarityChange(value);
                    }
                  }}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                >
                  <option value="magic">{t("rarity.magic")}</option>
                  <option value="rare">{t("rarity.rare")}</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {tOptions("prefixes")}
                  </span>
                  <select
                    value={desiredPrefixCount}
                    onChange={(event) => {
                      setDesiredPrefixCount(
                        Number.parseInt(event.target.value, 10),
                      );
                    }}
                    className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                  >
                    {prefixOptions.map((count) => (
                      <option key={`prefix-${count}`} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {tOptions("suffixes")}
                  </span>
                  <select
                    value={desiredSuffixCount}
                    onChange={(event) => {
                      setDesiredSuffixCount(
                        Number.parseInt(event.target.value, 10),
                      );
                    }}
                    className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                  >
                    {suffixOptions.map((count) => (
                      <option key={`suffix-${count}`} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                {tOptions("effectiveRoll", {
                  prefixCount: effectiveCounts.prefixCount,
                  suffixCount: effectiveCounts.suffixCount,
                  hint: tOptions("effectiveRollHint"),
                })}
              </p>

              <button
                type="button"
                onClick={() => {
                  handleSimulate();
                }}
                disabled={!selectedBaseItem}
                className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-3 text-sm font-semibold text-white dark:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              >
                {tOptions("rollPreview")}
              </button>
            </div>
          </PanelShell>

          <PanelShell
            title={tPanels("result.title")}
            description={tPanels("result.description")}
          >
            {!simulationResult ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("result.empty")}
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {(() => {
                  const resultRecord = BASE_ITEM_DB.records.find(
                    (r) => r.baseItemKey === simulationResult.baseItem.baseItemKey,
                  );
                  return (
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 px-4 py-3 flex flex-col gap-1">
                      <div className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                        {baseName(simulationResult.baseItem)}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-500">
                        {itemClassLabel(simulationResult.baseItem)}
                      </div>
                      {resultRecord &&
                        (resultRecord.armour !== undefined ||
                          resultRecord.evasion !== undefined ||
                          resultRecord.energyShield !== undefined) && (
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums">
                            {resultRecord.armour !== undefined && (
                              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                {t("baseFilter.armour")} {resultRecord.armour}
                              </span>
                            )}
                            {resultRecord.evasion !== undefined && (
                              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                {t("baseFilter.evasion")} {resultRecord.evasion}
                              </span>
                            )}
                            {resultRecord.energyShield !== undefined && (
                              <span className="text-sm font-medium text-sky-700 dark:text-sky-400">
                                {t("baseFilter.energyShield")} {resultRecord.energyShield}
                              </span>
                            )}
                          </div>
                        )}
                      <div className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
                        {t(`rarity.${simulationResult.roll.rarity}`)}
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ModListSection
                    title={tMods("prefixes")}
                    mods={simulationResult.roll.prefixes}
                    emptyLabel={tMods("empty")}
                  />
                  <ModListSection
                    title={tMods("suffixes")}
                    mods={simulationResult.roll.suffixes}
                    emptyLabel={tMods("empty")}
                  />
                </div>
              </div>
            )}
          </PanelShell>
        </div>
      </div>
    </div>
  );
};
