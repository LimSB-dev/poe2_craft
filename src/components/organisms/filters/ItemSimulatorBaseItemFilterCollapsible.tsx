"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { ItemSimulatorBaseItemFilterEquipmentFields } from "@/components/organisms/filters/ItemSimulatorBaseItemFilterEquipmentFields";
import { ItemSimulatorBaseItemFilterRangeFields } from "@/components/organisms/filters/ItemSimulatorBaseItemFilterRangeFields";
import type { ItemSimulatorBaseItemFilterRangeFieldsPropsType } from "@/components/organisms/filters/ItemSimulatorBaseItemFilterRangeFields";

type ItemSimulatorBaseItemFilterCollapsiblePropsType = {
  isOpen: boolean;
  onToggle: () => void;
  equipmentTypeFilter: ItemSimulatorEquipmentFilterType;
  onEquipmentTypeChange: (value: ItemSimulatorEquipmentFilterType) => void;
  normalizedSubTypeFilter: ItemSimulatorSubTypeFilterType;
  onSubTypeChange: (value: ItemSimulatorSubTypeFilterType) => void;
  availableSubTypes: readonly IBaseItemSubTypeType[];
  rangeFieldsProps: ItemSimulatorBaseItemFilterRangeFieldsPropsType;
};

export const ItemSimulatorBaseItemFilterCollapsible = ({
  isOpen,
  onToggle,
  equipmentTypeFilter,
  onEquipmentTypeChange,
  normalizedSubTypeFilter,
  onSubTypeChange,
  availableSubTypes,
  rangeFieldsProps,
}: ItemSimulatorBaseItemFilterCollapsiblePropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorWorkspace");

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors self-start"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className={`size-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
        {t("baseFilter.filterToggle")}
      </button>

      {isOpen && (
        <div className="flex flex-col gap-3">
          <ItemSimulatorBaseItemFilterEquipmentFields
            equipmentTypeFilter={equipmentTypeFilter}
            onEquipmentTypeChange={onEquipmentTypeChange}
            normalizedSubTypeFilter={normalizedSubTypeFilter}
            onSubTypeChange={onSubTypeChange}
            availableSubTypes={availableSubTypes}
          />
          <ItemSimulatorBaseItemFilterRangeFields {...rangeFieldsProps} />
        </div>
      )}
    </>
  );
};
