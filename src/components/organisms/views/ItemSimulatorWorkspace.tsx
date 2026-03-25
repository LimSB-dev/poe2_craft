"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReactElement } from "react";

import { ItemSimulatorHeader } from "@/components/organisms/navigation/ItemSimulatorHeader";
import { ItemSimulatorWorkspaceGrid } from "@/components/organisms/navigation/ItemSimulatorWorkspaceGrid";
import { useItemSimulatorBaseItemPanelState } from "@/components/organisms/hooks/useItemSimulatorBaseItemPanelState";

const SIMULATOR_RL_BUDGET: number = 80;
const SIMULATOR_RL_EPISODES: number = 3500;

export const ItemSimulatorWorkspace = (): ReactElement => {
  const tRl = useTranslations("simulator.rlView");
  const baseItemPanelState = useItemSimulatorBaseItemPanelState();

  const [rlTrainResponse, setRlTrainResponse] = useState<IRlTrainResponseType | null>(
    null,
  );
  const [isRlTraining, setIsRlTraining] = useState<boolean>(false);
  const [rlError, setRlError] = useState<string | null>(null);

  const handleSelectBaseItemKey = (baseItemKey: string): void => {
    setRlTrainResponse(null);
    setRlError(null);
    baseItemPanelState.setSelectedBaseItemKey(baseItemKey);
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
    if (!baseItemPanelState.selectedBaseItem) {
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
          baseItemKey: baseItemPanelState.selectedBaseItem.baseItemKey,
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

        <ItemSimulatorWorkspaceGrid
          baseItemPanelState={baseItemPanelState}
          desiredMods={desiredMods}
          onAddDesiredMod={handleAddDesiredMod}
          onRemoveDesiredMod={handleRemoveDesiredMod}
          onSelectBaseItemKey={handleSelectBaseItemKey}
          rlTrainResponse={rlTrainResponse}
          isRlTraining={isRlTraining}
          rlError={rlError}
          onRunOptimizationExplore={() => {
            void handleRunOptimizationExplore();
          }}
        />
      </div>
    </div>
  );
};
