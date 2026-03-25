import { applyLegacyChaosOrbFullReroll, countGoodMods, GOOD_MOD_MAX_TIER } from "./currency/chaosOrb";
import {
  applyEssence,
  ATTACK_ESSENCE,
  getBenchModFiltersForEssence,
  LIFE_ESSENCE,
} from "./essence/essence";

const EMPTY_MAGIC: IItemRoll = { rarity: "magic", prefixes: [], suffixes: [] };
const EMPTY_RARE: IItemRoll = { rarity: "rare", prefixes: [], suffixes: [] };

export type IStrategyCostResultType = {
  strategyLabel: string;
  trials: number;
  successes: number;
  successRate: number;
  averageCost: number;
};

export type IEssenceChaosComparisonResultType = {
  trials: number;
  maxChaosPerAttempt: number;
  minGoodModsRequired: number;
  goodTierMaxInclusive: number;
  unitCosts: { chaosOrb: number; essence: number };
  A_chaosOnly: IStrategyCostResultType;
  B_lifeEssenceThenChaos: IStrategyCostResultType;
  B_attackEssenceThenChaos: IStrategyCostResultType;
};

const runChaosSpamUntilGood = (
  initialRare: IItemRoll,
  maxChaos: number,
  minGoodMods: number,
  goodTierMaxInclusive: number
): { chaosUsed: number; success: boolean } => {
  let item = initialRare;
  let chaosUsed = 0;
  while (countGoodMods(item, goodTierMaxInclusive) < minGoodMods && chaosUsed < maxChaos) {
    item = applyLegacyChaosOrbFullReroll(item);
    chaosUsed += 1;
  }
  const success = countGoodMods(item, goodTierMaxInclusive) >= minGoodMods;
  return { chaosUsed, success };
};

const buildStrategyResult = (
  strategyLabel: string,
  trials: number,
  totalCostSum: number,
  successes: number
): IStrategyCostResultType => {
  return {
    strategyLabel,
    trials,
    successes,
    successRate: successes / trials,
    averageCost: totalCostSum / trials,
  };
};

export type ICompareEssenceVersusChaosOptionsType = {
  trials?: number;
  maxChaosPerAttempt?: number;
  minGoodModsRequired?: number;
  goodTierMaxInclusive?: number;
  chaosOrbCost?: number;
  essenceCost?: number;
};

const DEFAULT_TRIALS: number = 8000;
const DEFAULT_MAX_CHAOS: number = 50;
const DEFAULT_MIN_GOOD: number = 2;
const DEFAULT_CHAOS_COST: number = 1;
const DEFAULT_ESSENCE_COST: number = 3;

export const compareEssenceVersusChaosSpam = (
  options: ICompareEssenceVersusChaosOptionsType = {}
): IEssenceChaosComparisonResultType => {
  const trials = options.trials ?? DEFAULT_TRIALS;
  const maxChaosPerAttempt = options.maxChaosPerAttempt ?? DEFAULT_MAX_CHAOS;
  const minGoodModsRequired = options.minGoodModsRequired ?? DEFAULT_MIN_GOOD;
  const goodTierMaxInclusive = options.goodTierMaxInclusive ?? GOOD_MOD_MAX_TIER;
  const chaosOrbCost = options.chaosOrbCost ?? DEFAULT_CHAOS_COST;
  const essenceCost = options.essenceCost ?? DEFAULT_ESSENCE_COST;

  if (trials <= 0) {
    throw new Error("compareEssenceVersusChaosSpam: trials must be positive.");
  }

  let sumCostA = 0;
  let successesA = 0;

  let sumCostBLife = 0;
  let successesBLife = 0;

  let sumCostBAttack = 0;
  let successesBAttack = 0;

  for (let trialIndex = 0; trialIndex < trials; trialIndex += 1) {
    const runA = runChaosSpamUntilGood(
      EMPTY_RARE,
      maxChaosPerAttempt,
      minGoodModsRequired,
      goodTierMaxInclusive
    );
    sumCostA += runA.chaosUsed * chaosOrbCost;
    if (runA.success) {
      successesA += 1;
    }

    const lifeOutcome = simulateEssenceThenChaosOutcome(
      LIFE_ESSENCE,
      maxChaosPerAttempt,
      minGoodModsRequired,
      goodTierMaxInclusive,
      chaosOrbCost,
      essenceCost
    );
    sumCostBLife += lifeOutcome.cost;
    if (lifeOutcome.success) {
      successesBLife += 1;
    }

    const attackOutcome = simulateEssenceThenChaosOutcome(
      ATTACK_ESSENCE,
      maxChaosPerAttempt,
      minGoodModsRequired,
      goodTierMaxInclusive,
      chaosOrbCost,
      essenceCost
    );
    sumCostBAttack += attackOutcome.cost;
    if (attackOutcome.success) {
      successesBAttack += 1;
    }
  }

  return {
    trials,
    maxChaosPerAttempt,
    minGoodModsRequired,
    goodTierMaxInclusive,
    unitCosts: { chaosOrb: chaosOrbCost, essence: essenceCost },
    A_chaosOnly: buildStrategyResult("(A) Chaos spam only", trials, sumCostA, successesA),
    B_lifeEssenceThenChaos: buildStrategyResult(
      "(B) Life Essence → Chaos",
      trials,
      sumCostBLife,
      successesBLife
    ),
    B_attackEssenceThenChaos: buildStrategyResult(
      "(B) Attack Essence → Chaos",
      trials,
      sumCostBAttack,
      successesBAttack
    ),
  };
};

const simulateEssenceThenChaosOutcome = (
  essence: IEssenceDefinitionType,
  maxChaos: number,
  minGoodMods: number,
  goodTierMaxInclusive: number,
  chaosOrbCost: number,
  essenceCost: number
): { cost: number; success: boolean } => {
  let item = applyEssence(EMPTY_MAGIC, essence, getBenchModFiltersForEssence(essence));
  let cost = essenceCost;
  let chaosUsed = 0;

  while (countGoodMods(item, goodTierMaxInclusive) < minGoodMods && chaosUsed < maxChaos) {
    item = applyLegacyChaosOrbFullReroll(item);
    chaosUsed += 1;
    cost += chaosOrbCost;
  }

  const success = countGoodMods(item, goodTierMaxInclusive) >= minGoodMods;
  return { cost, success };
};

export const logEssenceVersusChaosComparison = (
  options: ICompareEssenceVersusChaosOptionsType = {}
): IEssenceChaosComparisonResultType => {
  const result = compareEssenceVersusChaosSpam(options);
  const { unitCosts, minGoodModsRequired, goodTierMaxInclusive, maxChaosPerAttempt, trials } = result;

  const lines: string[] = [
    "",
    "=== Essence vs Chaos (simulator) ===",
    `Trials: ${trials} | Max chaos per attempt: ${maxChaosPerAttempt}`,
    `Success: ≥${minGoodModsRequired} good mods (tier ≤ ${goodTierMaxInclusive})`,
    `Unit costs: Chaos Orb = ${unitCosts.chaosOrb}, Essence = ${unitCosts.essence}`,
    "",
    "--- (A) Chaos spam only ---",
    `  Average cost: ${result.A_chaosOnly.averageCost.toFixed(3)}`,
    `  Success rate: ${(result.A_chaosOnly.successRate * 100).toFixed(2)}% (${result.A_chaosOnly.successes}/${trials})`,
    "",
    "--- (B) Life Essence → then Chaos ---",
    `  Average cost: ${result.B_lifeEssenceThenChaos.averageCost.toFixed(3)}`,
    `  Success rate: ${(result.B_lifeEssenceThenChaos.successRate * 100).toFixed(2)}% (${result.B_lifeEssenceThenChaos.successes}/${trials})`,
    "",
    "--- (B) Attack Essence → then Chaos ---",
    `  Average cost: ${result.B_attackEssenceThenChaos.averageCost.toFixed(3)}`,
    `  Success rate: ${(result.B_attackEssenceThenChaos.successRate * 100).toFixed(2)}% (${result.B_attackEssenceThenChaos.successes}/${trials})`,
    "",
    "--- Comparison (lower average cost is better if success rates are similar) ---",
    `  Δ cost (Life path − Chaos only): ${(result.B_lifeEssenceThenChaos.averageCost - result.A_chaosOnly.averageCost).toFixed(3)}`,
    `  Δ cost (Attack path − Chaos only): ${(result.B_attackEssenceThenChaos.averageCost - result.A_chaosOnly.averageCost).toFixed(3)}`,
    "",
  ];

  console.log(lines.join("\n"));
  return result;
};
