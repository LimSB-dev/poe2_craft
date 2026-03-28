"use client";

import type { ReactElement } from "react";

import type { UseBaseItemWorkspaceStateReturnType } from "@/hooks";
import {
  BaseItemWorkspaceSection,
  DesiredModsPanelSection,
  OptimizationResultPanel,
} from "@/components/organisms/panels";

type ItemWorkbenchColumnsPropsType = {
  baseItemWorkspace: UseBaseItemWorkspaceStateReturnType;
  desiredMods: ReadonlyArray<IDesiredModEntryType>;
  onAddDesiredMod: (entry: IDesiredModEntryType) => void;
  onRemoveDesiredMod: (id: string) => void;
  onSelectBaseItemKey: (baseItemKey: string) => void;
  rlTrainResponse: IRlTrainResponseType | null;
  isRlTraining: boolean;
  rlError: string | null;
  onRunOptimizationExplore: () => void;
};

export const ItemWorkbenchColumns = ({
  baseItemWorkspace,
  desiredMods,
  onAddDesiredMod,
  onRemoveDesiredMod,
  onSelectBaseItemKey,
  rlTrainResponse,
  isRlTraining,
  rlError,
  onRunOptimizationExplore,
}: ItemWorkbenchColumnsPropsType): ReactElement => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
      <BaseItemWorkspaceSection
        layout="panelShell"
        selectedBaseItemRecord={baseItemWorkspace.selectedBaseItemRecord}
        selectedBaseItemKey={baseItemWorkspace.selectedBaseItem?.baseItemKey ?? ""}
        filteredBaseItemRecords={baseItemWorkspace.filteredBaseItemRecords}
        effectiveSelectedBaseItemKey={baseItemWorkspace.effectiveSelectedBaseItemKey}
        onSelectBaseItemKey={onSelectBaseItemKey}
        isFilterOpen={baseItemWorkspace.isFilterOpen}
        onFilterToggle={() => {
          baseItemWorkspace.setIsFilterOpen((previous) => {
            return !previous;
          });
        }}
        equipmentTypeFilter={baseItemWorkspace.equipmentTypeFilter}
        onEquipmentTypeChange={baseItemWorkspace.handleEquipmentTypeChange}
        normalizedSubTypeFilter={baseItemWorkspace.normalizedSubTypeFilter}
        onSubTypeChange={baseItemWorkspace.setSubTypeFilter}
        availableSubTypes={baseItemWorkspace.availableSubTypes}
        rangeFieldsProps={baseItemWorkspace.rangeFieldsProps}
        baseItemItemLevel={baseItemWorkspace.baseItemItemLevel}
        onBaseItemItemLevelChange={baseItemWorkspace.setBaseItemItemLevel}
      />

      <DesiredModsPanelSection
        subType={baseItemWorkspace.selectedBaseItemRecord?.subType}
        statTags={baseItemWorkspace.selectedBaseItemRecord?.statTags}
        desiredMods={desiredMods}
        onAdd={onAddDesiredMod}
        onRemove={onRemoveDesiredMod}
      />

      <OptimizationResultPanel
        selectedBaseItem={baseItemWorkspace.selectedBaseItem ?? null}
        desiredMods={desiredMods}
        rlTrainResponse={rlTrainResponse}
        isRlTraining={isRlTraining}
        rlError={rlError}
        onRunOptimizationExplore={onRunOptimizationExplore}
      />
    </div>
  );
};
