import { NextResponse } from "next/server";
import { GOOD_MOD_MAX_TIER } from "@/lib/poe2-item-simulator/currency/chaosOrb";
import { runStrategyComparisonEngine } from "@/lib/poe2-item-simulator/strategyComparisonEngine";
import {
  STRATEGY_COMPARISON_BUDGET_MAX,
  STRATEGY_COMPARISON_BUDGET_MIN,
  STRATEGY_COMPARISON_DEFAULT_BUDGET_MAX_CHAOS,
  STRATEGY_COMPARISON_DEFAULT_MIN_GOOD_MODS,
  STRATEGY_COMPARISON_DEFAULT_MIN_TOTAL_AFFIXES,
  STRATEGY_COMPARISON_DEFAULT_TRIALS,
  STRATEGY_COMPARISON_GOOD_TIER_MAX,
  STRATEGY_COMPARISON_GOOD_TIER_MIN,
  STRATEGY_COMPARISON_MAX_TRIALS,
  STRATEGY_COMPARISON_MIN_GOOD_MODS_MAX,
  STRATEGY_COMPARISON_MIN_GOOD_MODS_MIN,
  STRATEGY_COMPARISON_MIN_TOTAL_AFFIXES_MAX,
  STRATEGY_COMPARISON_MIN_TOTAL_AFFIXES_MIN,
} from "@/constants/strategyComparison";

const parsePositiveInt = (value: string | null, fallback: number): number => {
  if (value === null) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, STRATEGY_COMPARISON_MAX_TRIALS);
};

const parseBoundedInt = (
  value: string | null,
  fallback: number,
  min: number,
  max: number
): number => {
  if (value === null) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
};

export const GET = async (request: Request): Promise<Response> => {
  const { searchParams } = new URL(request.url);
  const trials = parsePositiveInt(searchParams.get("trials"), STRATEGY_COMPARISON_DEFAULT_TRIALS);
  const budget = parseBoundedInt(
    searchParams.get("budget"),
    STRATEGY_COMPARISON_DEFAULT_BUDGET_MAX_CHAOS,
    STRATEGY_COMPARISON_BUDGET_MIN,
    STRATEGY_COMPARISON_BUDGET_MAX
  );
  const minGoodMods = parseBoundedInt(
    searchParams.get("minGoodMods"),
    STRATEGY_COMPARISON_DEFAULT_MIN_GOOD_MODS,
    STRATEGY_COMPARISON_MIN_GOOD_MODS_MIN,
    STRATEGY_COMPARISON_MIN_GOOD_MODS_MAX
  );
  const minTotalAffixes = parseBoundedInt(
    searchParams.get("minTotalAffixes"),
    STRATEGY_COMPARISON_DEFAULT_MIN_TOTAL_AFFIXES,
    STRATEGY_COMPARISON_MIN_TOTAL_AFFIXES_MIN,
    STRATEGY_COMPARISON_MIN_TOTAL_AFFIXES_MAX
  );
  const goodTierMaxInclusive = parseBoundedInt(
    searchParams.get("goodTierMax"),
    GOOD_MOD_MAX_TIER,
    STRATEGY_COMPARISON_GOOD_TIER_MIN,
    STRATEGY_COMPARISON_GOOD_TIER_MAX
  );

  const result = runStrategyComparisonEngine({
    trials,
    maxChaosPerAttempt: budget,
    successCriteria: {
      minGoodMods,
      minTotalAffixes,
      goodTierMaxInclusive,
    },
  });
  return NextResponse.json(result);
};
