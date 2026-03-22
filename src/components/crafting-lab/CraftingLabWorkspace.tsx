"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type ReactElement } from "react";

import { CraftingLabOrbPreviewPanel } from "@/components/crafting-lab/CraftingLabOrbPreviewPanel";
import { CraftingLabOrbSlotButton } from "@/components/crafting-lab/CraftingLabOrbSlotButton";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { ItemSimulatorBaseItemFilterCollapsible } from "@/components/item-simulator/ItemSimulatorBaseItemFilterCollapsible";
import { ItemSimulatorBaseItemSearchBlock } from "@/components/item-simulator/ItemSimulatorBaseItemSearchBlock";
import { ItemSimulatorBaseItemTooltipCard } from "@/components/item-simulator/ItemSimulatorBaseItemTooltipCard";
import { useItemSimulatorBaseItemPanelState } from "@/components/item-simulator/useItemSimulatorBaseItemPanelState";
import { getCraftingLabCurrencyIconUrl } from "@/lib/crafting-lab/craftingLabCurrencyIconUrls";
import {
  getCraftLabOrbSlotIdsGrouped,
  getOrbSlotTierRoman,
  normalizeCraftingCurrencyEventId,
  orbSlotIdToFamilyKind,
  type CraftingCurrencyIdType,
  type CraftingLabOrbSlotIdType,
  type CraftingOrbFamilyIdType,
} from "@/lib/crafting-lab/craftingLabCurrencyIds";
import {
  buildCraftLabOrbPreview,
  type CraftLabOrbPreviewResultType,
} from "@/lib/crafting-lab/craftLabOrbPreview";
import type { IModRollBaseFiltersType } from "@/lib/poe2-item-simulator/roller";
import {
  aggregateUsageCounts,
  readCraftingLabUsage,
  writeCraftingLabUsage,
} from "@/lib/crafting-lab/craftingLabUsageStorage";
import { Link } from "@/lib/i18n/navigation";
import {
  applyChaosOrb,
  applyExaltedOrb,
  applyFracturingOrb,
  applyOrbOfAlchemy,
  applyOrbOfAnnulment,
  applyOrbOfAugmentation,
  applyOrbOfTransmutation,
  applyRegalOrb,
  canApplyOrbOfAlchemy,
  canApplyOrbOfAnnulment,
  canApplyOrbOfAugmentation,
  canApplyOrbOfTransmutation,
  canApplyChaosOrb,
  canApplyExaltedOrb,
  canApplyFracturingOrb,
  canApplyRegalOrb,
} from "@/lib/poe2-item-simulator/basicCurrencyOrbs";
import {
  applyEssence,
  ATTACK_ESSENCE,
  LIFE_ESSENCE,
} from "@/lib/poe2-item-simulator/essence";
import type { IItemRoll } from "@/lib/poe2-item-simulator/types";

type CraftLabModeType = "random" | "simulation";

const EMPTY_NORMAL_ROLL: IItemRoll = {
  rarity: "normal",
  prefixes: [],
  suffixes: [],
};

/** 되돌리기 스택이 과도하게 커지지 않도록 상한. */
const MAX_CRAFT_UNDO_DEPTH: number = 100;

const cloneItemRoll = (roll: IItemRoll): IItemRoll => {
  return {
    rarity: roll.rarity,
    prefixes: roll.prefixes.map((m) => {
      return { ...m };
    }),
    suffixes: roll.suffixes.map((m) => {
      return { ...m };
    }),
  };
};

type CraftLabHistorySnapshotType = {
  itemRoll: IItemRoll;
  usageEvents: CraftingCurrencyIdType[];
};

const makeHistorySnapshot = (
  roll: IItemRoll,
  events: CraftingCurrencyIdType[],
): CraftLabHistorySnapshotType => {
  return {
    itemRoll: cloneItemRoll(roll),
    usageEvents: [...events],
  };
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const isCraftLabOrbApplicable = (
  id: CraftingLabOrbSlotIdType,
  roll: IItemRoll,
): boolean => {
  const family = orbSlotIdToFamilyKind(id);
  switch (family) {
    case "orb_transmutation": {
      return canApplyOrbOfTransmutation(roll);
    }
    case "orb_augmentation": {
      return canApplyOrbOfAugmentation(roll);
    }
    case "orb_regal": {
      return canApplyRegalOrb(roll);
    }
    case "orb_alchemy": {
      return canApplyOrbOfAlchemy(roll);
    }
    case "orb_exalted": {
      return canApplyExaltedOrb(roll);
    }
    case "orb_fracturing": {
      return canApplyFracturingOrb(roll);
    }
    case "orb_chaos": {
      return canApplyChaosOrb(roll);
    }
    case "orb_annulment": {
      return canApplyOrbOfAnnulment(roll);
    }
    default: {
      return false;
    }
  }
};

const CRAFT_LAB_ORB_APPLY: Record<
  CraftingOrbFamilyIdType,
  (roll: IItemRoll, filters: IModRollBaseFiltersType | undefined) => IItemRoll
> = {
  orb_transmutation: (roll, filters) => applyOrbOfTransmutation(roll, filters),
  orb_augmentation: (roll, filters) => applyOrbOfAugmentation(roll, filters),
  orb_regal: (roll, filters) => applyRegalOrb(roll, filters),
  orb_alchemy: (roll, filters) => applyOrbOfAlchemy(roll, filters),
  orb_exalted: (roll, filters) => applyExaltedOrb(roll, filters),
  orb_fracturing: (roll) => applyFracturingOrb(roll),
  orb_chaos: (roll, filters) => applyChaosOrb(roll, filters),
  orb_annulment: (roll) => applyOrbOfAnnulment(roll),
};

export const CraftingLabWorkspace = (): ReactElement => {
  const t = useTranslations("simulator.craftLab");
  const tWs = useTranslations("simulator.itemSimulatorWorkspace");

  const {
    selectedBaseItemRecord,
    selectedBaseItem,
    filteredBaseItemRecords,
    effectiveSelectedBaseItemKey,
    setSelectedBaseItemKey,
    isFilterOpen,
    setIsFilterOpen,
    equipmentTypeFilter,
    handleEquipmentTypeChange,
    normalizedSubTypeFilter,
    setSubTypeFilter,
    availableSubTypes,
    rangeFieldsProps,
  } = useItemSimulatorBaseItemPanelState();

  const modRollFilters = useMemo((): IModRollBaseFiltersType | undefined => {
    if (selectedBaseItemRecord === undefined) {
      return undefined;
    }
    return {
      baseItemSubType: selectedBaseItemRecord.subType,
      itemStatTags: selectedBaseItemRecord.statTags,
    };
  }, [selectedBaseItemRecord]);

  const [itemRoll, setItemRoll] = useState<IItemRoll>(EMPTY_NORMAL_ROLL);
  const [usageEvents, setUsageEvents] = useState<CraftingCurrencyIdType[]>([]);
  const [completionSnapshot, setCompletionSnapshot] = useState<
    CraftingCurrencyIdType[] | null
  >(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<CraftLabHistorySnapshotType[]>([]);
  const [redoStack, setRedoStack] = useState<CraftLabHistorySnapshotType[]>([]);
  const [craftLabMode, setCraftLabMode] = useState<CraftLabModeType>("random");
  const [simPreview, setSimPreview] = useState<CraftLabOrbPreviewResultType | null>(
    null,
  );
  const [simPreviewLabel, setSimPreviewLabel] = useState<string>("");

  useEffect(() => {
    // 베이스가 바뀌면 롤·완료 스냅샷 초기화, 로컬에 동일 베이스 기록이 있으면 복원 후 저장
    // eslint-disable-next-line react-hooks/set-state-in-effect -- effective 베이스 변경 시 동기화
    setItemRoll(EMPTY_NORMAL_ROLL);
    setLastError(null);
    setCompletionSnapshot(null);
    setUndoStack([]);
    setRedoStack([]);
    setSimPreview(null);
    setSimPreviewLabel("");
    if (effectiveSelectedBaseItemKey.length === 0) {
      setUsageEvents([]);
      return;
    }
    const stored = readCraftingLabUsage();
    const restored: CraftingCurrencyIdType[] =
      stored !== null && stored.baseItemKey === effectiveSelectedBaseItemKey
        ? (stored.events.map(normalizeCraftingCurrencyEventId) as CraftingCurrencyIdType[])
        : [];
    setUsageEvents(restored);
    writeCraftingLabUsage({
      baseItemKey: effectiveSelectedBaseItemKey,
      events: restored,
    });
  }, [effectiveSelectedBaseItemKey]);

  const handleResetCraft = (): void => {
    if (effectiveSelectedBaseItemKey.length === 0 || selectedBaseItemRecord === undefined) {
      return;
    }
    setItemRoll(EMPTY_NORMAL_ROLL);
    setLastError(null);
    setUsageEvents([]);
    setCompletionSnapshot(null);
    setUndoStack([]);
    setRedoStack([]);
    setSimPreview(null);
    setSimPreviewLabel("");
    writeCraftingLabUsage({
      baseItemKey: effectiveSelectedBaseItemKey,
      events: [],
    });
  };

  const handleUndoCraft = (): void => {
    if (effectiveSelectedBaseItemKey.length === 0 || undoStack.length === 0) {
      return;
    }
    const prev = undoStack[undoStack.length - 1];
    if (prev === undefined) {
      return;
    }
    setUndoStack((stack) => {
      return stack.slice(0, -1);
    });
    setRedoStack((stack) => {
      return [...stack, makeHistorySnapshot(itemRoll, usageEvents)];
    });
    setItemRoll(prev.itemRoll);
    setUsageEvents(prev.usageEvents);
    writeCraftingLabUsage({
      baseItemKey: effectiveSelectedBaseItemKey,
      events: prev.usageEvents,
    });
    setCompletionSnapshot(null);
    setLastError(null);
  };

  const handleRedoCraft = (): void => {
    if (effectiveSelectedBaseItemKey.length === 0 || redoStack.length === 0) {
      return;
    }
    const nextSnap = redoStack[redoStack.length - 1];
    if (nextSnap === undefined) {
      return;
    }
    setRedoStack((stack) => {
      return stack.slice(0, -1);
    });
    setUndoStack((stack) => {
      const appended = [...stack, makeHistorySnapshot(itemRoll, usageEvents)];
      if (appended.length > MAX_CRAFT_UNDO_DEPTH) {
        return appended.slice(-MAX_CRAFT_UNDO_DEPTH);
      }
      return appended;
    });
    setItemRoll(nextSnap.itemRoll);
    setUsageEvents(nextSnap.usageEvents);
    writeCraftingLabUsage({
      baseItemKey: effectiveSelectedBaseItemKey,
      events: nextSnap.usageEvents,
    });
    setCompletionSnapshot(null);
    setLastError(null);
  };

  const tryApply = (
    id: CraftingCurrencyIdType,
    apply: (
      roll: IItemRoll,
      filters: IModRollBaseFiltersType | undefined,
    ) => IItemRoll,
  ): void => {
    if (
      effectiveSelectedBaseItemKey.length === 0 ||
      selectedBaseItemRecord === undefined
    ) {
      setLastError(tWs("baseFilter.noResults"));
      return;
    }
    try {
      const nextRoll = apply(itemRoll, modRollFilters);
      const nextEvents = [...usageEvents, id];
      setUndoStack((stack) => {
        const appended = [...stack, makeHistorySnapshot(itemRoll, usageEvents)];
        if (appended.length > MAX_CRAFT_UNDO_DEPTH) {
          return appended.slice(-MAX_CRAFT_UNDO_DEPTH);
        }
        return appended;
      });
      setRedoStack([]);
      setItemRoll(nextRoll);
      setUsageEvents(nextEvents);
      writeCraftingLabUsage({
        baseItemKey: effectiveSelectedBaseItemKey,
        events: nextEvents,
      });
      setLastError(null);
      setCompletionSnapshot(null);
    } catch (error: unknown) {
      setLastError(getErrorMessage(error));
    }
  };

  const stashButton = (
    id: CraftingCurrencyIdType,
    onUse: () => void,
    options?: { disabled?: boolean; title?: string; ariaLabel?: string },
  ): ReactElement => {
    const disabled = options?.disabled === true;
    const iconSrc = getCraftingLabCurrencyIconUrl(id);
    const labelText = t(`currency.${id}`);
    const ariaLabel =
      options?.ariaLabel !== undefined && options.ariaLabel.length > 0
        ? options.ariaLabel
        : labelText;
    return (
      <button
        type="button"
        disabled={disabled}
        title={options?.title}
        aria-label={ariaLabel}
        onClick={() => {
          onUse();
        }}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-left text-sm transition hover:border-amber-400/60 disabled:opacity-40 disabled:pointer-events-none"
      >
        {iconSrc !== undefined ? (
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-zinc-100/80 dark:bg-zinc-800/80">
            <Image
              src={iconSrc}
              alt=""
              width={40}
              height={40}
              className="object-contain"
              sizes="40px"
              aria-hidden
            />
          </span>
        ) : null}
        <span className="font-medium text-zinc-900 dark:text-zinc-100 leading-snug min-w-0">
          {t(`currency.${id}`)}
        </span>
      </button>
    );
  };

  const hasBaseForCraft = selectedBaseItemRecord !== undefined;

  const usageTotalsLine = useMemo(() => {
    if (completionSnapshot === null || completionSnapshot.length === 0) {
      return "";
    }
    const counts = aggregateUsageCounts(completionSnapshot);
    const seen = new Set<string>();
    const order: CraftingCurrencyIdType[] = [];
    for (const id of completionSnapshot) {
      if (!seen.has(id)) {
        seen.add(id);
        order.push(id);
      }
    }
    return order
      .map((id) => {
        return `${t(`currency.${id}`)} ×${String(counts.get(id) ?? 0)}`;
      })
      .join(", ");
  }, [completionSnapshot, t]);

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 dark:bg-black px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className="font-sc text-2xl font-bold text-zinc-950 dark:text-zinc-50">
              {t("title")}
            </h1>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 max-w-3xl">
              {t("intro")}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <Link
                href="/"
                className="text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
              >
                {t("navToSimulator")}
              </Link>
            </p>
          </div>
          <LocaleSwitcher />
        </header>

        <div
          className="min-h-16 shrink-0"
          aria-live="polite"
          aria-atomic="true"
        >
          {lastError !== null ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {t("lastActionError", { message: lastError })}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <section
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm flex flex-col gap-4"
            aria-labelledby="craft-lab-item-heading"
          >
            <div className="flex flex-wrap items-start gap-3">
              <button
                type="button"
                disabled={!hasBaseForCraft}
                onClick={() => {
                  handleResetCraft();
                }}
                aria-label={t("resetItem")}
                className="shrink-0 rounded-lg border border-zinc-300 dark:border-zinc-600 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none"
              >
                {t("baseSectionReset")}
              </button>
              <div className="min-w-0 flex-1">
                <h2
                  id="craft-lab-item-heading"
                  className="font-sc text-base font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  {tWs("panels.baseItem.title")}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {tWs("panels.baseItem.description")}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="min-h-[216px] flex flex-col justify-start">
                {selectedBaseItemRecord ? (
                  <ItemSimulatorBaseItemTooltipCard
                    record={selectedBaseItemRecord}
                    baseItemKey={selectedBaseItem?.baseItemKey ?? ""}
                    explicitItemRoll={itemRoll}
                  />
                ) : (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 py-1">
                    {tWs("baseFilter.noResults")}
                  </p>
                )}
              </div>

              <ItemSimulatorBaseItemSearchBlock
                filteredBaseItemRecords={filteredBaseItemRecords}
                effectiveSelectedBaseItemKey={effectiveSelectedBaseItemKey}
                onSelectBaseItemKey={(key) => {
                  setSelectedBaseItemKey(key);
                }}
                searchPlaceholder={tWs("baseFilter.baseItemSearchPlaceholder", {
                  label: tWs("baseFilter.baseItem"),
                  count: filteredBaseItemRecords.length,
                })}
                ariaLabelBaseItem={tWs("baseFilter.baseItem")}
                noResultsLabel={tWs("baseFilter.noResults")}
              />

              <ItemSimulatorBaseItemFilterCollapsible
                isOpen={isFilterOpen}
                onToggle={() => {
                  setIsFilterOpen((prev) => {
                    return !prev;
                  });
                }}
                equipmentTypeFilter={equipmentTypeFilter}
                onEquipmentTypeChange={handleEquipmentTypeChange}
                normalizedSubTypeFilter={normalizedSubTypeFilter}
                onSubTypeChange={setSubTypeFilter}
                availableSubTypes={availableSubTypes}
                rangeFieldsProps={rangeFieldsProps}
              />
            </div>
          </section>

          <section
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm flex flex-col gap-5"
            aria-labelledby="craft-lab-stash-heading"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="craft-lab-stash-heading"
                className="font-sc text-base font-semibold text-zinc-900 dark:text-zinc-50"
              >
                {t("stashColumnTitle")}
              </h2>
              <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={!hasBaseForCraft || undoStack.length === 0}
                  onClick={() => {
                    handleUndoCraft();
                  }}
                  aria-label={t("undoCraftAria")}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {t("undoCraft")}
                </button>
                <button
                  type="button"
                  disabled={!hasBaseForCraft || redoStack.length === 0}
                  onClick={() => {
                    handleRedoCraft();
                  }}
                  aria-label={t("redoCraftAria")}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {t("redoCraft")}
                </button>
                <button
                  type="button"
                  disabled={!hasBaseForCraft || usageEvents.length === 0}
                  onClick={() => {
                    setCompletionSnapshot([...usageEvents]);
                  }}
                  className="rounded-lg border border-amber-400/60 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {t("craftCompleteButton")}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                {t("orbsHeading")}
              </h3>
              {hasBaseForCraft ? (
                <fieldset className="mb-3 min-w-0 border-0 p-0 m-0">
                  <legend className="sr-only">{t("craftModeLegend")}</legend>
                  <div
                    className="flex flex-wrap items-center gap-2 mb-2"
                    role="radiogroup"
                    aria-label={t("craftModeLegend")}
                  >
                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
                      {t("craftModeLabel")}
                    </span>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={craftLabMode === "random"}
                      onClick={() => {
                        setCraftLabMode("random");
                        setSimPreview(null);
                        setSimPreviewLabel("");
                      }}
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                        craftLabMode === "random"
                          ? "border-amber-500/70 bg-amber-950/50 text-amber-100"
                          : "border-zinc-600 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {t("craftModeRandom")}
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={craftLabMode === "simulation"}
                      onClick={() => {
                        setCraftLabMode("simulation");
                      }}
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                        craftLabMode === "simulation"
                          ? "border-sky-500/70 bg-sky-950/40 text-sky-100"
                          : "border-zinc-600 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {t("craftModeSimulation")}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2 leading-snug">
                    {t("craftModeSimulationHint")}
                  </p>
                </fieldset>
              ) : null}
              {!hasBaseForCraft ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t("stashPickBaseForCurrencies")}
                </p>
              ) : (
                <>
                  <div className="rounded-lg border border-[#3d3429] bg-[#141210] p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)] dark:bg-[#141210]">
                    <div className="flex flex-col gap-3 sm:gap-3.5">
                      {getCraftLabOrbSlotIdsGrouped().map((rowSlotIds, rowIndex) => {
                        return (
                          <div
                            key={`${String(rowIndex)}-orb-row`}
                            className="w-full min-w-0"
                          >
                            <div className="mx-auto grid w-max grid-cols-3 gap-1.5 sm:gap-2">
                              {rowSlotIds.map((id) => {
                                const applicable = isCraftLabOrbApplicable(
                                  id,
                                  itemRoll,
                                );
                                const applyOrb =
                                  CRAFT_LAB_ORB_APPLY[orbSlotIdToFamilyKind(id)];
                                const family = orbSlotIdToFamilyKind(id);
                                const name = t(`currency.${id}`);
                                const iconSrc = getCraftingLabCurrencyIconUrl(id);
                                const tierRoman = getOrbSlotTierRoman(id);
                                return (
                                  <CraftingLabOrbSlotButton
                                    key={id}
                                    iconSrc={iconSrc}
                                    disabled={!applicable}
                                    onUse={() => {
                                      if (craftLabMode === "simulation") {
                                        if (!applicable) {
                                          return;
                                        }
                                        const prev = buildCraftLabOrbPreview(
                                          family,
                                          itemRoll,
                                          modRollFilters,
                                        );
                                        setSimPreview(prev);
                                        setSimPreviewLabel(name);
                                        setLastError(null);
                                        return;
                                      }
                                      tryApply(id, applyOrb);
                                    }}
                                    tierRoman={tierRoman}
                                    ariaLabel={
                                      applicable
                                        ? craftLabMode === "simulation"
                                          ? t("orbSimulateAria", { name })
                                          : name
                                        : t("orbDisabledAria", { name })
                                    }
                                    disabledTitle={
                                      applicable
                                        ? undefined
                                        : t("orbDisabledTooltip")
                                    }
                                    showQuantityBadge={applicable}
                                    quantityLabel={t("stashOrbQuantityUnlimited")}
                                    strongDisabled={
                                      id === "orb_fracturing" && !applicable
                                    }
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {simPreview !== null ? (
                    <div className="mt-3">
                      <CraftingLabOrbPreviewPanel
                        orbLabel={simPreviewLabel}
                        preview={simPreview}
                        onClose={() => {
                          setSimPreview(null);
                          setSimPreviewLabel("");
                        }}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                {t("essencesHeading")}
              </h3>
              {!hasBaseForCraft ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t("stashPickBaseForCurrencies")}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {stashButton("essence_life", () => {
                    if (craftLabMode === "simulation") {
                      setSimPreview({
                        status: "ok",
                        noteKeys: ["essenceSimulationNote"],
                        sections: [],
                      });
                      setSimPreviewLabel(t("currency.essence_life"));
                      setLastError(null);
                      return;
                    }
                    tryApply("essence_life", (roll, filters) => {
                      return applyEssence(roll, LIFE_ESSENCE, filters);
                    });
                  })}
                  {stashButton("essence_attack", () => {
                    if (craftLabMode === "simulation") {
                      setSimPreview({
                        status: "ok",
                        noteKeys: ["essenceSimulationNote"],
                        sections: [],
                      });
                      setSimPreviewLabel(t("currency.essence_attack"));
                      setLastError(null);
                      return;
                    }
                    tryApply("essence_attack", (roll, filters) => {
                      return applyEssence(roll, ATTACK_ESSENCE, filters);
                    });
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {completionSnapshot !== null ? (
          <section
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm flex flex-col gap-3 w-full"
            aria-labelledby="craft-lab-usage-summary-heading"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3
                id="craft-lab-usage-summary-heading"
                className="font-sc text-base font-semibold text-zinc-900 dark:text-zinc-50"
              >
                {t("usageSummaryHeading")}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCompletionSnapshot(null);
                }}
                className="text-sm text-zinc-600 dark:text-zinc-400 underline-offset-2 hover:underline"
              >
                {t("usageSummaryDismiss")}
              </button>
            </div>
            {completionSnapshot.length === 0 ? (
              <p className="text-sm text-zinc-500">{t("usageSummaryEmpty")}</p>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    {t("usageSummaryOrderLabel")}
                  </p>
                  <ol className="list-decimal list-inside text-sm text-zinc-800 dark:text-zinc-200 space-y-1">
                    {completionSnapshot.map((id, index) => {
                      return (
                        <li key={`${id}-${String(index)}`}>
                          {t(`currency.${id}`)}
                        </li>
                      );
                    })}
                  </ol>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t("usageSummaryTotals", { line: usageTotalsLine })}
                </p>
              </>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
};
