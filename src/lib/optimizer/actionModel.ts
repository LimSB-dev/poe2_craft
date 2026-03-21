import { applyChaosOrb } from "@/lib/poe2-item-simulator/chaosOrb";
import { applyEssence, LIFE_ESSENCE } from "@/lib/poe2-item-simulator/essence";
import type { IItemRoll, IModDefinition } from "@/lib/poe2-item-simulator/types";
import {
  estimateQualityScore,
  isRollSuccessfulForTarget,
  type IOptimizationTargetSpecType,
} from "@/lib/optimizer/targetSpec";

export type IOptimizationStrategyIdType =
  | "chaos_only"
  | "essence_then_chaos"
  | "omen_essence_chaos";

export type ICurrencyCostModelType = {
  chaos: number;
  essence: number;
  omen: number;
};

export type IOptimizationTrialResultType = {
  success: boolean;
  totalCost: number;
  finalItem: IItemRoll;
  qualityScore: number;
  actionsUsed: ReadonlyArray<string>;
};

const EMPTY_RARE_ITEM: IItemRoll = {
  rarity: "rare",
  prefixes: [],
  suffixes: [],
};

const copyMod = (modDefinition: IModDefinition): IModDefinition => {
  return {
    ...modDefinition,
  };
};

const copyItem = (item: IItemRoll): IItemRoll => {
  return {
    rarity: item.rarity,
    prefixes: item.prefixes.map(copyMod),
    suffixes: item.suffixes.map(copyMod),
  };
};

const upgradeRandomModToTierOne = (item: IItemRoll): IItemRoll => {
  const cloned = copyItem(item);
  const allMods = [...cloned.prefixes, ...cloned.suffixes];
  if (allMods.length === 0) {
    return cloned;
  }

  const randomIndex = Math.floor(Math.random() * allMods.length);
  const chosen = allMods[randomIndex];
  if (chosen) {
    chosen.tier = 1;
  }
  return cloned;
};

const runChaosUntilDone = (
  initialItem: IItemRoll,
  targetSpec: IOptimizationTargetSpecType,
  budgetChaos: number,
  costModel: ICurrencyCostModelType,
  actions: string[],
  omenActive: boolean
): IOptimizationTrialResultType => {
  let item = copyItem(initialItem);
  let totalCost = 0;
  let usedChaos = 0;
  let omenApplied = omenActive;

  while (usedChaos < budgetChaos) {
    item = applyChaosOrb(item);
    if (omenApplied) {
      item = upgradeRandomModToTierOne(item);
      omenApplied = false;
    }
    usedChaos += 1;
    totalCost += costModel.chaos;
    actions.push("chaos");

    if (isRollSuccessfulForTarget(item, targetSpec)) {
      return {
        success: true,
        totalCost,
        finalItem: item,
        qualityScore: estimateQualityScore(item),
        actionsUsed: actions,
      };
    }
  }

  return {
    success: false,
    totalCost,
    finalItem: item,
    qualityScore: estimateQualityScore(item),
    actionsUsed: actions,
  };
};

export const simulateSingleTrial = (params: {
  strategyId: IOptimizationStrategyIdType;
  targetSpec: IOptimizationTargetSpecType;
  budgetChaos: number;
  costModel: ICurrencyCostModelType;
}): IOptimizationTrialResultType => {
  const actions: string[] = [];

  if (params.strategyId === "chaos_only") {
    return runChaosUntilDone(
      EMPTY_RARE_ITEM,
      params.targetSpec,
      params.budgetChaos,
      params.costModel,
      actions,
      false
    );
  }

  if (params.strategyId === "essence_then_chaos") {
    const item = applyEssence(EMPTY_RARE_ITEM, LIFE_ESSENCE);
    const totalCost = params.costModel.essence;
    actions.push("essence");

    if (isRollSuccessfulForTarget(item, params.targetSpec)) {
      return {
        success: true,
        totalCost,
        finalItem: item,
        qualityScore: estimateQualityScore(item),
        actionsUsed: actions,
      };
    }

    const next = runChaosUntilDone(
      item,
      params.targetSpec,
      params.budgetChaos,
      params.costModel,
      actions,
      false
    );
    return {
      ...next,
      totalCost: next.totalCost + totalCost,
    };
  }

  const item = applyEssence(EMPTY_RARE_ITEM, LIFE_ESSENCE);
  let totalCost = params.costModel.essence + params.costModel.omen;
  actions.push("essence");
  actions.push("omen");

  if (isRollSuccessfulForTarget(item, params.targetSpec)) {
    return {
      success: true,
      totalCost,
      finalItem: item,
      qualityScore: estimateQualityScore(item),
      actionsUsed: actions,
    };
  }

  const next = runChaosUntilDone(
    item,
    params.targetSpec,
    params.budgetChaos,
    params.costModel,
    actions,
    true
  );
  totalCost += next.totalCost;
  return {
    ...next,
    totalCost,
  };
};
