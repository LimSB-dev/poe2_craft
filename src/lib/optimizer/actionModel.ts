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

const pickWeighted = (choices: ReadonlyArray<IModDefinition>): IModDefinition => {
  let totalWeight = 0;
  for (const choice of choices) {
    totalWeight += Math.max(0.000001, choice.weight);
  }

  let randomValue = Math.random() * totalWeight;
  for (const choice of choices) {
    randomValue -= Math.max(0.000001, choice.weight);
    if (randomValue <= 0) {
      return copyMod(choice);
    }
  }

  const fallback = choices[choices.length - 1];
  if (!fallback) {
    throw new Error("No mod choices available.");
  }
  return copyMod(fallback);
};

const getCandidates = (
  modPool: ReadonlyArray<IModDefinition>,
  modType: "prefix" | "suffix",
  excludedModKeys: ReadonlySet<string>
): IModDefinition[] => {
  return modPool.filter((modDefinition) => {
    if (modDefinition.modType !== modType) {
      return false;
    }
    if (excludedModKeys.has(modDefinition.modKey)) {
      return false;
    }
    return true;
  });
};

const randomSplit = (): { prefixCount: number; suffixCount: number } => {
  const totalAffixes = 4 + Math.floor(Math.random() * 3);
  const splits: Array<{ prefixCount: number; suffixCount: number }> = [];

  for (let prefixCount = 0; prefixCount <= 3; prefixCount += 1) {
    const suffixCount = totalAffixes - prefixCount;
    if (suffixCount >= 0 && suffixCount <= 3) {
      splits.push({ prefixCount, suffixCount });
    }
  }

  const index = Math.floor(Math.random() * splits.length);
  const chosen = splits[index];
  if (!chosen) {
    throw new Error("No prefix/suffix split available.");
  }
  return chosen;
};

const rollRareItemFromPool = (modPool: ReadonlyArray<IModDefinition>): IItemRoll => {
  const excludedModKeys = new Set<string>();
  const { prefixCount, suffixCount } = randomSplit();
  const prefixes: IModDefinition[] = [];
  const suffixes: IModDefinition[] = [];

  for (let index = 0; index < prefixCount; index += 1) {
    const candidates = getCandidates(modPool, "prefix", excludedModKeys);
    if (candidates.length === 0) {
      break;
    }
    const picked = pickWeighted(candidates);
    excludedModKeys.add(picked.modKey);
    prefixes.push(picked);
  }

  for (let index = 0; index < suffixCount; index += 1) {
    const candidates = getCandidates(modPool, "suffix", excludedModKeys);
    if (candidates.length === 0) {
      break;
    }
    const picked = pickWeighted(candidates);
    excludedModKeys.add(picked.modKey);
    suffixes.push(picked);
  }

  return {
    rarity: "rare",
    prefixes,
    suffixes,
  };
};

const applyEssenceFromPool = (modPool: ReadonlyArray<IModDefinition>): IItemRoll => {
  const rolled = rollRareItemFromPool(modPool);
  const allMods = [...rolled.prefixes, ...rolled.suffixes];
  if (allMods.length > 0) {
    const forcedIndex = Math.floor(Math.random() * allMods.length);
    const forced = allMods[forcedIndex];
    if (forced) {
      forced.tier = Math.min(forced.tier, 3);
    }
  }
  return rolled;
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
  modPool: ReadonlyArray<IModDefinition>,
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
    item = rollRareItemFromPool(modPool);
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
  modPool: ReadonlyArray<IModDefinition>;
  targetSpec: IOptimizationTargetSpecType;
  budgetChaos: number;
  costModel: ICurrencyCostModelType;
}): IOptimizationTrialResultType => {
  const actions: string[] = [];

  if (params.strategyId === "chaos_only") {
    return runChaosUntilDone(
      EMPTY_RARE_ITEM,
      params.modPool,
      params.targetSpec,
      params.budgetChaos,
      params.costModel,
      actions,
      false
    );
  }

  if (params.strategyId === "essence_then_chaos") {
    const item = applyEssenceFromPool(params.modPool);
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
      params.modPool,
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

  const item = applyEssenceFromPool(params.modPool);
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
    params.modPool,
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
