"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ReactElement } from "react";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import type { IStrategyComparisonEngineResultType } from "@/lib/poe2-item-simulator/strategyComparisonEngine";

const TRIALS_QUERY: number = 10000;

const fetchStrategyJson = async (): Promise<IStrategyComparisonEngineResultType> => {
  const response = await fetch(`/api/strategy-comparison?trials=${TRIALS_QUERY}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<IStrategyComparisonEngineResultType>;
};

export const StrategyComparisonView = (): ReactElement => {
  const t = useTranslations("simulator.strategyView");
  const [data, setData] = useState<IStrategyComparisonEngineResultType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchStrategyJson();
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

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 dark:bg-black px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{t("title")}</h1>
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
          <div className="flex flex-col items-end gap-2 shrink-0">
            <LocaleSwitcher />
            <button
              type="button"
              onClick={() => {
                void load();
              }}
              disabled={loading}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 disabled:opacity-50"
            >
              {t("retry")}
            </button>
          </div>
        </header>

        {loading && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
            {t("loading")}
          </p>
        )}

        {error !== null && !loading && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
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
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{row.strategyLabel}</td>
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
