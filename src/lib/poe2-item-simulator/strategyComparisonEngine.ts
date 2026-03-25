import {
  applyLegacyChaosOrbFullReroll,
  countGoodMods,
  countTotalAffixes,
  GOOD_MOD_MAX_TIER,
} from "./currency/chaosOrb";
import { shouldContinue, type IShouldContinueOptionsType } from "./craftingDecision";
import {
  applyEssence,
  getBenchModFiltersForEssence,
  LIFE_ESSENCE,
} from "./essence/essence";

const ENGINE_VERSION: string = "1.0.0";

const EMPTY_MAGIC: IItemRoll = { rarity: "magic", prefixes: [], suffixes: [] };
const EMPTY_RARE: IItemRoll = { rarity: "rare", prefixes: [], suffixes: [] };

export type IStrategyComparisonEngineOptionsType = {
  trials?: number;
  maxChaosPerAttempt?: number;
  successCriteria?: Partial<ISuccessCriteriaType>;
  unitCosts?: Partial<ICurrencyUnitCostsType>;
  /** Essence used for the Essence → Chaos strategy (default Life Essence). */
  essence?: IEssenceDefinitionType;
  shouldContinueOptions?: IShouldContinueOptionsType;
};

const DEFAULT_TRIALS: number = 10000;
const DEFAULT_MAX_CHAOS: number = 80;
const DEFAULT_MIN_TOTAL_AFFIXES: number = 4;
const DEFAULT_MIN_GOOD_MODS: number = 3;
const DEFAULT_CHAOS_COST: number = 1;
const DEFAULT_ESSENCE_COST: number = 3;

const meetsSuccess = (item: IItemRoll, criteria: ISuccessCriteriaType): boolean => {
  if (countTotalAffixes(item) < criteria.minTotalAffixes) {
    return false;
  }
  if (countGoodMods(item, criteria.goodTierMaxInclusive) < criteria.minGoodMods) {
    return false;
  }
  return true;
};

type ITrialOutcomeType = {
  cost: number;
  success: boolean;
};

const simulateChaosSpamTrial = (
  maxChaos: number,
  criteria: ISuccessCriteriaType,
  chaosOrbCost: number
): ITrialOutcomeType => {
  let item = EMPTY_RARE;
  let chaosUsed = 0;
  let cost = 0;

  while (chaosUsed < maxChaos && !meetsSuccess(item, criteria)) {
    item = applyLegacyChaosOrbFullReroll(item);
    chaosUsed += 1;
    cost += chaosOrbCost;
  }

  return {
    cost,
    success: meetsSuccess(item, criteria),
  };
};

const simulateEssenceThenChaosTrial = (
  maxChaos: number,
  criteria: ISuccessCriteriaType,
  essence: IEssenceDefinitionType,
  chaosOrbCost: number,
  essenceCost: number
): ITrialOutcomeType => {
  let item = applyEssence(EMPTY_MAGIC, essence, getBenchModFiltersForEssence(essence));
  let chaosUsed = 0;
  let cost = essenceCost;

  while (chaosUsed < maxChaos && !meetsSuccess(item, criteria)) {
    item = applyLegacyChaosOrbFullReroll(item);
    chaosUsed += 1;
    cost += chaosOrbCost;
  }

  return {
    cost,
    success: meetsSuccess(item, criteria),
  };
};

const simulateSmartStopTrial = (
  maxChaos: number,
  criteria: ISuccessCriteriaType,
  chaosOrbCost: number,
  shouldContinueOptions: IShouldContinueOptionsType
): ITrialOutcomeType => {
  let item: IItemRoll = { rarity: "rare", prefixes: [], suffixes: [] };
  let chaosUsed = 0;
  let cost = 0;

  while (chaosUsed < maxChaos && !meetsSuccess(item, criteria)) {
    if (!shouldContinue(item, shouldContinueOptions)) {
      break;
    }
    item = applyLegacyChaosOrbFullReroll(item);
    chaosUsed += 1;
    cost += chaosOrbCost;
  }

  return {
    cost,
    success: meetsSuccess(item, criteria),
  };
};

const buildMetrics = (
  strategyId: IStrategyIdType,
  strategyLabel: string,
  trials: number,
  totalCostSum: number,
  sumCostOnSuccess: number,
  successes: number
): IStrategyMetricsJsonType => {
  return {
    strategyId,
    strategyLabel,
    trials,
    averageCost: totalCostSum / trials,
    successRate: successes / trials,
    successes,
    costPerSuccess: successes > 0 ? sumCostOnSuccess / successes : null,
  };
};

/**
 * Runs three strategies with the same success rule and returns a JSON-friendly aggregate.
 * Suitable for API responses (`JSON.stringify` / `Response.json()`).
 */
export const runStrategyComparisonEngine = (
  options: IStrategyComparisonEngineOptionsType = {}
): IStrategyComparisonEngineResultType => {
  const trials = options.trials ?? DEFAULT_TRIALS;
  const maxChaosPerAttempt = options.maxChaosPerAttempt ?? DEFAULT_MAX_CHAOS;
  const successCriteria: ISuccessCriteriaType = {
    minTotalAffixes: options.successCriteria?.minTotalAffixes ?? DEFAULT_MIN_TOTAL_AFFIXES,
    minGoodMods: options.successCriteria?.minGoodMods ?? DEFAULT_MIN_GOOD_MODS,
    goodTierMaxInclusive: options.successCriteria?.goodTierMaxInclusive ?? GOOD_MOD_MAX_TIER,
  };
  const unitCosts: ICurrencyUnitCostsType = {
    chaosOrb: options.unitCosts?.chaosOrb ?? DEFAULT_CHAOS_COST,
    essence: options.unitCosts?.essence ?? DEFAULT_ESSENCE_COST,
  };
  const essence = options.essence ?? LIFE_ESSENCE;
  const shouldContinueOptions = options.shouldContinueOptions ?? {};

  if (trials <= 0) {
    throw new Error("runStrategyComparisonEngine: trials must be positive.");
  }

  let totalChaos = 0;
  let sumCostSuccessChaos = 0;
  let successesChaos = 0;

  let totalEssence = 0;
  let sumCostSuccessEssence = 0;
  let successesEssence = 0;

  let totalSmart = 0;
  let sumCostSuccessSmart = 0;
  let successesSmart = 0;

  for (let i = 0; i < trials; i += 1) {
    const o1 = simulateChaosSpamTrial(maxChaosPerAttempt, successCriteria, unitCosts.chaosOrb);
    totalChaos += o1.cost;
    if (o1.success) {
      successesChaos += 1;
      sumCostSuccessChaos += o1.cost;
    }

    const o2 = simulateEssenceThenChaosTrial(
      maxChaosPerAttempt,
      successCriteria,
      essence,
      unitCosts.chaosOrb,
      unitCosts.essence
    );
    totalEssence += o2.cost;
    if (o2.success) {
      successesEssence += 1;
      sumCostSuccessEssence += o2.cost;
    }

    const o3 = simulateSmartStopTrial(
      maxChaosPerAttempt,
      successCriteria,
      unitCosts.chaosOrb,
      shouldContinueOptions
    );
    totalSmart += o3.cost;
    if (o3.success) {
      successesSmart += 1;
      sumCostSuccessSmart += o3.cost;
    }
  }

  const strategies: IStrategyComparisonStrategiesBundleType = {
    chaosSpam: buildMetrics(
      "chaos_spam",
      "Chaos spam",
      trials,
      totalChaos,
      sumCostSuccessChaos,
      successesChaos
    ),
    essenceThenChaos: buildMetrics(
      "essence_then_chaos",
      "Essence → Chaos",
      trials,
      totalEssence,
      sumCostSuccessEssence,
      successesEssence
    ),
    smartStop: buildMetrics(
      "smart_stop",
      "Smart stop",
      trials,
      totalSmart,
      sumCostSuccessSmart,
      successesSmart
    ),
  };

  return {
    engineVersion: ENGINE_VERSION,
    simulatedAt: new Date().toISOString(),
    trials,
    maxChaosPerAttempt,
    successCriteria,
    unitCosts,
    essenceKeyForEssenceStrategy: essence.essenceKey,
    strategies,
    bestStrategy: pickBestStrategyMetrics(strategies),
  };
};

/**
 * Picks the strategy with the highest success rate; on tie, lowest average cost per trial.
 */
export const pickBestStrategyMetrics = (
  strategies: IStrategyComparisonStrategiesBundleType
): IStrategyMetricsJsonType => {
  const rows = [
    strategies.chaosSpam,
    strategies.essenceThenChaos,
    strategies.smartStop,
  ];
  const maxRate = Math.max(...rows.map((row) => row.successRate));
  const epsilon = 1e-12;
  const top = rows.filter((row) => row.successRate >= maxRate - epsilon);
  top.sort((a, b) => a.averageCost - b.averageCost);
  const chosen = top[0];
  if (chosen) {
    return chosen;
  }
  return rows.reduce((a, b) => (a.averageCost <= b.averageCost ? a : b));
};

/** Serialize engine output for HTTP bodies (stable shape for clients). */
export const strategyComparisonResultToJson = (
  result: IStrategyComparisonEngineResultType,
  space?: number
): string => {
  return JSON.stringify(result, null, space ?? 0);
};
