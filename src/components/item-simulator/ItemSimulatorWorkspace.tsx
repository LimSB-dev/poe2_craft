"use client";

import { useState } from "react";
import type { ReactElement } from "react";

import { ItemSimulatorBaseItemPanel } from "@/components/item-simulator/ItemSimulatorBaseItemPanel";
import { ItemSimulatorDesiredModsPanelSection } from "@/components/item-simulator/ItemSimulatorDesiredModsPanelSection";
import { ItemSimulatorHeader } from "@/components/item-simulator/ItemSimulatorHeader";
import { ItemSimulatorResultPanel } from "@/components/item-simulator/ItemSimulatorResultPanel";
import { useItemSimulatorBaseItemPanelState } from "@/components/item-simulator/useItemSimulatorBaseItemPanelState";
import { rollSimulation } from "@/lib/poe2-item-simulator/roller";
import type {
  IDesiredModEntryType,
  IItemSimulationResultType,
} from "@/lib/poe2-item-simulator/types";

export const ItemSimulatorWorkspace = (): ReactElement => {
  const {
    setSelectedBaseItemKey,
    equipmentTypeFilter,
    setSubTypeFilter,
    isFilterOpen,
    setIsFilterOpen,
    availableSubTypes,
    normalizedSubTypeFilter,
    filteredBaseItemRecords,
    effectiveSelectedBaseItemKey,
    selectedBaseItem,
    selectedBaseItemRecord,
    rangeFieldsProps,
    handleEquipmentTypeChange,
  } = useItemSimulatorBaseItemPanelState();

  const [simulationResult, setSimulationResult] =
    useState<IItemSimulationResultType | null>(null);
  const [desiredMods, setDesiredMods] = useState<
    ReadonlyArray<IDesiredModEntryType>
  >([]);

  const handleAddDesiredMod = (entry: IDesiredModEntryType): void => {
    setDesiredMods((prev) => [...prev, entry]);
  };

  const handleRemoveDesiredMod = (id: string): void => {
    setDesiredMods((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSimulate = (): void => {
    if (!selectedBaseItem) {
      return;
    }
    const roll = rollSimulation({
      rarity: "rare",
      desiredPrefixCount: 3,
      desiredSuffixCount: 3,
    });
    setSimulationResult({
      baseItem: selectedBaseItem,
      roll,
    });
  };

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 dark:bg-black px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-6xl flex flex-col gap-8">
        <ItemSimulatorHeader />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          <ItemSimulatorBaseItemPanel
            selectedBaseItemRecord={selectedBaseItemRecord}
            selectedBaseItemKey={selectedBaseItem?.baseItemKey ?? ""}
            filteredBaseItemRecords={filteredBaseItemRecords}
            effectiveSelectedBaseItemKey={effectiveSelectedBaseItemKey}
            onSelectBaseItemKey={setSelectedBaseItemKey}
            isFilterOpen={isFilterOpen}
            onFilterToggle={() => {
              setIsFilterOpen((prev) => !prev);
            }}
            equipmentTypeFilter={equipmentTypeFilter}
            onEquipmentTypeChange={handleEquipmentTypeChange}
            normalizedSubTypeFilter={normalizedSubTypeFilter}
            onSubTypeChange={setSubTypeFilter}
            availableSubTypes={availableSubTypes}
            rangeFieldsProps={rangeFieldsProps}
          />

          <ItemSimulatorDesiredModsPanelSection
            subType={selectedBaseItemRecord?.subType}
            statTags={selectedBaseItemRecord?.statTags}
            desiredMods={desiredMods}
            onAdd={handleAddDesiredMod}
            onRemove={handleRemoveDesiredMod}
          />

          <ItemSimulatorResultPanel
            simulationResult={simulationResult}
            desiredMods={desiredMods}
            onRunRoll={handleSimulate}
          />
        </div>
      </div>
    </div>
  );
};
