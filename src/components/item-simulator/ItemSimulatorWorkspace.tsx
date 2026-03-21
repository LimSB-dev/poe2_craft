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
import { rollSimulation } from "@/lib/poe2-item-simulator/roller";
import type {
  IBaseItemDefinition,
  IDesiredModEntryType,
  IItemSimulationResultType,
  IModDefinition,
} from "@/lib/poe2-item-simulator/types";
import { ItemSimulatorBaseItemSearchBlock } from "@/components/item-simulator/ItemSimulatorBaseItemSearchBlock";
import { DesiredModsPanel } from "@/components/item-simulator/DesiredModsPanel";
import { ItemSimulatorBaseItemSubtypeOptions } from "@/components/item-simulator/i18n/ItemSimulatorBaseItemSubtypeOptions";
import { ItemSimulatorCatalogBaseName } from "@/components/item-simulator/i18n/ItemSimulatorCatalogBaseName";
import { ItemSimulatorCatalogItemClassLabel } from "@/components/item-simulator/i18n/ItemSimulatorCatalogItemClassLabel";
import { SimulatorModTemplateText } from "@/components/item-simulator/i18n/SimulatorModTemplateText";

/** Lv → STR → DEX → INT 순, 값이 0이면 제외 */
const buildBaseItemRequirementLineParts = (
  record: IBaseItemDbRecordType,
  translate: (key: string) => string,
): string[] => {
  const parts: string[] = [];
  if (record.levelRequirement > 0) {
    parts.push(
      `${translate("baseFilter.requiredLevel")} ${record.levelRequirement}`,
    );
  }
  if (record.requiredStrength > 0) {
    parts.push(
      `${translate("baseFilter.requiredStr")} ${record.requiredStrength}`,
    );
  }
  if (record.requiredDexterity > 0) {
    parts.push(
      `${translate("baseFilter.requiredDex")} ${record.requiredDexterity}`,
    );
  }
  if (record.requiredIntelligence > 0) {
    parts.push(
      `${translate("baseFilter.requiredInt")} ${record.requiredIntelligence}`,
    );
  }
  return parts;
};

const ModListSection = ({
  title,
  mods,
  emptyLabel,
  desiredModKeys,
}: {
  title: string;
  mods: ReadonlyArray<IModDefinition>;
  emptyLabel: string;
  desiredModKeys?: ReadonlySet<string>;
}): ReactElement => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold font-sc uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h3>
      <ul className="flex flex-col gap-1">
        {mods.length === 0 ? (
          <li className="text-sm text-zinc-500 dark:text-zinc-500">
            {emptyLabel}
          </li>
        ) : (
          mods.map((modDefinition) => {
            const isDesired =
              desiredModKeys?.has(modDefinition.modKey) ?? false;
            return (
              <li
                key={modDefinition.modKey}
                className={`text-sm flex flex-wrap items-center gap-2 rounded-md px-2 py-1 -mx-2 transition-colors ${
                  isDesired
                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300"
                    : "text-zinc-800 dark:text-zinc-200"
                }`}
              >
                {isDesired && (
                  <span
                    className="text-amber-500 dark:text-amber-400 text-xs"
                    aria-hidden="true"
                  >
                    ★
                  </span>
                )}
                <span>
                  <SimulatorModTemplateText
                    nameTemplateKey={modDefinition.displayName}
                  />
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isDesired
                      ? "bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300"
                      : "bg-zinc-100 dark:bg-zinc-800"
                  }`}
                >
                  T{modDefinition.tier}
                </span>
              </li>
            );
          })
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
        <h2 className="font-sc text-base font-semibold text-zinc-950 dark:text-zinc-50">
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
  const t = useTranslations("simulator.itemSimulatorWorkspace");

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
  const [simulationResult, setSimulationResult] =
    useState<IItemSimulationResultType | null>(null);
  const [desiredMods, setDesiredMods] = useState<
    ReadonlyArray<IDesiredModEntryType>
  >([]);

  const handleAddDesiredMod = (entry: IDesiredModEntryType): void => {
    setDesiredMods((prev) => [...prev, entry]);
  };

  const handleRemoveDesiredMod = (id: string): void => {
    setDesiredMods((prev) => prev.filter((m) => m.id !== id));
  };

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
      if (
        energyShield < minimumEnergyShield ||
        energyShield > maximumEnergyShield
      ) {
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

  const handleSimulate = (): void => {
    if (!selectedBaseItem) {
      return;
    }
    const roll = rollSimulation({
      rarity: "rare",
      desiredPrefixCount: 3,
      desiredSuffixCount: 3,
    });
    setSimulationResult({
      baseItem: selectedBaseItem,
      roll,
    });
  };

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 dark:bg-black px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-6xl flex flex-col gap-8">
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
              href="/db"
              className="text-sm font-medium text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
            >
              {t("nav.db")}
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          <PanelShell
            title={t("panels.baseItem.title")}
            description={t("panels.baseItem.description")}
          >
            <div className="flex flex-col gap-3">
              {/* 1. 선택된 아이템 정보 — 항상 최상단, 고정 높이로 레이아웃 안정 */}
              <div className="min-h-[216px] flex flex-col justify-start">
                {selectedBaseItemRecord ? (
                  /* PoE2 아이템 툴팁 스타일 카드 */
                  <div className="rounded border border-[#7a5c1e] bg-[#0f0c07] overflow-hidden flex">
                    {/* 왼쪽: 아이템 이미지 자리 — 추후 next/image로 교체 */}
                    <div className="shrink-0 w-20 bg-[#0a0806] border-r border-[#3d2e10] flex items-center justify-center p-2">
                      <div className="w-14 h-14 border border-dashed border-[#3d2e10] flex items-center justify-center">
                        <span className="text-[10px] text-[#4a3c20] select-none">
                          img
                        </span>
                      </div>
                    </div>

                    {/* 오른쪽: 아이템 정보 (중앙 정렬, space-between 미사용) */}
                    <div className="flex-1 min-w-0 flex flex-col items-center py-2 px-3 text-center">
                      {/* 아이템 이름 */}
                      <p className="font-sc text-[#c8a55a] text-sm leading-snug w-full">
                        {selectedBaseItem ? (
                          <ItemSimulatorCatalogBaseName
                            baseItemKey={selectedBaseItem.baseItemKey}
                          />
                        ) : null}
                      </p>
                      {/* 베이스 아이템 퀄리티 (고정 0%) */}
                      <p className="text-xs mt-0.5 mb-2 w-full">
                        <span className="text-[#a38d6d]">
                          {t("baseFilter.quality")}
                        </span>
                        <span className="text-[#c8c8c8]"> 0%</span>
                      </p>

                      <div className="w-full border-t border-[#3d2e10] mb-2" />

                      {/* 방어 스탯 */}
                      {(selectedBaseItemRecord.armour !== undefined ||
                        selectedBaseItemRecord.evasion !== undefined ||
                        selectedBaseItemRecord.energyShield !== undefined) && (
                        <>
                          <div className="flex flex-col gap-1 tabular-nums mb-2 w-full">
                            {selectedBaseItemRecord.armour !== undefined && (
                              <p className="text-xs">
                                <span className="text-[#a38d6d]">
                                  {t("baseFilter.armour")}
                                </span>
                                <span className="text-[#c8c8c8]">
                                  {" "}
                                  {selectedBaseItemRecord.armour}
                                </span>
                              </p>
                            )}
                            {selectedBaseItemRecord.evasion !== undefined && (
                              <p className="text-xs">
                                <span className="text-[#a38d6d]">
                                  {t("baseFilter.evasion")}
                                </span>
                                <span className="text-[#c8c8c8]">
                                  {" "}
                                  {selectedBaseItemRecord.evasion}
                                </span>
                              </p>
                            )}
                            {selectedBaseItemRecord.energyShield !==
                              undefined && (
                              <p className="text-xs">
                                <span className="text-[#a38d6d]">
                                  {t("baseFilter.energyShield")}
                                </span>
                                <span className="text-[#c8c8c8]">
                                  {" "}
                                  {selectedBaseItemRecord.energyShield}
                                </span>
                              </p>
                            )}
                          </div>
                          <div className="w-full border-t border-[#3d2e10] mb-2" />
                        </>
                      )}

                      {/* 요구 스탯 — Lv → STR → DEX → INT, 0은 미표시 */}
                      {(() => {
                        const requirementParts =
                          buildBaseItemRequirementLineParts(
                            selectedBaseItemRecord,
                            t,
                          );
                        if (requirementParts.length === 0) {
                          return null;
                        }
                        return (
                          <p className="text-xs text-[#a38d6d] tabular-nums w-full mb-2">
                            {requirementParts.join(" / ")}
                          </p>
                        );
                      })()}

                      {/* 특수 옵션 1줄 분 — 표시 없이 패딩만 (추후 콘텐츠) */}
                      <div
                        className="w-full border-t border-[#3d2e10] pt-2 pb-1 min-h-[1.35rem]"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 py-1">
                    {t("baseFilter.noResults")}
                  </p>
                )}
              </div>

              <ItemSimulatorBaseItemSearchBlock
                filteredBaseItemRecords={filteredBaseItemRecords}
                effectiveSelectedBaseItemKey={effectiveSelectedBaseItemKey}
                onSelectBaseItemKey={setSelectedBaseItemKey}
                searchPlaceholder={t("baseFilter.baseItemSearchPlaceholder", {
                  label: t("baseFilter.baseItem"),
                  count: filteredBaseItemRecords.length,
                })}
                ariaLabelBaseItem={t("baseFilter.baseItem")}
                noResultsLabel={t("baseFilter.noResults")}
              />

              <button
                type="button"
                onClick={() => {
                  setIsFilterOpen((prev) => !prev);
                }}
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
                      <option value="weapon">
                        {t("equipmentType.weapon")}
                      </option>
                      <option value="offhand">
                        {t("equipmentType.offhand")}
                      </option>
                      <option value="armour">
                        {t("equipmentType.armour")}
                      </option>
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
                          availableSubTypes.includes(
                            value as IBaseItemSubTypeType,
                          )
                        ) {
                          setSubTypeFilter(value);
                        }
                      }}
                      className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    >
                      <ItemSimulatorBaseItemSubtypeOptions
                        allLabel={t("baseFilter.all")}
                        subTypes={availableSubTypes}
                      />
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
                              Math.max(
                                1,
                                Math.min(value, maximumRequiredLevel),
                              ),
                            ),
                          onMaxChange: (value: number) =>
                            setMaximumRequiredLevel(
                              Math.max(
                                minimumRequiredLevel,
                                Math.min(100, value),
                              ),
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
                              Math.max(
                                minimumEnergyShield,
                                Math.min(9999, value),
                              ),
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
                              Math.max(
                                0,
                                Math.min(value, maximumRequiredStrength),
                              ),
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
                            onFocus={(event) => {
                              event.target.select();
                            }}
                            onChange={(event) => {
                              const next = Number.parseInt(
                                event.target.value,
                                10,
                              );
                              if (Number.isFinite(next)) {
                                stat.onMinChange(next);
                              }
                            }}
                            className="min-w-0 flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs text-center"
                          />
                          <span className="shrink-0 text-xs text-zinc-400">
                            ~
                          </span>
                          <input
                            type="number"
                            min={stat.absMin}
                            max={stat.absMax}
                            value={stat.maxValue}
                            onFocus={(event) => {
                              event.target.select();
                            }}
                            onChange={(event) => {
                              const next = Number.parseInt(
                                event.target.value,
                                10,
                              );
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
            title={t("panels.desiredMods.title")}
            description={t("panels.desiredMods.description")}
          >
            <DesiredModsPanel
              subType={selectedBaseItemRecord?.subType}
              statTags={selectedBaseItemRecord?.statTags}
              desiredMods={desiredMods}
              onAdd={handleAddDesiredMod}
              onRemove={handleRemoveDesiredMod}
            />
          </PanelShell>

          <PanelShell
            title={t("panels.result.title")}
            description={t("panels.result.description")}
          >
            <button
              type="button"
              onClick={handleSimulate}
              className="w-full sm:w-auto rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
            >
              {t("actions.runRoll")}
            </button>
            {!simulationResult ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("resultCard.empty")}
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {(() => {
                  const resultRecord = BASE_ITEM_DB.records.find(
                    (r) =>
                      r.baseItemKey === simulationResult.baseItem.baseItemKey,
                  );
                  return (
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 px-4 py-3 flex flex-col gap-1">
                      <div className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                        <ItemSimulatorCatalogBaseName
                          baseItemKey={simulationResult.baseItem.baseItemKey}
                        />
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-500">
                        <ItemSimulatorCatalogItemClassLabel
                          itemClassKey={simulationResult.baseItem.itemClassKey}
                        />
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
                                {t("baseFilter.energyShield")}{" "}
                                {resultRecord.energyShield}
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

                {(() => {
                  const desiredModKeys = new Set(
                    desiredMods.map((m) => m.modKey),
                  );
                  return (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <ModListSection
                        title={t("resultModList.prefixes")}
                        mods={simulationResult.roll.prefixes}
                        emptyLabel={t("resultModList.empty")}
                        desiredModKeys={desiredModKeys}
                      />
                      <ModListSection
                        title={t("resultModList.suffixes")}
                        mods={simulationResult.roll.suffixes}
                        emptyLabel={t("resultModList.empty")}
                        desiredModKeys={desiredModKeys}
                      />
                    </div>
                  );
                })()}
              </div>
            )}
          </PanelShell>
        </div>
      </div>
    </div>
  );
};
