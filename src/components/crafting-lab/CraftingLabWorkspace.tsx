"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactElement } from "react";

import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { ItemSimulatorBaseItemFilterCollapsible } from "@/components/item-simulator/ItemSimulatorBaseItemFilterCollapsible";
import { ItemSimulatorBaseItemSearchBlock } from "@/components/item-simulator/ItemSimulatorBaseItemSearchBlock";
import { ItemSimulatorBaseItemTooltipCard } from "@/components/item-simulator/ItemSimulatorBaseItemTooltipCard";
import { useItemSimulatorBaseItemPanelState } from "@/components/item-simulator/useItemSimulatorBaseItemPanelState";
import { Link } from "@/lib/i18n/navigation";
import {
  applyChaosOrb,
  applyExaltedOrb,
  applyOrbOfAlchemy,
  applyOrbOfAnnulment,
  applyOrbOfAugmentation,
  applyOrbOfTransmutation,
  applyRegalOrb,
} from "@/lib/poe2-item-simulator/basicCurrencyOrbs";
import {
  applyEssence,
  ATTACK_ESSENCE,
  LIFE_ESSENCE,
} from "@/lib/poe2-item-simulator/essence";
import type { IItemRoll } from "@/lib/poe2-item-simulator/types";

const EMPTY_NORMAL_ROLL: IItemRoll = {
  rarity: "normal",
  prefixes: [],
  suffixes: [],
};

const INITIAL_STASH_COUNTS: number = 999;

type CraftingCurrencyIdType =
  | "orb_transmutation"
  | "orb_augmentation"
  | "orb_regal"
  | "orb_alchemy"
  | "orb_exalted"
  | "orb_chaos"
  | "orb_annulment"
  | "orb_divine"
  | "essence_life"
  | "essence_attack"
  | "omen_placeholder";

type StashStateType = Record<CraftingCurrencyIdType, number>;

const createInitialStash = (): StashStateType => {
  return {
    orb_transmutation: INITIAL_STASH_COUNTS,
    orb_augmentation: INITIAL_STASH_COUNTS,
    orb_regal: INITIAL_STASH_COUNTS,
    orb_alchemy: INITIAL_STASH_COUNTS,
    orb_exalted: INITIAL_STASH_COUNTS,
    orb_chaos: INITIAL_STASH_COUNTS,
    orb_annulment: INITIAL_STASH_COUNTS,
    orb_divine: INITIAL_STASH_COUNTS,
    essence_life: INITIAL_STASH_COUNTS,
    essence_attack: INITIAL_STASH_COUNTS,
    omen_placeholder: INITIAL_STASH_COUNTS,
  };
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
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

  const [itemRoll, setItemRoll] = useState<IItemRoll>(EMPTY_NORMAL_ROLL);
  const [stash, setStash] = useState<StashStateType>(createInitialStash);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    // 베이스(또는 필터로 인한 effective 키)가 바뀌면 수동 크래프트 롤만 초기화 — 창고는 유지
    // eslint-disable-next-line react-hooks/set-state-in-effect -- effective 베이스 변경 시 롤 리셋
    setItemRoll(EMPTY_NORMAL_ROLL);
    setLastError(null);
  }, [effectiveSelectedBaseItemKey]);

  const spend = (id: CraftingCurrencyIdType): boolean => {
    if (stash[id] <= 0) {
      return false;
    }
    setStash((prev) => {
      return { ...prev, [id]: prev[id] - 1 };
    });
    return true;
  };

  const tryApply = (
    id: CraftingCurrencyIdType,
    apply: (roll: IItemRoll) => IItemRoll,
  ): void => {
    if (
      effectiveSelectedBaseItemKey.length === 0 ||
      selectedBaseItemRecord === undefined
    ) {
      setLastError(tWs("baseFilter.noResults"));
      return;
    }
    if (!spend(id)) {
      setLastError(t("stashDepleted"));
      return;
    }
    try {
      const next = apply(itemRoll);
      setItemRoll(next);
      setLastError(null);
    } catch (error: unknown) {
      setStash((prev) => {
        return { ...prev, [id]: prev[id] + 1 };
      });
      setLastError(getErrorMessage(error));
    }
  };

  const stashButton = (
    id: CraftingCurrencyIdType,
    onUse: () => void,
    options?: { disabled?: boolean; title?: string },
  ): ReactElement => {
    const count = stash[id];
    const disabled = options?.disabled === true || count <= 0;
    return (
      <button
        type="button"
        disabled={disabled}
        title={options?.title}
        onClick={() => {
          onUse();
        }}
        className="flex flex-col items-stretch gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-left text-sm transition hover:border-amber-400/60 disabled:opacity-40 disabled:pointer-events-none"
      >
        <span className="font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
          {t(`currency.${id}`)}
        </span>
        <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
          {t("stashCount", { count })}
        </span>
      </button>
    );
  };

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
            <div>
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
            <h2
              id="craft-lab-stash-heading"
              className="font-sc text-base font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {t("stashColumnTitle")}
            </h2>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                {t("orbsHeading")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {stashButton("orb_transmutation", () => {
                  tryApply("orb_transmutation", applyOrbOfTransmutation);
                })}
                {stashButton("orb_augmentation", () => {
                  tryApply("orb_augmentation", applyOrbOfAugmentation);
                })}
                {stashButton("orb_regal", () => {
                  tryApply("orb_regal", applyRegalOrb);
                })}
                {stashButton("orb_alchemy", () => {
                  tryApply("orb_alchemy", applyOrbOfAlchemy);
                })}
                {stashButton("orb_exalted", () => {
                  tryApply("orb_exalted", applyExaltedOrb);
                })}
                {stashButton("orb_chaos", () => {
                  tryApply("orb_chaos", applyChaosOrb);
                })}
                {stashButton("orb_annulment", () => {
                  tryApply("orb_annulment", applyOrbOfAnnulment);
                })}
                {stashButton("orb_divine", () => {}, {
                  disabled: true,
                  title: t("divineDisabledHint"),
                })}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                {t("essencesHeading")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {stashButton("essence_life", () => {
                  tryApply("essence_life", (roll) => {
                    return applyEssence(roll, LIFE_ESSENCE);
                  });
                })}
                {stashButton("essence_attack", () => {
                  tryApply("essence_attack", (roll) => {
                    return applyEssence(roll, ATTACK_ESSENCE);
                  });
                })}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                {t("omensHeading")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {stashButton("omen_placeholder", () => {}, {
                  disabled: true,
                  title: t("omenDisabledHint"),
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
