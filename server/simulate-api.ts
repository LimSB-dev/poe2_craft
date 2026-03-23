import express, { type Request, type Response } from "express";
import { runStrategyComparisonEngine } from "../src/lib/poe2-item-simulator/strategyComparisonEngine";
import { GOOD_MOD_MAX_TIER } from "../src/lib/poe2-item-simulator/currency/chaosOrb";

const DEFAULT_TRIALS: number = 4000;
const MAX_TRIALS: number = 20000;
const MAX_BUDGET: number = 500;
const MIN_BUDGET: number = 1;
const MIN_DESIRED_GOOD: number = 1;
const MAX_DESIRED_GOOD: number = 6;

const parseBody = (body: unknown): { desiredGoodMods: number; budget: number; trials: number } => {
  if (body === null || typeof body !== "object") {
    throw new Error("JSON body required");
  }
  const record = body as Record<string, unknown>;
  const desiredRaw = record.desiredGoodMods;
  const budgetRaw = record.budget;
  const trialsRaw = record.trials;

  if (typeof desiredRaw !== "number" || !Number.isInteger(desiredRaw)) {
    throw new Error("desiredGoodMods must be an integer");
  }
  if (typeof budgetRaw !== "number" || !Number.isInteger(budgetRaw)) {
    throw new Error("budget must be an integer");
  }

  let trials = DEFAULT_TRIALS;
  if (trialsRaw !== undefined) {
    if (typeof trialsRaw !== "number" || !Number.isInteger(trialsRaw)) {
      throw new Error("trials must be an integer when provided");
    }
    trials = trialsRaw;
  }

  if (desiredRaw < MIN_DESIRED_GOOD || desiredRaw > MAX_DESIRED_GOOD) {
    throw new Error(`desiredGoodMods must be between ${MIN_DESIRED_GOOD} and ${MAX_DESIRED_GOOD}`);
  }
  if (budgetRaw < MIN_BUDGET || budgetRaw > MAX_BUDGET) {
    throw new Error(`budget must be between ${MIN_BUDGET} and ${MAX_BUDGET}`);
  }
  if (trials < 100 || trials > MAX_TRIALS) {
    throw new Error(`trials must be between 100 and ${MAX_TRIALS}`);
  }

  return { desiredGoodMods: desiredRaw, budget: budgetRaw, trials };
};

const app = express();
app.use(express.json({ limit: "32kb" }));

app.post("/simulate", (req: Request, res: Response) => {
  try {
    const { desiredGoodMods, budget, trials } = parseBody(req.body);
    const minTotalAffixes = Math.min(6, Math.max(4, desiredGoodMods));

    const result = runStrategyComparisonEngine({
      trials,
      maxChaosPerAttempt: budget,
      successCriteria: {
        minGoodMods: desiredGoodMods,
        minTotalAffixes,
        goodTierMaxInclusive: GOOD_MOD_MAX_TIER,
      },
    });

    const best = result.bestStrategy;

    res.json({
      bestStrategy: best.strategyId,
      expectedCost: best.averageCost,
      successRate: best.successRate,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    res.status(400).json({ error: message });
  }
});

const port = Number.parseInt(process.env.PORT ?? "4000", 10);
app.listen(port);
