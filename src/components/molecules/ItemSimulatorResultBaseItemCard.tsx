"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { ItemSimulatorCatalogBaseName } from "@/components/organisms/ItemSimulatorCatalogBaseName";
import { ItemSimulatorCatalogItemClassLabel } from "@/components/organisms/ItemSimulatorCatalogItemClassLabel";
import { BASE_ITEM_DB } from "@/lib/poe2-item-simulator/baseItemDb";
import type { IBaseItemDefinition } from "@/types/poe2-item-simulator";

type ItemSimulatorResultBaseItemCardPropsType = {
  selectedBaseItem: IBaseItemDefinition;
};

export const ItemSimulatorResultBaseItemCard = ({
  selectedBaseItem,
}: ItemSimulatorResultBaseItemCardPropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorWorkspace");
  const resultRecord = BASE_ITEM_DB.records.find((record) => {
    return record.baseItemKey === selectedBaseItem.baseItemKey;
  });

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="text-lg font-semibold text-amber-700 dark:text-amber-400">
        <ItemSimulatorCatalogBaseName baseItemKey={selectedBaseItem.baseItemKey} />
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-500">
        <ItemSimulatorCatalogItemClassLabel itemClassKey={selectedBaseItem.itemClassKey} />
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
    </div>
  );
};
