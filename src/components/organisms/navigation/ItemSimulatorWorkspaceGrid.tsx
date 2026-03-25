"use client";

import type { ReactElement } from "react";

import { ItemSimulatorBaseItemPanel } from "@/components/organisms/panels/ItemSimulatorBaseItemPanel";
import { ItemSimulatorDesiredModsPanelSection } from "@/components/organisms/panels/ItemSimulatorDesiredModsPanelSection";
import { ItemSimulatorResultPanel } from "@/components/organisms/panels/ItemSimulatorResultPanel";
import type { UseItemSimulatorBaseItemPanelStateReturnType } from "@/components/organisms/hooks/useItemSimulatorBaseItemPanelState";

type ItemSimulatorWorkspaceGridPropsType = {
  baseItemPanelState: UseItemSimulatorBaseItemPanelStateReturnType;
  desiredMods: ReadonlyArray<IDesiredModEntryType>;
  onAddDesiredMod: (entry: IDesiredModEntryType) => void;
  onRemoveDesiredMod: (id: string) => void;
  onSelectBaseItemKey: (baseItemKey: string) => void;
  rlTrainResponse: IRlTrainResponseType | null;
  isRlTraining: boolean;
  rlError: string | null;
  onRunOptimizationExplore: () => void;
};

export const ItemSimulatorWorkspaceGrid = ({
  baseItemPanelState,
  desiredMods,
  onAddDesiredMod,
  onRemoveDesiredMod,
  onSelectBaseItemKey,
  rlTrainResponse,
  isRlTraining,
  rlError,
  onRunOptimizationExplore,
}: ItemSimulatorWorkspaceGridPropsType): ReactElement => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
      <ItemSimulatorBaseItemPanel
        selectedBaseItemRecord={baseItemPanelState.selectedBaseItemRecord}
        selectedBaseItemKey={baseItemPanelState.selectedBaseItem?.baseItemKey ?? ""}
        filteredBaseItemRecords={baseItemPanelState.filteredBaseItemRecords}
        effectiveSelectedBaseItemKey={baseItemPanelState.effectiveSelectedBaseItemKey}
        onSelectBaseItemKey={onSelectBaseItemKey}
        isFilterOpen={baseItemPanelState.isFilterOpen}
        onFilterToggle={() => {
          baseItemPanelState.setIsFilterOpen((previous) => {
            return !previous;
          });
        }}
        equipmentTypeFilter={baseItemPanelState.equipmentTypeFilter}
        onEquipmentTypeChange={baseItemPanelState.handleEquipmentTypeChange}
        normalizedSubTypeFilter={baseItemPanelState.normalizedSubTypeFilter}
        onSubTypeChange={baseItemPanelState.setSubTypeFilter}
        availableSubTypes={baseItemPanelState.availableSubTypes}
        rangeFieldsProps={baseItemPanelState.rangeFieldsProps}
      />

      <ItemSimulatorDesiredModsPanelSection
        subType={baseItemPanelState.selectedBaseItemRecord?.subType}
        statTags={baseItemPanelState.selectedBaseItemRecord?.statTags}
        desiredMods={desiredMods}
        onAdd={onAddDesiredMod}
        onRemove={onRemoveDesiredMod}
      />

      <ItemSimulatorResultPanel
        selectedBaseItem={baseItemPanelState.selectedBaseItem ?? null}
        desiredMods={desiredMods}
        rlTrainResponse={rlTrainResponse}
        isRlTraining={isRlTraining}
        rlError={rlError}
        onRunOptimizationExplore={onRunOptimizationExplore}
      />
    </div>
  );
};
