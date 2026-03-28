import { countGoodMods, GOOD_MOD_MAX_TIER } from "@/lib/poe2-item-simulator/currency/chaosOrb";

/** When exactly one good mod exists, continue with this probability (otherwise stop). */
export const DEFAULT_PROBABILITY_CONTINUE_WITH_ONE_GOOD_MOD: number = 0.5;

/**
 * Heuristic score: higher is better. Good mods (tier <= `GOOD_MOD_MAX_TIER`) add bulk points
 * plus a small bonus for lower tiers within the good band.
 */
export const evaluateItem = (item: IItemRoll): number => {
  const goodTierMax = GOOD_MOD_MAX_TIER;
  let score = 0;
  for (const mod of [...item.prefixes, ...item.suffixes]) {
    if (mod.tier <= goodTierMax) {
      score += 100;
      score += goodTierMax + 1 - mod.tier;
    }
  }
  return score;
};

export type IShouldContinueOptionsType = {
  /** Override default for the single-good-mod branch (default 0.5). */
  probabilityContinueWithOneGoodMod?: number;
};

/**
 * Whether to spend another Chaos Orb on this item.
 *
 * Rules:
 * - No affixes yet → continue (first roll is always attempted in simulations).
 * - 0 good mods (tier <= 2) → stop (no upside seen).
 * - 2+ good mods → continue (keep pushing).
 * - Exactly 1 good mod → random: continue with probability `probabilityContinueWithOneGoodMod`.
 */
export const shouldContinue = (
  item: IItemRoll,
  options: IShouldContinueOptionsType = {}
): boolean => {
  const goodTierMax = GOOD_MOD_MAX_TIER;
  const goodCount = countGoodMods(item, goodTierMax);
  const totalAffixCount = item.prefixes.length + item.suffixes.length;

  if (totalAffixCount === 0) {
    return true;
  }

  if (goodCount === 0) {
    return false;
  }

  if (goodCount >= 2) {
    return true;
  }

  const probability =
    options.probabilityContinueWithOneGoodMod ?? DEFAULT_PROBABILITY_CONTINUE_WITH_ONE_GOOD_MOD;
  return Math.random() < probability;
};
