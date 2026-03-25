export type IStrategyIdType = "chaos_spam" | "essence_then_chaos" | "smart_stop";

export type ISuccessCriteriaType = {
  minTotalAffixes: number;
  minGoodMods: number;
  goodTierMaxInclusive: number;
};

export type ICurrencyUnitCostsType = {
  chaosOrb: number;
  essence: number;
};

export type IStrategyMetricsJsonType = {
  strategyId: IStrategyIdType;
  strategyLabel: string;
  trials: number;
  /** Mean currency spent per trial (includes failed attempts). */
  averageCost: number;
  successRate: number;
  successes: number;
  /**
   * Mean currency among trials that met success criteria only.
   * `null` if there were zero successes (division undefined).
   */
  costPerSuccess: number | null;
};

export type IStrategyComparisonStrategiesBundleType = {
  chaosSpam: IStrategyMetricsJsonType;
  essenceThenChaos: IStrategyMetricsJsonType;
  smartStop: IStrategyMetricsJsonType;
};

export type IStrategyComparisonEngineResultType = {
  engineVersion: string;
  simulatedAt: string;
  trials: number;
  maxChaosPerAttempt: number;
  successCriteria: ISuccessCriteriaType;
  unitCosts: ICurrencyUnitCostsType;
  essenceKeyForEssenceStrategy: string;
  strategies: IStrategyComparisonStrategiesBundleType;
  /** Highest success rate; ties broken by lower average cost per trial. */
  bestStrategy: IStrategyMetricsJsonType;
};

