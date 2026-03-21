import { NextResponse } from "next/server";
import { GOOD_MOD_MAX_TIER } from "@/lib/poe2-item-simulator/chaosOrb";
import { runStrategyComparisonEngine } from "@/lib/poe2-item-simulator/strategyComparisonEngine";

const MAX_TRIALS: number = 50000;
const DEFAULT_TRIALS: number = 10000;
const DEFAULT_BUDGET_MAX_CHAOS: number = 80;
const BUDGET_MIN: number = 1;
const BUDGET_MAX: number = 200;
const MIN_GOOD_MODS_MIN: number = 1;
const MIN_GOOD_MODS_MAX: number = 6;
const MIN_TOTAL_AFFIXES_MIN: number = 1;
const MIN_TOTAL_AFFIXES_MAX: number = 6;
const GOOD_TIER_MIN: number = 1;
const GOOD_TIER_MAX: number = 5;

const parsePositiveInt = (value: string | null, fallback: number): number => {
  if (value === null) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, MAX_TRIALS);
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
  const trials = parsePositiveInt(searchParams.get("trials"), DEFAULT_TRIALS);
  const budget = parseBoundedInt(
    searchParams.get("budget"),
    DEFAULT_BUDGET_MAX_CHAOS,
    BUDGET_MIN,
    BUDGET_MAX
  );
  const minGoodMods = parseBoundedInt(
    searchParams.get("minGoodMods"),
    3,
    MIN_GOOD_MODS_MIN,
    MIN_GOOD_MODS_MAX
  );
  const minTotalAffixes = parseBoundedInt(
    searchParams.get("minTotalAffixes"),
    4,
    MIN_TOTAL_AFFIXES_MIN,
    MIN_TOTAL_AFFIXES_MAX
  );
  const goodTierMaxInclusive = parseBoundedInt(
    searchParams.get("goodTierMax"),
    GOOD_MOD_MAX_TIER,
    GOOD_TIER_MIN,
    GOOD_TIER_MAX
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
