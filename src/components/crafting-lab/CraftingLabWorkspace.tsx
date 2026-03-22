"use client";

import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";

import { CraftingLabOrbPreviewPanel } from "@/components/crafting-lab/CraftingLabOrbPreviewPanel";
import { CraftingLabOrbSlotButton } from "@/components/crafting-lab/CraftingLabOrbSlotButton";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { ItemSimulatorBaseItemFilterCollapsible } from "@/components/item-simulator/ItemSimulatorBaseItemFilterCollapsible";
import { ItemSimulatorBaseItemSearchBlock } from "@/components/item-simulator/ItemSimulatorBaseItemSearchBlock";
import { ItemSimulatorBaseItemTooltipCard } from "@/components/item-simulator/ItemSimulatorBaseItemTooltipCard";
import { useItemSimulatorBaseItemPanelState } from "@/components/item-simulator/useItemSimulatorBaseItemPanelState";
import {
  buildHinekoraLockedDraftTable,
  getCachedHinekoraLockedDraftTable,
} from "@/lib/crafting-lab/buildHinekoraLockedDraftTable";
import { getCraftingLabCurrencyIconUrl } from "@/lib/crafting-lab/craftingLabCurrencyIconUrls";
import {
  CRAFT_LAB_CURRENCY_TAB_BOTTOM_ROW,
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
  applyHinekorasLock,
  canApplyHinekorasLock,
  stripHinekoraLock,
} from "@/lib/poe2-item-simulator/hinekorasLock";
import {
  applyEssence,
  ATTACK_ESSENCE,
  LIFE_ESSENCE,
} from "@/lib/poe2-item-simulator/essence";
import type { IItemRoll } from "@/lib/poe2-item-simulator/types";

type CraftLabModeType = "random" | "simulation";

type CraftLabStashTabIdType = "currency" | "essence" | "abyss" | "ritual";

const CRAFT_LAB_STASH_TABS: readonly CraftLabStashTabIdType[] = [
  "currency",
  "essence",
  "abyss",
  "ritual",
] as const;

const ABYSS_STASH_SLOT_COUNT = 9;

const CRAFT_LAB_STASH_TAB_LABEL_KEYS: Record<CraftLabStashTabIdType, string> = {
  currency: "stashTabCurrency",
  essence: "stashTabEssence",
  abyss: "stashTabAbyss",
  ritual: "stashTabRitual",
};

const EMPTY_NORMAL_ROLL: IItemRoll = {
  rarity: "normal",
  prefixes: [],
  suffixes: [],
};

/** 되돌리기 스택이 과도하게 커지지 않도록 상한. */
const MAX_CRAFT_UNDO_DEPTH: number = 100;

const cloneItemRoll = (roll: IItemRoll): IItemRoll => {
  const base: IItemRoll = {
    rarity: roll.rarity,
    prefixes: roll.prefixes.map((m) => {
      return { ...m };
    }),
    suffixes: roll.suffixes.map((m) => {
      return { ...m };
    }),
  };
  if (roll.hinekoraLockActive === true) {
    return { ...base, hinekoraLockActive: true };
  }
  return base;
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

const getCraftLabDisabledCurrencyRowTooltip = (
  id: CraftingCurrencyIdType,
  tCraft: (key: string) => string,
): string => {
  switch (id) {
    case "orb_divine": {
      return tCraft("divineDisabledHint");
    }
    case "orb_vaal": {
      return tCraft("vaalOrbDisabledHint");
    }
    case "orb_mirror": {
      return tCraft("mirrorDisabledHint");
    }
    default: {
      return tCraft("currencyTabDisabledGeneric");
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
  const [stashTab, setStashTab] = useState<CraftLabStashTabIdType>("currency");
  const [hinekoraHoverPreview, setHinekoraHoverPreview] =
    useState<IItemRoll | null>(null);

  const hinekoraLockSessionKey = useMemo(() => {
    if (itemRoll.hinekoraLockActive !== true) {
      return null;
    }
    if (selectedBaseItemRecord === undefined) {
      return null;
    }
    const stripped = stripHinekoraLock(itemRoll);
    return JSON.stringify({
      baseItemKey: effectiveSelectedBaseItemKey,
      rarity: stripped.rarity,
      prefixes: stripped.prefixes,
      suffixes: stripped.suffixes,
      filters: modRollFilters,
    });
  }, [
    effectiveSelectedBaseItemKey,
    itemRoll,
    modRollFilters,
    selectedBaseItemRecord,
  ]);

  const hinekoraLockedDraftTable = useMemo(() => {
    return getCachedHinekoraLockedDraftTable(
      hinekoraLockSessionKey,
      modRollFilters,
      () => {
        const stripped = stripHinekoraLock(itemRoll);
        return buildHinekoraLockedDraftTable(
          stripped,
          itemRoll,
          modRollFilters,
          cloneItemRoll,
        );
      },
    );
  }, [hinekoraLockSessionKey, itemRoll, modRollFilters]);

  const resolveHinekoraHoverDraft = useCallback(
    (id: CraftingCurrencyIdType): IItemRoll | null => {
      if (
        itemRoll.hinekoraLockActive !== true ||
        craftLabMode !== "random" ||
        effectiveSelectedBaseItemKey.length === 0 ||
        selectedBaseItemRecord === undefined
      ) {
        return null;
      }
      if (id === "orb_hinekoras_lock") {
        return null;
      }
      if (
        id === "orb_divine" ||
        id === "orb_vaal" ||
        id === "orb_mirror" ||
        id === "omen_placeholder"
      ) {
        return null;
      }
      return hinekoraLockedDraftTable?.[id] ?? null;
    },
    [
      craftLabMode,
      effectiveSelectedBaseItemKey.length,
      hinekoraLockedDraftTable,
      itemRoll.hinekoraLockActive,
      selectedBaseItemRecord,
    ],
  );

  useEffect(() => {
    // 히네코라 호버 미리보기는 이전 롤·탭과 불일치하면 무효
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 동기 초기화만 수행
    setHinekoraHoverPreview(null);
  }, [craftLabMode, effectiveSelectedBaseItemKey, itemRoll, stashTab]);

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

  const commitCraftingResult = (
    nextRoll: IItemRoll,
    id: CraftingCurrencyIdType,
  ): void => {
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
    setSimPreview(null);
    setSimPreviewLabel("");
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
    if (id === "orb_hinekoras_lock") {
      try {
        const nextRoll = applyHinekorasLock(itemRoll);
        commitCraftingResult(nextRoll, id);
      } catch (error: unknown) {
        setLastError(getErrorMessage(error));
      }
      return;
    }
    if (itemRoll.hinekoraLockActive === true && craftLabMode === "random") {
      const draft = hinekoraLockedDraftTable?.[id];
      if (draft === undefined) {
        setLastError(t("hinekoraDraftTableMissing"));
        return;
      }
      commitCraftingResult(draft, id);
      return;
    }
    try {
      const nextRoll = apply(stripHinekoraLock(itemRoll), modRollFilters);
      commitCraftingResult(nextRoll, id);
    } catch (error: unknown) {
      setLastError(getErrorMessage(error));
    }
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
              {itemRoll.hinekoraLockActive === true && hasBaseForCraft ? (
                <p
                  className="text-xs font-medium text-amber-800 dark:text-amber-300/95"
                  role="status"
                >
                  {t("hinekoraLockActiveBanner")}
                </p>
              ) : null}
              <div className="min-h-[216px] flex flex-col justify-start">
                {selectedBaseItemRecord ? (
                  <ItemSimulatorBaseItemTooltipCard
                    record={selectedBaseItemRecord}
                    baseItemKey={selectedBaseItem?.baseItemKey ?? ""}
                    explicitItemRoll={itemRoll}
                    previewExplicitItemRoll={hinekoraHoverPreview}
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

            {!hasBaseForCraft ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("stashPickBaseForCurrencies")}
              </p>
            ) : (
              <>
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

                <div
                  role="tablist"
                  aria-label={t("stashTabListAria")}
                  className="mb-3 flex flex-wrap gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 p-1 dark:bg-zinc-900/50"
                >
                  {CRAFT_LAB_STASH_TABS.map((tabId) => {
                    const isSelected = stashTab === tabId;
                    return (
                      <button
                        key={tabId}
                        id={`craft-stash-tab-${tabId}`}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        aria-controls={`craft-stash-panel-${tabId}`}
                        onClick={() => {
                          setStashTab(tabId);
                        }}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/80 ${
                          isSelected
                            ? "bg-amber-600/90 text-white shadow-sm dark:bg-amber-700/90"
                            : "text-zinc-600 hover:bg-zinc-200/90 dark:text-zinc-400 dark:hover:bg-zinc-800/90"
                        }`}
                      >
                        {t(CRAFT_LAB_STASH_TAB_LABEL_KEYS[tabId])}
                      </button>
                    );
                  })}
                </div>

                <div className="min-h-[200px]">
                  <div
                    id="craft-stash-panel-currency"
                    role="tabpanel"
                    aria-labelledby="craft-stash-tab-currency"
                    hidden={stashTab !== "currency"}
                    className={stashTab !== "currency" ? "hidden" : undefined}
                  >
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
                                            stripHinekoraLock(itemRoll),
                                            modRollFilters,
                                          );
                                          setSimPreview(prev);
                                          setSimPreviewLabel(name);
                                          setLastError(null);
                                          return;
                                        }
                                        tryApply(id, applyOrb);
                                      }}
                                      onHoverChange={(hovered) => {
                                        if (!hovered) {
                                          setHinekoraHoverPreview(null);
                                          return;
                                        }
                                        setHinekoraHoverPreview(
                                          resolveHinekoraHoverDraft(id),
                                        );
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
                        <div className="w-full min-w-0">
                          <div className="mx-auto grid w-max grid-cols-4 gap-1.5 sm:gap-2">
                            {CRAFT_LAB_CURRENCY_TAB_BOTTOM_ROW.map((id) => {
                              const iconSrc = getCraftingLabCurrencyIconUrl(id);
                              const name = t(`currency.${id}`);
                              if (id === "orb_hinekoras_lock") {
                                const disabled = !canApplyHinekorasLock(itemRoll);
                                return (
                                  <CraftingLabOrbSlotButton
                                    key={id}
                                    iconSrc={iconSrc}
                                    disabled={disabled}
                                    onUse={() => {
                                      if (craftLabMode === "simulation") {
                                        setLastError(t("hinekoraLockNoSimPreview"));
                                        return;
                                      }
                                      tryApply("orb_hinekoras_lock", (roll) => {
                                        return applyHinekorasLock(roll);
                                      });
                                    }}
                                    onHoverChange={(hovered) => {
                                      if (!hovered) {
                                        setHinekoraHoverPreview(null);
                                        return;
                                      }
                                      setHinekoraHoverPreview(
                                        resolveHinekoraHoverDraft("orb_hinekoras_lock"),
                                      );
                                    }}
                                    tierRoman={null}
                                    ariaLabel={
                                      disabled
                                        ? t("orbDisabledAria", { name })
                                        : name
                                    }
                                    disabledTitle={
                                      disabled ? t("hinekoraLockAlreadyActive") : undefined
                                    }
                                    showQuantityBadge={!disabled}
                                    quantityLabel={t("stashOrbQuantityUnlimited")}
                                  />
                                );
                              }
                              return (
                                <CraftingLabOrbSlotButton
                                  key={id}
                                  iconSrc={iconSrc}
                                  disabled
                                  onUse={() => {}}
                                  onHoverChange={(hovered) => {
                                    if (!hovered) {
                                      setHinekoraHoverPreview(null);
                                      return;
                                    }
                                    setHinekoraHoverPreview(
                                      resolveHinekoraHoverDraft(id),
                                    );
                                  }}
                                  tierRoman={null}
                                  ariaLabel={name}
                                  disabledTitle={getCraftLabDisabledCurrencyRowTooltip(
                                    id,
                                    t,
                                  )}
                                  showQuantityBadge={false}
                                  quantityLabel=""
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    id="craft-stash-panel-essence"
                    role="tabpanel"
                    aria-labelledby="craft-stash-tab-essence"
                    hidden={stashTab !== "essence"}
                    className={stashTab !== "essence" ? "hidden" : undefined}
                  >
                    <div className="rounded-lg border border-[#3d3429] bg-[#141210] p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)] dark:bg-[#141210]">
                      <div className="mx-auto grid w-max grid-cols-3 gap-1.5 sm:gap-2">
                        <CraftingLabOrbSlotButton
                          iconSrc={getCraftingLabCurrencyIconUrl("essence_life")}
                          disabled={false}
                          onUse={() => {
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
                          }}
                          onHoverChange={(hovered) => {
                            if (!hovered) {
                              setHinekoraHoverPreview(null);
                              return;
                            }
                            setHinekoraHoverPreview(
                              resolveHinekoraHoverDraft("essence_life"),
                            );
                          }}
                          tierRoman={null}
                          ariaLabel={
                            craftLabMode === "simulation"
                              ? t("orbSimulateAria", {
                                  name: t("currency.essence_life"),
                                })
                              : t("currency.essence_life")
                          }
                          showQuantityBadge
                          quantityLabel={t("stashOrbQuantityUnlimited")}
                        />
                        <CraftingLabOrbSlotButton
                          iconSrc={getCraftingLabCurrencyIconUrl("essence_attack")}
                          disabled={false}
                          onUse={() => {
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
                          }}
                          onHoverChange={(hovered) => {
                            if (!hovered) {
                              setHinekoraHoverPreview(null);
                              return;
                            }
                            setHinekoraHoverPreview(
                              resolveHinekoraHoverDraft("essence_attack"),
                            );
                          }}
                          tierRoman={null}
                          ariaLabel={
                            craftLabMode === "simulation"
                              ? t("orbSimulateAria", {
                                  name: t("currency.essence_attack"),
                                })
                              : t("currency.essence_attack")
                          }
                          showQuantityBadge
                          quantityLabel={t("stashOrbQuantityUnlimited")}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    id="craft-stash-panel-abyss"
                    role="tabpanel"
                    aria-labelledby="craft-stash-tab-abyss"
                    hidden={stashTab !== "abyss"}
                    className={stashTab !== "abyss" ? "hidden" : undefined}
                  >
                    <p className="mb-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                      {t("abyssTabHint")}
                    </p>
                    <div className="rounded-lg border border-[#3d3429] bg-[#141210] p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)] dark:bg-[#141210]">
                      <div className="mx-auto grid w-max grid-cols-3 gap-1.5 sm:gap-2">
                        {Array.from({ length: ABYSS_STASH_SLOT_COUNT }, (_, slotIndex) => {
                          return (
                            <CraftingLabOrbSlotButton
                              key={`abyss-slot-${String(slotIndex)}`}
                              iconSrc={undefined}
                              disabled
                              onUse={() => {}}
                              onHoverChange={(hovered) => {
                                if (hovered) {
                                  setHinekoraHoverPreview(null);
                                }
                              }}
                              tierRoman={null}
                              ariaLabel={t("abyssSlotDisabledTooltip")}
                              disabledTitle={t("abyssSlotDisabledTooltip")}
                              showQuantityBadge={false}
                              quantityLabel=""
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div
                    id="craft-stash-panel-ritual"
                    role="tabpanel"
                    aria-labelledby="craft-stash-tab-ritual"
                    hidden={stashTab !== "ritual"}
                    className={stashTab !== "ritual" ? "hidden" : undefined}
                  >
                    <p className="mb-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                      {t("ritualTabHint")}
                    </p>
                    <div className="rounded-lg border border-[#3d3429] bg-[#141210] p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)] dark:bg-[#141210]">
                      <div className="mx-auto grid w-max grid-cols-3 gap-1.5 sm:gap-2">
                        <CraftingLabOrbSlotButton
                          iconSrc={getCraftingLabCurrencyIconUrl("omen_placeholder")}
                          disabled
                          onUse={() => {}}
                          onHoverChange={(hovered) => {
                            if (hovered) {
                              setHinekoraHoverPreview(null);
                            }
                          }}
                          tierRoman={null}
                          ariaLabel={t("currency.omen_placeholder")}
                          disabledTitle={t("omenDisabledHint")}
                          showQuantityBadge={false}
                          quantityLabel=""
                        />
                      </div>
                    </div>
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
