"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { ItemSimulatorBaseItemFilterCollapsible } from "@/components/item-simulator/ItemSimulatorBaseItemFilterCollapsible";
import { ItemSimulatorBaseItemTooltipCard } from "@/components/item-simulator/ItemSimulatorBaseItemTooltipCard";
import { ItemSimulatorBaseItemSearchBlock } from "@/components/item-simulator/ItemSimulatorBaseItemSearchBlock";
import type { ItemSimulatorBaseItemFilterRangeFieldsPropsType } from "@/components/item-simulator/ItemSimulatorBaseItemFilterRangeFields";
import type {
  ItemSimulatorEquipmentFilterType,
  ItemSimulatorSubTypeFilterType,
} from "@/components/item-simulator/itemSimulatorWorkspaceTypes";
import { ItemSimulatorPanelShell } from "@/components/item-simulator/ItemSimulatorPanelShell";
import type {
  IBaseItemDbRecordType,
  IBaseItemSubTypeType,
} from "@/lib/poe2-item-simulator/baseItemDb";

type ItemSimulatorBaseItemPanelPropsType = {
  selectedBaseItemRecord: IBaseItemDbRecordType | undefined;
  selectedBaseItemKey: string;
  filteredBaseItemRecords: ReadonlyArray<IBaseItemDbRecordType>;
  effectiveSelectedBaseItemKey: string;
  onSelectBaseItemKey: (baseItemKey: string) => void;
  isFilterOpen: boolean;
  onFilterToggle: () => void;
  equipmentTypeFilter: ItemSimulatorEquipmentFilterType;
  onEquipmentTypeChange: (value: ItemSimulatorEquipmentFilterType) => void;
  normalizedSubTypeFilter: ItemSimulatorSubTypeFilterType;
  onSubTypeChange: (value: ItemSimulatorSubTypeFilterType) => void;
  availableSubTypes: readonly IBaseItemSubTypeType[];
  rangeFieldsProps: ItemSimulatorBaseItemFilterRangeFieldsPropsType;
};

export const ItemSimulatorBaseItemPanel = ({
  selectedBaseItemRecord,
  selectedBaseItemKey,
  filteredBaseItemRecords,
  effectiveSelectedBaseItemKey,
  onSelectBaseItemKey,
  isFilterOpen,
  onFilterToggle,
  equipmentTypeFilter,
  onEquipmentTypeChange,
  normalizedSubTypeFilter,
  onSubTypeChange,
  availableSubTypes,
  rangeFieldsProps,
}: ItemSimulatorBaseItemPanelPropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorWorkspace");

  return (
    <ItemSimulatorPanelShell
      title={t("panels.baseItem.title")}
      description={t("panels.baseItem.description")}
    >
      <div className="flex flex-col gap-3">
        <div className="min-h-[216px] flex flex-col justify-start">
          {selectedBaseItemRecord ? (
            <ItemSimulatorBaseItemTooltipCard
              record={selectedBaseItemRecord}
              baseItemKey={selectedBaseItemKey}
            />
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 py-1">
              {t("baseFilter.noResults")}
            </p>
          )}
        </div>

        <ItemSimulatorBaseItemSearchBlock
          filteredBaseItemRecords={filteredBaseItemRecords}
          effectiveSelectedBaseItemKey={effectiveSelectedBaseItemKey}
          onSelectBaseItemKey={onSelectBaseItemKey}
          searchPlaceholder={t("baseFilter.baseItemSearchPlaceholder", {
            label: t("baseFilter.baseItem"),
            count: filteredBaseItemRecords.length,
          })}
          ariaLabelBaseItem={t("baseFilter.baseItem")}
          noResultsLabel={t("baseFilter.noResults")}
        />

        <ItemSimulatorBaseItemFilterCollapsible
          isOpen={isFilterOpen}
          onToggle={onFilterToggle}
          equipmentTypeFilter={equipmentTypeFilter}
          onEquipmentTypeChange={onEquipmentTypeChange}
          normalizedSubTypeFilter={normalizedSubTypeFilter}
          onSubTypeChange={onSubTypeChange}
          availableSubTypes={availableSubTypes}
          rangeFieldsProps={rangeFieldsProps}
        />
      </div>
    </ItemSimulatorPanelShell>
  );
};
