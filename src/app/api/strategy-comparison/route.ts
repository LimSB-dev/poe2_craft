import { NextResponse } from "next/server";
import { runStrategyComparisonEngine } from "@/lib/poe2-item-simulator/strategyComparisonEngine";

const MAX_TRIALS: number = 50000;
const DEFAULT_TRIALS: number = 10000;

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

export const GET = async (request: Request): Promise<Response> => {
  const { searchParams } = new URL(request.url);
  const trials = parsePositiveInt(searchParams.get("trials"), DEFAULT_TRIALS);

  const result = runStrategyComparisonEngine({ trials });
  return NextResponse.json(result);
};
