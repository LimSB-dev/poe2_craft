/**
 * Compares two chaos-spam policies on the same success definition (≥ N mods with tier ≤ threshold):
 *
 * - **Always continue**: never stop early; always rolls until success or chaos cap. Cost is often higher when
 *   many rolls are needed, but success rate is limited mainly by the cap vs RNG.
 *
 * - **Smart stop** (`shouldContinue`): stops after a roll with **zero** good mods, saving orbs on hopeless
 *   items. Average cost usually drops, but some runs that could have recovered with more chaos are abandoned,
 *   so success rate can fall vs always-continue unless the cap is very high.
 *
 * The printed Δ lines make the cost / success trade-off explicit for the current mod pool and limits.
 */
import { applyLegacyChaosOrbFullReroll, countGoodMods, GOOD_MOD_MAX_TIER } from "./currency/chaosOrb";
import { shouldContinue, type IShouldContinueOptionsType } from "./craftingDecision";
import type { IItemRoll } from "./types";

const EMPTY_RARE: IItemRoll = { rarity: "rare", prefixes: [], suffixes: [] };

export type ICraftingStrategyResultType = {
  label: string;
  trials: number;
  averageCost: number;
  successRate: number;
  successes: number;
};

export type ICraftingDecisionComparisonResultType = {
  trials: number;
  maxChaosPerAttempt: number;
  minGoodModsForSuccess: number;
  goodTierMaxInclusive: number;
  alwaysContinue: ICraftingStrategyResultType;
  smartStop: ICraftingStrategyResultType;
};

export type ICompareCraftingDecisionOptionsType = {
  trials?: number;
  maxChaosPerAttempt?: number;
  minGoodModsForSuccess?: number;
  goodTierMaxInclusive?: number;
  shouldContinueOptions?: IShouldContinueOptionsType;
};

const DEFAULT_TRIALS: number = 8000;
const DEFAULT_MAX_CHAOS: number = 50;
const DEFAULT_MIN_GOOD: number = 2;

/**
 * Baseline: keep rolling Chaos until success (≥ `minGoodModsForSuccess` good mods) or chaos cap.
 * Does not use `shouldContinue` — never stops early on a bad item.
 */
const simulateAlwaysContinueTrial = (
  maxChaos: number,
  minGoodModsForSuccess: number,
  goodTierMaxInclusive: number
): { cost: number; success: boolean } => {
  let item = EMPTY_RARE;
  let chaosUsed = 0;

  while (chaosUsed < maxChaos && countGoodMods(item, goodTierMaxInclusive) < minGoodModsForSuccess) {
    item = applyLegacyChaosOrbFullReroll(item);
    chaosUsed += 1;
  }

  const success = countGoodMods(item, goodTierMaxInclusive) >= minGoodModsForSuccess;
  return { cost: chaosUsed, success };
};

/**
 * Stops early when `shouldContinue` is false (e.g. 0 good mods after a roll), saving chaos on hopeless items.
 * May reduce average cost vs always-continue, but can also lower success rate if we stop before hitting the goal.
 */
const simulateSmartStopTrial = (
  maxChaos: number,
  minGoodModsForSuccess: number,
  goodTierMaxInclusive: number,
  shouldContinueOptions: IShouldContinueOptionsType
): { cost: number; success: boolean } => {
  let item: IItemRoll = { rarity: "rare", prefixes: [], suffixes: [] };
  let chaosUsed = 0;

  while (chaosUsed < maxChaos && countGoodMods(item, goodTierMaxInclusive) < minGoodModsForSuccess) {
    if (!shouldContinue(item, shouldContinueOptions)) {
      break;
    }
    item = applyLegacyChaosOrbFullReroll(item);
    chaosUsed += 1;
  }

  const success = countGoodMods(item, goodTierMaxInclusive) >= minGoodModsForSuccess;
  return { cost: chaosUsed, success };
};

const buildStrategyResult = (
  label: string,
  trials: number,
  totalCost: number,
  successes: number
): ICraftingStrategyResultType => {
  return {
    label,
    trials,
    averageCost: totalCost / trials,
    successRate: successes / trials,
    successes,
  };
};

export const compareAlwaysContinueVsSmartStop = (
  options: ICompareCraftingDecisionOptionsType = {}
): ICraftingDecisionComparisonResultType => {
  const trials = options.trials ?? DEFAULT_TRIALS;
  const maxChaosPerAttempt = options.maxChaosPerAttempt ?? DEFAULT_MAX_CHAOS;
  const minGoodModsForSuccess = options.minGoodModsForSuccess ?? DEFAULT_MIN_GOOD;
  const goodTierMaxInclusive = options.goodTierMaxInclusive ?? GOOD_MOD_MAX_TIER;
  const shouldContinueOptions = options.shouldContinueOptions ?? {};

  if (trials <= 0) {
    throw new Error("compareAlwaysContinueVsSmartStop: trials must be positive.");
  }

  let sumCostAlways = 0;
  let successesAlways = 0;

  let sumCostSmart = 0;
  let successesSmart = 0;

  for (let trialIndex = 0; trialIndex < trials; trialIndex += 1) {
    const alwaysOutcome = simulateAlwaysContinueTrial(
      maxChaosPerAttempt,
      minGoodModsForSuccess,
      goodTierMaxInclusive
    );
    sumCostAlways += alwaysOutcome.cost;
    if (alwaysOutcome.success) {
      successesAlways += 1;
    }

    const smartOutcome = simulateSmartStopTrial(
      maxChaosPerAttempt,
      minGoodModsForSuccess,
      goodTierMaxInclusive,
      shouldContinueOptions
    );
    sumCostSmart += smartOutcome.cost;
    if (smartOutcome.success) {
      successesSmart += 1;
    }
  }

  return {
    trials,
    maxChaosPerAttempt,
    minGoodModsForSuccess,
    goodTierMaxInclusive,
    alwaysContinue: buildStrategyResult(
      "Always continue (chaos until success or cap)",
      trials,
      sumCostAlways,
      successesAlways
    ),
    smartStop: buildStrategyResult(
      "Smart stop (shouldContinue)",
      trials,
      sumCostSmart,
      successesSmart
    ),
  };
};

export const logCraftingDecisionComparison = (
  options: ICompareCraftingDecisionOptionsType = {}
): ICraftingDecisionComparisonResultType => {
  const result = compareAlwaysContinueVsSmartStop(options);

  const lines: string[] = [
    "",
    "=== Crafting decision: always continue vs smart stop ===",
    `Trials: ${result.trials} | Max chaos per attempt: ${result.maxChaosPerAttempt}`,
    `Success: ≥${result.minGoodModsForSuccess} good mods (tier ≤ ${result.goodTierMaxInclusive})`,
    "",
    "--- Always continue ---",
    `  Average total cost (chaos orbs): ${result.alwaysContinue.averageCost.toFixed(3)}`,
    `  Success rate: ${(result.alwaysContinue.successRate * 100).toFixed(2)}% (${result.alwaysContinue.successes}/${result.trials})`,
    "",
    "--- Smart stop (shouldContinue) ---",
    `  Average total cost (chaos orbs): ${result.smartStop.averageCost.toFixed(3)}`,
    `  Success rate: ${(result.smartStop.successRate * 100).toFixed(2)}% (${result.smartStop.successes}/${result.trials})`,
    "",
    "--- Δ (smart − always) ---",
    `  Δ average cost: ${(result.smartStop.averageCost - result.alwaysContinue.averageCost).toFixed(3)}`,
    `  Δ success rate (percentage points): ${((result.smartStop.successRate - result.alwaysContinue.successRate) * 100).toFixed(2)}`,
    "",
  ];

  console.log(lines.join("\n"));
  return result;
};
