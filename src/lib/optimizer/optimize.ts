import {
  simulateSingleTrial,
  type ICurrencyCostModelType,
  type IOptimizationStrategyIdType,
} from "@/lib/optimizer/actionModel";
import type { IModDefinition } from "@/lib/poe2-item-simulator/types";
import type { IOptimizationTargetSpecType } from "@/lib/optimizer/targetSpec";

export type IOptimizationStrategySummaryType = {
  strategyId: IOptimizationStrategyIdType;
  strategyLabel: string;
  trials: number;
  successRate: number;
  averageCost: number;
  averageCostOnSuccess: number | null;
  expectedCostPerSuccess: number | null;
  averageQualityScore: number;
};

export type IOptimizationResultType = {
  target: IOptimizationTargetSpecType;
  budgetChaos: number;
  trials: number;
  costModel: ICurrencyCostModelType;
  strategies: ReadonlyArray<IOptimizationStrategySummaryType>;
  bestStrategy: IOptimizationStrategySummaryType;
};

const STRATEGY_IDS: ReadonlyArray<IOptimizationStrategyIdType> = [
  "chaos_only",
  "essence_then_chaos",
  "omen_essence_chaos",
];

const strategyLabel = (strategyId: IOptimizationStrategyIdType): string => {
  if (strategyId === "chaos_only") {
    return "Chaos only";
  }
  if (strategyId === "essence_then_chaos") {
    return "Essence then Chaos";
  }
  return "Omen + Essence then Chaos";
};

const compareStrategies = (
  left: IOptimizationStrategySummaryType,
  right: IOptimizationStrategySummaryType
): number => {
  if (left.expectedCostPerSuccess !== null && right.expectedCostPerSuccess !== null) {
    return left.expectedCostPerSuccess - right.expectedCostPerSuccess;
  }
  if (left.expectedCostPerSuccess !== null) {
    return -1;
  }
  if (right.expectedCostPerSuccess !== null) {
    return 1;
  }
  return right.successRate - left.successRate;
};

export const runOptimization = (params: {
  modPool: ReadonlyArray<IModDefinition>;
  target: IOptimizationTargetSpecType;
  budgetChaos: number;
  trials: number;
  costModel: ICurrencyCostModelType;
}): IOptimizationResultType => {
  const strategySummaries: IOptimizationStrategySummaryType[] = [];

  for (const strategyId of STRATEGY_IDS) {
    let successCount = 0;
    let totalCostSum = 0;
    let successCostSum = 0;
    let qualitySum = 0;

    for (let trialIndex = 0; trialIndex < params.trials; trialIndex += 1) {
      const trial = simulateSingleTrial({
        strategyId,
        modPool: params.modPool,
        targetSpec: params.target,
        budgetChaos: params.budgetChaos,
        costModel: params.costModel,
      });
      totalCostSum += trial.totalCost;
      qualitySum += trial.qualityScore;

      if (trial.success) {
        successCount += 1;
        successCostSum += trial.totalCost;
      }
    }

    const successRate = successCount / params.trials;
    const averageCost = totalCostSum / params.trials;
    const averageCostOnSuccess = successCount > 0 ? successCostSum / successCount : null;
    const expectedCostPerSuccess = successRate > 0 ? averageCost / successRate : null;

    strategySummaries.push({
      strategyId,
      strategyLabel: strategyLabel(strategyId),
      trials: params.trials,
      successRate,
      averageCost,
      averageCostOnSuccess,
      expectedCostPerSuccess,
      averageQualityScore: qualitySum / params.trials,
    });
  }

  strategySummaries.sort(compareStrategies);
  const bestStrategy = strategySummaries[0];
  if (!bestStrategy) {
    throw new Error("No optimization strategies available.");
  }

  return {
    target: params.target,
    budgetChaos: params.budgetChaos,
    trials: params.trials,
    costModel: params.costModel,
    strategies: strategySummaries,
    bestStrategy,
  };
};
