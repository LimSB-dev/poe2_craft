"use client";

import { useTranslations } from "next-intl";
import type { ReactElement, ReactNode } from "react";

import { EmptyStateText, PanelHeader } from "@/components/atoms";
import { BaseItemTooltipCard } from "@/components/organisms/display";
import {
  BaseItemFilterCollapsible,
  BaseItemSearchBlock,
  type BaseItemFilterRangeFieldsPropsType,
} from "@/components/organisms/filters";
import {
  BaseItemItemLevelControl,
  PanelShell,
} from "@/components/molecules/panels";

type BaseItemTooltipCardExtraPropsType = Omit<
  React.ComponentProps<typeof BaseItemTooltipCard>,
  "record" | "baseItemKey"
>;

type BaseItemWorkspaceSectionSharedPropsType = {
  selectedBaseItemRecord: IBaseItemDbRecordType | undefined;
  selectedBaseItemKey: string;
  filteredBaseItemRecords: ReadonlyArray<IBaseItemDbRecordType>;
  effectiveSelectedBaseItemKey: string;
  onSelectBaseItemKey: (baseItemKey: string) => void;
  isFilterOpen: boolean;
  onFilterToggle: () => void;
  equipmentTypeFilter: BaseItemEquipmentFilterType;
  onEquipmentTypeChange: (value: BaseItemEquipmentFilterType) => void;
  normalizedSubTypeFilter: BaseItemSubTypeFilterType;
  onSubTypeChange: (value: BaseItemSubTypeFilterType) => void;
  availableSubTypes: readonly IBaseItemSubTypeType[];
  rangeFieldsProps: BaseItemFilterRangeFieldsPropsType;
  baseItemItemLevel: number;
  onBaseItemItemLevelChange: (value: number) => void;
  tooltipExtras?: BaseItemTooltipCardExtraPropsType;
  betweenTooltipAndSearch?: ReactNode;
};

type BaseItemWorkspaceSectionPropsType =
  | (BaseItemWorkspaceSectionSharedPropsType & {
      layout: "panelShell";
    })
  | (BaseItemWorkspaceSectionSharedPropsType & {
      layout: "section";
      headingId: string;
      headingAdornment?: ReactNode;
      topAddon?: ReactNode;
    });

export const BaseItemWorkspaceSection = (
  props: BaseItemWorkspaceSectionPropsType,
): ReactElement => {
  const {
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
    baseItemItemLevel,
    onBaseItemItemLevelChange,
    layout,
    tooltipExtras,
    betweenTooltipAndSearch,
  } = props;

  const topAddon = layout === "section" ? props.topAddon : undefined;
  const headingId = layout === "section" ? props.headingId : "";
  const headingAdornment =
    layout === "section" ? props.headingAdornment : undefined;

  const t = useTranslations("simulator.itemSimulatorWorkspace");

  const searchAndFilter = (
    <>
      <BaseItemSearchBlock
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

      <BaseItemFilterCollapsible
        isOpen={isFilterOpen}
        onToggle={onFilterToggle}
        equipmentTypeFilter={equipmentTypeFilter}
        onEquipmentTypeChange={onEquipmentTypeChange}
        normalizedSubTypeFilter={normalizedSubTypeFilter}
        onSubTypeChange={onSubTypeChange}
        availableSubTypes={availableSubTypes}
        rangeFieldsProps={rangeFieldsProps}
      />
    </>
  );

  const tooltipBlock = (
    <div className="min-h-[280px] flex flex-col justify-start">
      {selectedBaseItemRecord ? (
        <BaseItemTooltipCard
          record={selectedBaseItemRecord}
          baseItemKey={selectedBaseItemKey}
          {...tooltipExtras}
        />
      ) : (
        <EmptyStateText>{t("baseFilter.noResults")}</EmptyStateText>
      )}
    </div>
  );

  const body = (
    <div className="flex flex-col gap-3">
      {topAddon}
      {tooltipBlock}
      <BaseItemItemLevelControl
        value={baseItemItemLevel}
        onChange={onBaseItemItemLevelChange}
      />
      {betweenTooltipAndSearch}
      {searchAndFilter}
    </div>
  );

  if (layout === "panelShell") {
    return (
      <PanelShell
        title={t("panels.baseItem.title")}
        description={t("panels.baseItem.description")}
      >
        {body}
      </PanelShell>
    );
  }

  return (
    <section
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      aria-labelledby={headingId}
    >
      <div className="flex flex-wrap items-start gap-3">
        {headingAdornment}
        <div className="min-w-0 flex-1">
          <PanelHeader
            titleId={headingId}
            title={t("panels.baseItem.title")}
            description={t("panels.baseItem.description")}
          />
        </div>
      </div>
      {body}
    </section>
  );
};
