import type { IItemRoll } from "@/types/poe2-item-simulator";

export type IOptimizationTargetSpecType = {
  validModKeys: ReadonlyArray<string>;
  minTotalAffixes: number;
  requireTierOne: boolean;
};

const collectAllModKeys = (roll: IItemRoll): string[] => {
  return [...roll.prefixes, ...roll.suffixes].map((mod) => mod.modKey);
};

const collectAllTiers = (roll: IItemRoll): number[] => {
  return [...roll.prefixes, ...roll.suffixes].map((mod) => mod.tier);
};

const countAffixes = (roll: IItemRoll): number => {
  return roll.prefixes.length + roll.suffixes.length;
};

export const isRollSuccessfulForTarget = (
  roll: IItemRoll,
  targetSpec: IOptimizationTargetSpecType
): boolean => {
  if (countAffixes(roll) < targetSpec.minTotalAffixes) {
    return false;
  }

  const validKeySet = new Set(targetSpec.validModKeys);
  for (const modKey of collectAllModKeys(roll)) {
    if (!validKeySet.has(modKey)) {
      return false;
    }
  }

  if (targetSpec.requireTierOne) {
    for (const tier of collectAllTiers(roll)) {
      if (tier !== 1) {
        return false;
      }
    }
  }

  return true;
};

export const estimateQualityScore = (roll: IItemRoll): number => {
  const allMods = [...roll.prefixes, ...roll.suffixes];
  if (allMods.length === 0) {
    return 0;
  }

  let tierScore = 0;
  for (const mod of allMods) {
    tierScore += 6 - mod.tier;
  }

  return tierScore + (allMods.length * 0.5);
};
