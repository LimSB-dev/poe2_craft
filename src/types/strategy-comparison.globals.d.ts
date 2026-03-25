export {};

declare global {
  type IStrategyIdType = "chaos_spam" | "essence_then_chaos" | "smart_stop";

  type ISuccessCriteriaType = {
    minTotalAffixes: number;
    minGoodMods: number;
    goodTierMaxInclusive: number;
  };

  type ICurrencyUnitCostsType = {
    chaosOrb: number;
    essence: number;
  };

  type IStrategyMetricsJsonType = {
    strategyId: IStrategyIdType;
    strategyLabel: string;
    trials: number;
    averageCost: number;
    successRate: number;
    successes: number;
    costPerSuccess: number | null;
  };

  type IStrategyComparisonStrategiesBundleType = {
    chaosSpam: IStrategyMetricsJsonType;
    essenceThenChaos: IStrategyMetricsJsonType;
    smartStop: IStrategyMetricsJsonType;
  };

  type IStrategyComparisonEngineResultType = {
    engineVersion: string;
    simulatedAt: string;
    trials: number;
    maxChaosPerAttempt: number;
    successCriteria: ISuccessCriteriaType;
    unitCosts: ICurrencyUnitCostsType;
    essenceKeyForEssenceStrategy: string;
    strategies: IStrategyComparisonStrategiesBundleType;
    bestStrategy: IStrategyMetricsJsonType;
  };
}

