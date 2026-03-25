"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { ItemSimulatorEmptyStateText } from "@/components/atoms/typography/ItemSimulatorEmptyStateText";
import { ItemSimulatorBaseItemFilterCollapsible } from "@/components/organisms/filters/ItemSimulatorBaseItemFilterCollapsible";
import { ItemSimulatorBaseItemTooltipCard } from "@/components/organisms/display/ItemSimulatorBaseItemTooltipCard";
import { ItemSimulatorBaseItemSearchBlock } from "@/components/organisms/filters/ItemSimulatorBaseItemSearchBlock";
import type { ItemSimulatorBaseItemFilterRangeFieldsPropsType } from "@/components/organisms/filters/ItemSimulatorBaseItemFilterRangeFields";
import { ItemSimulatorPanelShell } from "@/components/organisms/panels/ItemSimulatorPanelShell";

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
        <div className="min-h-[280px] flex flex-col justify-start">
          {selectedBaseItemRecord ? (
            <ItemSimulatorBaseItemTooltipCard
              record={selectedBaseItemRecord}
              baseItemKey={selectedBaseItemKey}
            />
          ) : (
            <ItemSimulatorEmptyStateText>
              {t("baseFilter.noResults")}
            </ItemSimulatorEmptyStateText>
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
