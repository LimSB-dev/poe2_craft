"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { LocaleSwitcher } from "@/components/organisms/LocaleSwitcher";
import { ReservedStatusRegion } from "@/components/atoms/ReservedStatusRegion";
import {
  StrategySuccessRateChart,
  type IStrategyRateRowType,
} from "@/components/organisms/StrategySuccessRateChart";

const TRIALS_QUERY: number = 10000;
const DEFAULT_MIN_GOOD_MODS: number = 3;
const DEFAULT_BUDGET: number = 80;
const MIN_GOOD_MODS_MIN: number = 1;
const MIN_GOOD_MODS_MAX: number = 6;
const BUDGET_MIN: number = 1;
const BUDGET_MAX: number = 200;

const fetchStrategyJson = async (params: {
  minGoodMods: number;
  budget: number;
}): Promise<IStrategyComparisonEngineResultType> => {
  const search = new URLSearchParams({
    trials: String(TRIALS_QUERY),
    minGoodMods: String(params.minGoodMods),
    budget: String(params.budget),
  });
  const response = await fetch(`/api/strategy-comparison?${search.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<IStrategyComparisonEngineResultType>;
};

const STRATEGY_NAME_KEY_BY_ID: Record<
  "chaos_spam" | "essence_then_chaos" | "smart_stop",
  "strategyNames.chaos_spam" | "strategyNames.essence_then_chaos" | "strategyNames.smart_stop"
> = {
  chaos_spam: "strategyNames.chaos_spam",
  essence_then_chaos: "strategyNames.essence_then_chaos",
  smart_stop: "strategyNames.smart_stop",
};

const strategyLabel = (
  t: (key: (typeof STRATEGY_NAME_KEY_BY_ID)[keyof typeof STRATEGY_NAME_KEY_BY_ID]) => string,
  strategyId: string,
  fallback: string
): string => {
  if (
    strategyId === "chaos_spam" ||
    strategyId === "essence_then_chaos" ||
    strategyId === "smart_stop"
  ) {
    return t(STRATEGY_NAME_KEY_BY_ID[strategyId]);
  }
  return fallback;
};

export const StrategyComparisonView = (): ReactElement => {
  const t = useTranslations("simulator.strategyView");
  const [minGoodMods, setMinGoodMods] = useState<number>(DEFAULT_MIN_GOOD_MODS);
  const [budget, setBudget] = useState<number>(DEFAULT_BUDGET);
  const [data, setData] = useState<IStrategyComparisonEngineResultType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const inputsRef = useRef({ minGoodMods, budget });
  inputsRef.current = { minGoodMods, budget };

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    const { minGoodMods: mg, budget: b } = inputsRef.current;
    try {
      const result = await fetchStrategyJson({
        minGoodMods: mg,
        budget: b,
      });
      setData(result);
    } catch {
      setError(t("error"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const formatPercent = (rate: number): string => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  const formatCost = (value: number | null): string => {
    if (value === null) {
      return "—";
    }
    return value.toFixed(4);
  };

  const chartRows: IStrategyRateRowType[] =
    data === null
      ? []
      : (
          [
            data.strategies.chaosSpam,
            data.strategies.essenceThenChaos,
            data.strategies.smartStop,
          ] as const
        ).map((row) => ({
          strategyId: row.strategyId,
          label: strategyLabel(t, row.strategyId, row.strategyLabel),
          successRate: row.successRate,
        }));

  const best = data?.bestStrategy;

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 dark:bg-black px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className="font-sc text-2xl font-bold text-zinc-950 dark:text-zinc-50">{t("title")}</h1>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 max-w-2xl">{t("intro")}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <Link
                href="/"
                className="text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
              >
                {t("navToSimulator")}
              </Link>
            </p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0 w-full sm:w-auto">
            <LocaleSwitcher />
          </div>
        </header>

        <section
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm"
          aria-labelledby="sim-inputs-heading"
        >
          <h2
            id="sim-inputs-heading"
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4"
          >
            {t("form.sectionTitle")}
          </h2>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:items-end">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[10rem]">
              <label htmlFor="desired-good-mods" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {t("form.desiredGoodMods")}
              </label>
              <input
                id="desired-good-mods"
                type="number"
                min={MIN_GOOD_MODS_MIN}
                max={MIN_GOOD_MODS_MAX}
                value={minGoodMods}
                onChange={(e) => {
                  const next = Number.parseInt(e.target.value, 10);
                  if (Number.isFinite(next)) {
                    setMinGoodMods(Math.min(Math.max(next, MIN_GOOD_MODS_MIN), MIN_GOOD_MODS_MAX));
                  }
                }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-[10rem]">
              <label htmlFor="budget-chaos" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {t("form.budget")}
              </label>
              <input
                id="budget-chaos"
                type="number"
                min={BUDGET_MIN}
                max={BUDGET_MAX}
                value={budget}
                onChange={(e) => {
                  const next = Number.parseInt(e.target.value, 10);
                  if (Number.isFinite(next)) {
                    setBudget(Math.min(Math.max(next, BUDGET_MIN), BUDGET_MAX));
                  }
                }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 tabular-nums"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-500">{t("form.budgetHint")}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                void load();
              }}
              disabled={loading}
              className="rounded-lg border border-amber-600/80 dark:border-amber-500/60 bg-amber-500/15 dark:bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-950 dark:text-amber-100 disabled:opacity-50 sm:shrink-0"
            >
              {t("form.run")}
            </button>
          </div>
        </section>

        <ReservedStatusRegion
          minHeightClass="min-h-[4rem]"
          isEmpty={!loading && error === null}
          placeholderTextClassName="text-sm leading-snug"
        >
          {loading ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("loading")}</p>
          ) : error !== null ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </ReservedStatusRegion>

        {data !== null && !loading && best !== undefined && (
          <section
            className="rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-5"
            aria-labelledby="best-strategy-heading"
          >
            <h2
              id="best-strategy-heading"
              className="text-sm font-semibold text-amber-950 dark:text-amber-100 mb-3"
            >
              {t("best.title")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">{t("best.name")}</span>
                <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {strategyLabel(t, best.strategyId, best.strategyLabel)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">{t("best.cost")}</span>
                <span className="text-base tabular-nums text-zinc-900 dark:text-zinc-50">
                  {t("best.costValue", {
                    avg: best.averageCost.toFixed(4),
                    perSuccess: formatCost(best.costPerSuccess),
                  })}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">{t("best.successRate")}</span>
                <span className="text-base tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
                  {formatPercent(best.successRate)}
                </span>
              </div>
            </div>
          </section>
        )}

        {data !== null && !loading && chartRows.length > 0 && (
          <StrategySuccessRateChart
            title={t("chart.title")}
            rows={chartRows}
            formatPercent={formatPercent}
          />
        )}

        {data !== null && !loading && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 text-sm text-zinc-700 dark:text-zinc-300 space-y-2">
              <p>
                {t("criteriaLine", {
                  minAffixes: data.successCriteria.minTotalAffixes,
                  minGood: data.successCriteria.minGoodMods,
                  tier: data.successCriteria.goodTierMaxInclusive,
                })}
              </p>
              <p>
                {t("metaLine", {
                  trials: data.trials,
                  maxChaos: data.maxChaosPerAttempt,
                  version: data.engineVersion,
                })}
              </p>
              <p>
                {t("costLine", {
                  chaos: data.unitCosts.chaosOrb,
                  essence: data.unitCosts.essence,
                  essenceKey: data.essenceKeyForEssenceStrategy,
                })}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                {t("simulatedAt", { iso: data.simulatedAt })}
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                      {t("table.strategy")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                      {t("table.averageCost")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                      {t("table.successRate")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                      {t("table.costPerSuccess")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                      {t("table.successes")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {(
                    [
                      data.strategies.chaosSpam,
                      data.strategies.essenceThenChaos,
                      data.strategies.smartStop,
                    ] as const
                  ).map((row) => (
                    <tr key={row.strategyId} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40">
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                        {strategyLabel(t, row.strategyId, row.strategyLabel)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-800 dark:text-zinc-200">
                        {row.averageCost.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-800 dark:text-zinc-200">
                        {formatPercent(row.successRate)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-800 dark:text-zinc-200">
                        {formatCost(row.costPerSuccess)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                        {row.successes} / {row.trials}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
