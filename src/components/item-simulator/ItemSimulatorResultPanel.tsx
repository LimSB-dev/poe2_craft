"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { ItemSimulatorCatalogBaseName } from "@/components/item-simulator/i18n/ItemSimulatorCatalogBaseName";
import { ItemSimulatorCatalogItemClassLabel } from "@/components/item-simulator/i18n/ItemSimulatorCatalogItemClassLabel";
import { ItemSimulatorModListSection } from "@/components/item-simulator/ItemSimulatorModListSection";
import { ItemSimulatorPanelShell } from "@/components/item-simulator/ItemSimulatorPanelShell";
import { BASE_ITEM_DB } from "@/lib/poe2-item-simulator/baseItemDb";
import type {
  IDesiredModEntryType,
  IItemSimulationResultType,
} from "@/lib/poe2-item-simulator/types";

type ItemSimulatorResultPanelPropsType = {
  simulationResult: IItemSimulationResultType | null;
  desiredMods: ReadonlyArray<IDesiredModEntryType>;
  onRunRoll: () => void;
};

export const ItemSimulatorResultPanel = ({
  simulationResult,
  desiredMods,
  onRunRoll,
}: ItemSimulatorResultPanelPropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorWorkspace");

  return (
    <ItemSimulatorPanelShell
      title={t("panels.result.title")}
      description={t("panels.result.description")}
    >
      <button
        type="button"
        onClick={onRunRoll}
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
            const desiredModKeys = new Set(desiredMods.map((m) => m.modKey));
            return (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ItemSimulatorModListSection
                  title={t("resultModList.prefixes")}
                  mods={simulationResult.roll.prefixes}
                  emptyLabel={t("resultModList.empty")}
                  desiredModKeys={desiredModKeys}
                />
                <ItemSimulatorModListSection
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
    </ItemSimulatorPanelShell>
  );
};
