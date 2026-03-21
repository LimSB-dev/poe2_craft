import { rollRareItemRoll } from "./roller";
import { getRandomIntInclusive } from "./random";
import type { IItemRoll } from "./types";

const RARE_MAX_PREFIX_COUNT: number = 3;
const RARE_MAX_SUFFIX_COUNT: number = 3;

/** Full rare reroll: total affix count (Chaos Orb, Essence fill, etc.). */
export const RARE_FULL_REROLL_AFFIX_MIN: number = 4;
export const RARE_FULL_REROLL_AFFIX_MAX: number = 6;

/** "Good" mod = tier at or below this value (matches roller tier scale 1..5). */
export const GOOD_MOD_MAX_TIER: number = 2;

export type IPrefixSuffixSplitType = {
  prefixCount: number;
  suffixCount: number;
};

/**
 * All (prefix, suffix) pairs with given total that respect rare affix caps.
 * Reusable for any "roll N mods on rare" rule that caps at 3/3.
 */
export const getValidRareModSplitsForTotal = (totalModCount: number): ReadonlyArray<IPrefixSuffixSplitType> => {
  const splits: IPrefixSuffixSplitType[] = [];
  for (let prefixCount = 0; prefixCount <= RARE_MAX_PREFIX_COUNT; prefixCount += 1) {
    const suffixCount = totalModCount - prefixCount;
    if (suffixCount >= 0 && suffixCount <= RARE_MAX_SUFFIX_COUNT) {
      splits.push({ prefixCount, suffixCount });
    }
  }
  return splits;
};

const pickRandomSplit = (totalModCount: number): IPrefixSuffixSplitType => {
  const splits = getValidRareModSplitsForTotal(totalModCount);
  if (splits.length === 0) {
    throw new Error(`Chaos Orb: no valid prefix/suffix split for totalModCount=${totalModCount}`);
  }
  const index = getRandomIntInclusive(0, splits.length - 1);
  const chosen = splits[index];
  if (!chosen) {
    throw new Error("Chaos Orb: split index out of range.");
  }
  return chosen;
};

/**
 * Chaos Orb: only on rare items; strips mods and rerolls 4–6 random mods with duplicate prevention
 * and tier limits unchanged from `rollRandomMod` (rare tier cap 5).
 */
export const applyChaosOrb = (item: IItemRoll): IItemRoll => {
  if (item.rarity !== "rare") {
    throw new Error("Chaos Orb can only be used on rare items.");
  }

  const totalMods = getRandomIntInclusive(RARE_FULL_REROLL_AFFIX_MIN, RARE_FULL_REROLL_AFFIX_MAX);
  const { prefixCount, suffixCount } = pickRandomSplit(totalMods);

  return rollRareItemRoll(prefixCount, suffixCount);
};

export const countTotalAffixes = (roll: IItemRoll): number => {
  return roll.prefixes.length + roll.suffixes.length;
};

export const countGoodMods = (roll: IItemRoll, goodTierMaxInclusive: number = GOOD_MOD_MAX_TIER): number => {
  const allMods = [...roll.prefixes, ...roll.suffixes];
  let count = 0;
  for (const mod of allMods) {
    if (mod.tier <= goodTierMaxInclusive) {
      count += 1;
    }
  }
  return count;
};

export type IChaosOrbGoodModSimulationResultType = {
  iterations: number;
  averageGoodMods: number;
  totalGoodMods: number;
};

/**
 * Applies Chaos Orb once per iteration (each from a fresh rare baseline with no mods).
 * Returns average count of mods with tier <= `goodTierMaxInclusive`.
 */
export const simulateChaosOrbGoodModAverage = (
  iterations: number,
  goodTierMaxInclusive: number = GOOD_MOD_MAX_TIER
): IChaosOrbGoodModSimulationResultType => {
  if (iterations <= 0) {
    throw new Error("simulateChaosOrbGoodModAverage: iterations must be positive.");
  }

  const baselineRare: IItemRoll = {
    rarity: "rare",
    prefixes: [],
    suffixes: [],
  };

  let totalGoodMods = 0;
  for (let i = 0; i < iterations; i += 1) {
    const afterChaos = applyChaosOrb(baselineRare);
    totalGoodMods += countGoodMods(afterChaos, goodTierMaxInclusive);
  }

  return {
    iterations,
    averageGoodMods: totalGoodMods / iterations,
    totalGoodMods,
  };
};

export const logChaosOrbGoodModBenchmark = (
  iterations: number = 1000,
  goodTierMaxInclusive: number = GOOD_MOD_MAX_TIER
): IChaosOrbGoodModSimulationResultType => {
  const result = simulateChaosOrbGoodModAverage(iterations, goodTierMaxInclusive);
  console.log(
    `[Chaos Orb benchmark] iterations=${result.iterations}, goodMods tier<=${goodTierMaxInclusive}, average=${result.averageGoodMods.toFixed(4)}`
  );
  return result;
};
