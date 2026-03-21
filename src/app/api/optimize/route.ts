import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NextResponse } from "next/server";
import { MOD_POOL } from "@/lib/poe2-item-simulator/modPool";
import { toOptimizerModPoolFromPoe2Db } from "@/lib/poe2db/optimizerModPool";
import type { IPoe2DbImportResultType } from "@/lib/poe2db/schema";
import { runOptimization } from "@/lib/optimizer/optimize";
import type { IOptimizationTargetSpecType } from "@/lib/optimizer/targetSpec";
import type { IModDefinition } from "@/lib/poe2-item-simulator/types";

type IDataSourceType = "local" | "poe2db";

type IOptimizeRequestType = {
  dataSource?: IDataSourceType;
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

const normalizeDataSource = (value: unknown): IDataSourceType => {
  if (value === "poe2db") {
    return "poe2db";
  }
  return "local";
};

const clampNumber = (value: unknown, fallback: number, min: number, max: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
};

const parseTarget = (
  body: IOptimizeRequestType,
  modPool: ReadonlyArray<IModDefinition>
): IOptimizationTargetSpecType => {
  const allModKeys = modPool.map((modDefinition) => modDefinition.modKey);
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

const loadPoe2DbImportResult = async (): Promise<IPoe2DbImportResultType | null> => {
  try {
    const filePath = resolve(process.cwd(), "data/poe2db/latest.json");
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as IPoe2DbImportResultType;
  } catch {
    return null;
  }
};

const loadModPoolByDataSource = async (dataSource: IDataSourceType): Promise<{
  activeDataSource: IDataSourceType;
  modPool: IModDefinition[];
}> => {
  if (dataSource === "poe2db") {
    const imported = await loadPoe2DbImportResult();
    if (imported !== null) {
      const mapped = toOptimizerModPoolFromPoe2Db(imported);
      if (mapped.length > 0) {
        return {
          activeDataSource: "poe2db",
          modPool: mapped,
        };
      }
    }
  }

  return {
    activeDataSource: "local",
    modPool: [...MOD_POOL],
  };
};

export const GET = async (request: Request): Promise<Response> => {
  const { searchParams } = new URL(request.url);
  const requestedDataSource = normalizeDataSource(searchParams.get("dataSource"));
  const loaded = await loadModPoolByDataSource(requestedDataSource);

  return NextResponse.json({
    requestedDataSource,
    activeDataSource: loaded.activeDataSource,
    availableMods: loaded.modPool,
  });
};

export const POST = async (request: Request): Promise<Response> => {
  const body = (await request.json()) as IOptimizeRequestType;
  const requestedDataSource = normalizeDataSource(body.dataSource);
  const loaded = await loadModPoolByDataSource(requestedDataSource);
  const target = parseTarget(body, loaded.modPool);

  const budgetChaos = Math.floor(clampNumber(body.budgetChaos, 80, 1, 300));
  const trials = Math.floor(clampNumber(body.trials, 4000, 100, 30000));
  const costModel = {
    chaos: clampNumber(body.costModel?.chaos, 1, 0.01, 9999),
    essence: clampNumber(body.costModel?.essence, 3, 0.01, 9999),
    omen: clampNumber(body.costModel?.omen, 5, 0.01, 9999),
  };

  const result = runOptimization({
    modPool: loaded.modPool,
    target,
    budgetChaos,
    trials,
    costModel,
  });

  return NextResponse.json({
    requestedDataSource,
    activeDataSource: loaded.activeDataSource,
    result,
    availableMods: loaded.modPool,
  });
};
