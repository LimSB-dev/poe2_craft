import { NextResponse } from "next/server";
import { MOD_POOL } from "@/lib/poe2-item-simulator/modPool";
import { runOptimization } from "@/lib/optimizer/optimize";
import type { IOptimizationTargetSpecType } from "@/lib/optimizer/targetSpec";

type IOptimizeRequestType = {
  validModKeys?: string[];
  minTotalAffixes?: number;
  requireTierOne?: boolean;
  budgetChaos?: number;
  trials?: number;
  costModel?: {
    chaos?: number;
    essence?: number;
    omen?: number;
  };
};

const clampNumber = (value: unknown, fallback: number, min: number, max: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
};

const parseTarget = (body: IOptimizeRequestType): IOptimizationTargetSpecType => {
  const allModKeys = MOD_POOL.map((modDefinition) => modDefinition.modKey);
  let validModKeys = allModKeys;

  if (Array.isArray(body.validModKeys) && body.validModKeys.length > 0) {
    const keySet = new Set(allModKeys);
    validModKeys = body.validModKeys.filter((modKey) => keySet.has(modKey));
  }

  return {
    validModKeys,
    minTotalAffixes: Math.floor(clampNumber(body.minTotalAffixes, 6, 1, 6)),
    requireTierOne: body.requireTierOne !== false,
  };
};

export const POST = async (request: Request): Promise<Response> => {
  const body = (await request.json()) as IOptimizeRequestType;
  const target = parseTarget(body);

  const budgetChaos = Math.floor(clampNumber(body.budgetChaos, 80, 1, 300));
  const trials = Math.floor(clampNumber(body.trials, 4000, 100, 30000));
  const costModel = {
    chaos: clampNumber(body.costModel?.chaos, 1, 0.01, 9999),
    essence: clampNumber(body.costModel?.essence, 3, 0.01, 9999),
    omen: clampNumber(body.costModel?.omen, 5, 0.01, 9999),
  };

  const result = runOptimization({
    target,
    budgetChaos,
    trials,
    costModel,
  });

  return NextResponse.json({
    result,
    availableMods: MOD_POOL,
  });
};
