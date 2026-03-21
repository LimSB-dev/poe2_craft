"use client";

import { useTranslations } from "next-intl";
import { useMemo, type ReactElement } from "react";

import { ItemSimulatorCatalogBaseName } from "@/components/item-simulator/i18n/ItemSimulatorCatalogBaseName";
import { ItemSimulatorCatalogItemClassLabel } from "@/components/item-simulator/i18n/ItemSimulatorCatalogItemClassLabel";
import { ItemSimulatorPanelShell } from "@/components/item-simulator/ItemSimulatorPanelShell";
import { BASE_ITEM_DB } from "@/lib/poe2-item-simulator/baseItemDb";
import {
  exaltedValueOfOneCurrencyUnit,
  getRlCraftingActionCostsExalt,
} from "@/lib/poe2-item-simulator/currencyExaltExchangeRates";
import type {
  IEfficientCraftingPlanType,
  IEfficientPlanStepType,
} from "@/lib/poe2-item-simulator/efficientCraftingPlan";
import type {
  IDesiredModEntryType,
  IBaseItemDefinition,
} from "@/lib/poe2-item-simulator/types";

type ItemSimulatorResultPanelPropsType = {
  selectedBaseItem: IBaseItemDefinition | null;
  plan: IEfficientCraftingPlanType | null;
  desiredMods: ReadonlyArray<IDesiredModEntryType>;
  onComputePlan: () => void;
};

type ItemSimulatorWorkspaceTranslateType = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

const renderStepLabel = (
  step: IEfficientPlanStepType,
  t: ItemSimulatorWorkspaceTranslateType,
): string => {
  if (step.key === "essenceEachDesired") {
    return t("efficientPlan.steps.essenceEachDesired", {
      count: step.desiredCount,
    });
  }
  return t(`efficientPlan.steps.${step.key}`);
};

export const ItemSimulatorResultPanel = ({
  selectedBaseItem,
  plan,
  desiredMods,
  onComputePlan,
}: ItemSimulatorResultPanelPropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorWorkspace");
  const costsExalt = useMemo(() => getRlCraftingActionCostsExalt(), []);
  const alchemyExalt = useMemo(
    () => exaltedValueOfOneCurrencyUnit("orbOfAlchemy"),
    [],
  );

  return (
    <ItemSimulatorPanelShell
      title={t("panels.result.title")}
      description={t("panels.result.description")}
    >
      <button
        type="button"
        onClick={onComputePlan}
        className="w-full sm:w-auto rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
      >
        {t("computeEfficientPlanButton")}
      </button>

      {!selectedBaseItem ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("efficientPlan.emptyNeedBase")}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {(() => {
            const resultRecord = BASE_ITEM_DB.records.find(
              (r) => r.baseItemKey === selectedBaseItem.baseItemKey,
            );
            return (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 px-4 py-3 flex flex-col gap-1">
                <div className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                  <ItemSimulatorCatalogBaseName
                    baseItemKey={selectedBaseItem.baseItemKey}
                  />
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-500">
                  <ItemSimulatorCatalogItemClassLabel
                    itemClassKey={selectedBaseItem.itemClassKey}
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
              </div>
            );
          })()}

          {!plan ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("resultCard.empty")}
            </p>
          ) : (
            <>
              <section
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 px-3 py-2.5"
                aria-labelledby="efficient-plan-heading"
              >
                <h3
                  id="efficient-plan-heading"
                  className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  {t("efficientPlan.heading")}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
                  {t("efficientPlan.intro")}
                </p>
                {desiredMods.length > 0 ? (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {t("efficientPlan.targetCount", {
                      count: desiredMods.length,
                    })}
                  </p>
                ) : null}
                <ol className="mt-2 list-decimal list-inside space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                  {plan.steps.map((step, index) => {
                    return (
                      <li key={`${step.key}-${index}`}>
                        {renderStepLabel(step, t)}
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
                  {t("efficientPlan.costsLine", {
                    alchemy: alchemyExalt.toFixed(2),
                    chaos: costsExalt.chaosOrb.toFixed(2),
                    essence: costsExalt.essence.toFixed(2),
                  })}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
                  {t("efficientPlan.rlNote")}
                </p>
              </section>
            </>
          )}
        </div>
      )}
    </ItemSimulatorPanelShell>
  );
};
