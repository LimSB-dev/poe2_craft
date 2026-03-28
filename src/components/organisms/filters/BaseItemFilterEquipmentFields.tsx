"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { BaseItemSubtypeOptions } from "./BaseItemSubtypeOptions";

type BaseItemFilterEquipmentFieldsPropsType = {
  equipmentTypeFilter: BaseItemEquipmentFilterType;
  onEquipmentTypeChange: (value: BaseItemEquipmentFilterType) => void;
  normalizedSubTypeFilter: BaseItemSubTypeFilterType;
  onSubTypeChange: (value: BaseItemSubTypeFilterType) => void;
  availableSubTypes: readonly IBaseItemSubTypeType[];
};

export const BaseItemFilterEquipmentFields = ({
  equipmentTypeFilter,
  onEquipmentTypeChange,
  normalizedSubTypeFilter,
  onSubTypeChange,
  availableSubTypes,
}: BaseItemFilterEquipmentFieldsPropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorWorkspace");

  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-800 dark:text-zinc-200">
          {t("baseFilter.type")}
        </span>
        <select
          value={equipmentTypeFilter}
          onChange={(event) => {
            const value = event.target.value as BaseItemEquipmentFilterType;
            if (
              value === "all" ||
              value === "weapon" ||
              value === "offhand" ||
              value === "armour" ||
              value === "jewellery"
            ) {
              onEquipmentTypeChange(value);
            }
          }}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        >
          <option value="all">{t("baseFilter.all")}</option>
          <option value="weapon">{t("equipmentType.weapon")}</option>
          <option value="offhand">{t("equipmentType.offhand")}</option>
          <option value="armour">{t("equipmentType.armour")}</option>
          <option value="jewellery">{t("equipmentType.jewellery")}</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-800 dark:text-zinc-200">
          {t("baseFilter.subType")}
        </span>
        <select
          value={normalizedSubTypeFilter}
          onChange={(event) => {
            const value = event.target.value as BaseItemSubTypeFilterType;
            if (
              value === "all" ||
              availableSubTypes.includes(value as IBaseItemSubTypeType)
            ) {
              onSubTypeChange(value);
            }
          }}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        >
          <BaseItemSubtypeOptions
            allLabel={t("baseFilter.all")}
            subTypes={availableSubTypes}
          />
        </select>
      </label>
    </>
  );
};
