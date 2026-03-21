"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReactElement } from "react";

import { ItemSimulatorBaseItemPanel } from "@/components/item-simulator/ItemSimulatorBaseItemPanel";
import { ItemSimulatorDesiredModsPanelSection } from "@/components/item-simulator/ItemSimulatorDesiredModsPanelSection";
import { ItemSimulatorHeader } from "@/components/item-simulator/ItemSimulatorHeader";
import { ItemSimulatorResultPanel } from "@/components/item-simulator/ItemSimulatorResultPanel";
import { useItemSimulatorBaseItemPanelState } from "@/components/item-simulator/useItemSimulatorBaseItemPanelState";
import type { IDesiredModEntryType } from "@/lib/poe2-item-simulator/types";
import type { IRlTrainResponseType } from "@/lib/rl/rlTrainApiTypes";

const SIMULATOR_RL_BUDGET: number = 80;
const SIMULATOR_RL_EPISODES: number = 3500;

export const ItemSimulatorWorkspace = (): ReactElement => {
  const tRl = useTranslations("simulator.rlView");
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

  const [rlTrainResponse, setRlTrainResponse] = useState<IRlTrainResponseType | null>(
    null,
  );
  const [isRlTraining, setIsRlTraining] = useState<boolean>(false);
  const [rlError, setRlError] = useState<string | null>(null);

  const handleSelectBaseItemKey = (baseItemKey: string): void => {
    setRlTrainResponse(null);
    setRlError(null);
    setSelectedBaseItemKey(baseItemKey);
  };
  const [desiredMods, setDesiredMods] = useState<
    ReadonlyArray<IDesiredModEntryType>
  >([]);

  const handleAddDesiredMod = (entry: IDesiredModEntryType): void => {
    setDesiredMods((prev) => [...prev, entry]);
  };

  const handleRemoveDesiredMod = (id: string): void => {
    setDesiredMods((prev) => prev.filter((m) => m.id !== id));
  };

  const handleRunOptimizationExplore = async (): Promise<void> => {
    if (!selectedBaseItem) {
      return;
    }
    setIsRlTraining(true);
    setRlError(null);
    try {
      const desiredGoodMods =
        desiredMods.length === 0
          ? 3
          : Math.min(6, Math.max(1, desiredMods.length));
      const response = await fetch("/api/rl-train", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          desiredGoodMods,
          budget: SIMULATOR_RL_BUDGET,
          episodes: SIMULATOR_RL_EPISODES,
          baseItemKey: selectedBaseItem.baseItemKey,
          desiredMods: desiredMods.map((entry) => {
            return {
              id: entry.id,
              modKey: entry.modKey,
              nameTemplateKey: entry.nameTemplateKey,
              modType: entry.modType,
            };
          }),
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as IRlTrainResponseType;
      setRlTrainResponse(data);
    } catch {
      setRlError(tRl("error"));
      setRlTrainResponse(null);
    } finally {
      setIsRlTraining(false);
    }
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
            onSelectBaseItemKey={handleSelectBaseItemKey}
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
            selectedBaseItem={selectedBaseItem ?? null}
            desiredMods={desiredMods}
            rlTrainResponse={rlTrainResponse}
            isRlTraining={isRlTraining}
            rlError={rlError}
            onRunOptimizationExplore={() => {
              void handleRunOptimizationExplore();
            }}
          />
        </div>
      </div>
    </div>
  );
};
