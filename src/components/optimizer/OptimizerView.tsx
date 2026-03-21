"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { Link } from "@/lib/i18n/navigation";
import { MOD_POOL } from "@/lib/poe2-item-simulator/modPool";

type IModType = {
  modKey: string;
  displayName: string;
  tier: number;
  modType: "prefix" | "suffix" | "corruptedPrefix" | "corruptedSuffix";
  weight: number;
};

type IOptimizationResponseType = {
  requestedDataSource: "local" | "poe2db";
  activeDataSource: "local" | "poe2db";
  result: {
    target: {
      validModKeys: string[];
      minTotalAffixes: number;
      requireTierOne: boolean;
    };
    budgetChaos: number;
    trials: number;
    costModel: {
      chaos: number;
      essence: number;
      omen: number;
    };
    strategies: Array<{
      strategyId: string;
      strategyLabel: string;
      trials: number;
      successRate: number;
      averageCost: number;
      averageCostOnSuccess: number | null;
      expectedCostPerSuccess: number | null;
      averageQualityScore: number;
    }>;
    bestStrategy: {
      strategyId: string;
      strategyLabel: string;
      trials: number;
      successRate: number;
      averageCost: number;
      averageCostOnSuccess: number | null;
      expectedCostPerSuccess: number | null;
      averageQualityScore: number;
    };
  };
  availableMods: IModType[];
};

const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(4)}%`;
};

const formatCost = (value: number | null): string => {
  if (value === null) {
    return "—";
  }
  return value.toFixed(4);
};

export const OptimizerView = (): ReactElement => {
  const t = useTranslations("simulator.optimizerView");
  const [budgetChaos, setBudgetChaos] = useState<number>(80);
  const [trials, setTrials] = useState<number>(4000);
  const [minTotalAffixes, setMinTotalAffixes] = useState<number>(6);
  const [requireTierOne, setRequireTierOne] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<"local" | "poe2db">("local");
  const [activeDataSource, setActiveDataSource] = useState<"local" | "poe2db">("local");
  const [availableMods, setAvailableMods] = useState<IModType[]>(() => [...MOD_POOL]);
  const [selectedModKeys, setSelectedModKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMods, setLoadingMods] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IOptimizationResponseType | null>(null);

  const modGroups = useMemo(() => {
    const prefixes = availableMods.filter((modDefinition) => modDefinition.modType === "prefix");
    const suffixes = availableMods.filter((modDefinition) => modDefinition.modType === "suffix");
    return { prefixes, suffixes };
  }, [availableMods]);

  const isAllSelected = selectedModKeys.length === availableMods.length;

  useEffect(() => {
    const loadMods = async (): Promise<void> => {
      setLoadingMods(true);
      setError(null);
      try {
        const response = await fetch(`/api/optimize?dataSource=${dataSource}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = (await response.json()) as {
          requestedDataSource: "local" | "poe2db";
          activeDataSource: "local" | "poe2db";
          availableMods: IModType[];
        };
        setAvailableMods(json.availableMods);
        setActiveDataSource(json.activeDataSource);
        setSelectedModKeys(json.availableMods.map((modDefinition) => modDefinition.modKey));
      } catch {
        setError(t("error"));
        setAvailableMods([...MOD_POOL]);
        setActiveDataSource("local");
        setSelectedModKeys(MOD_POOL.map((modDefinition) => modDefinition.modKey));
      } finally {
        setLoadingMods(false);
      }
    };

    void loadMods();
  }, [dataSource, t]);

  const toggleModSelection = (modKey: string): void => {
    const current = new Set(selectedModKeys);
    if (current.has(modKey)) {
      current.delete(modKey);
    } else {
      current.add(modKey);
    }
    setSelectedModKeys(Array.from(current));
  };

  const runOptimization = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          dataSource,
          validModKeys: selectedModKeys,
          minTotalAffixes,
          requireTierOne,
          budgetChaos,
          trials,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = (await response.json()) as IOptimizationResponseType;
      setActiveDataSource(json.activeDataSource);
      setAvailableMods(json.availableMods);
      setResult(json);
    } catch {
      setError(t("error"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 dark:bg-black px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className="font-sc text-2xl font-bold text-zinc-950 dark:text-zinc-50">{t("title")}</h1>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 max-w-3xl">{t("intro")}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <Link
                href="/"
                className="text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
              >
                {t("navToSimulator")}
              </Link>
            </p>
          </div>
          <LocaleSwitcher />
        </header>

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm">
          <h2 className="font-sc text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            {t("inputs.title")}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {t("inputs.dataSource")}
              </span>
              <select
                value={dataSource}
                onChange={(event) => {
                  const next = event.target.value;
                  if (next === "local" || next === "poe2db") {
                    setDataSource(next);
                  }
                }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              >
                <option value="local">{t("inputs.dataSourceLocal")}</option>
                <option value="poe2db">{t("inputs.dataSourcePoe2db")}</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {t("inputs.budgetChaos")}
              </span>
              <input
                type="number"
                min={1}
                max={300}
                value={budgetChaos}
                onChange={(event) => {
                  const next = Number.parseInt(event.target.value, 10);
                  if (Number.isFinite(next)) {
                    setBudgetChaos(Math.min(300, Math.max(1, next)));
                  }
                }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {t("inputs.trials")}
              </span>
              <input
                type="number"
                min={100}
                max={30000}
                value={trials}
                onChange={(event) => {
                  const next = Number.parseInt(event.target.value, 10);
                  if (Number.isFinite(next)) {
                    setTrials(Math.min(30000, Math.max(100, next)));
                  }
                }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {t("inputs.minTotalAffixes")}
              </span>
              <input
                type="number"
                min={1}
                max={6}
                value={minTotalAffixes}
                onChange={(event) => {
                  const next = Number.parseInt(event.target.value, 10);
                  if (Number.isFinite(next)) {
                    setMinTotalAffixes(Math.min(6, Math.max(1, next)));
                  }
                }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex items-center gap-2 mt-5">
              <input
                type="checkbox"
                checked={requireTierOne}
                onChange={(event) => {
                  setRequireTierOne(event.target.checked);
                }}
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{t("inputs.requireTierOne")}</span>
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (isAllSelected) {
                  setSelectedModKeys([]);
                } else {
                  setSelectedModKeys(availableMods.map((modDefinition) => modDefinition.modKey));
                }
              }}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200"
            >
              {isAllSelected ? t("inputs.clearAllMods") : t("inputs.selectAllMods")}
            </button>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("inputs.selectedModCount", { count: selectedModKeys.length })}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
              <h3 className="font-sc text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                {t("inputs.prefixMods")}
              </h3>
              <div className="space-y-1.5">
                {modGroups.prefixes.map((modDefinition) => (
                  <label key={modDefinition.modKey} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedModKeys.includes(modDefinition.modKey)}
                      onChange={() => {
                        toggleModSelection(modDefinition.modKey);
                      }}
                    />
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {modDefinition.displayName} (T{modDefinition.tier})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
              <h3 className="font-sc text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                {t("inputs.suffixMods")}
              </h3>
              <div className="space-y-1.5">
                {modGroups.suffixes.map((modDefinition) => (
                  <label key={modDefinition.modKey} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedModKeys.includes(modDefinition.modKey)}
                      onChange={() => {
                        toggleModSelection(modDefinition.modKey);
                      }}
                    />
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {modDefinition.displayName} (T{modDefinition.tier})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              void runOptimization();
            }}
            disabled={loading || loadingMods}
            className="mt-5 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 disabled:opacity-50"
          >
            {loading || loadingMods ? t("inputs.optimizing") : t("inputs.run")}
          </button>
        </section>

        {error !== null && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {result !== null && (
          <section className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-5">
            <h2 className="font-sc text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
              {t("result.title")}
            </h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
              {t("result.bestStrategy", { name: result.result.bestStrategy.strategyLabel })}
            </p>
            {result.requestedDataSource !== result.activeDataSource && (
              <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                {t("result.fallbackDataSource")}
              </p>
            )}
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              {t("result.activeDataSource", {
                source:
                  activeDataSource === "poe2db"
                    ? t("inputs.dataSourcePoe2db")
                    : t("inputs.dataSourceLocal"),
              })}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
              {t("result.note")}
            </p>

            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                      {t("table.strategy")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                      {t("table.successRate")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                      {t("table.averageCost")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                      {t("table.costOnSuccess")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                      {t("table.expectedCostPerSuccess")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {result.result.strategies.map((strategy) => (
                    <tr key={strategy.strategyId} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40">
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                        {strategy.strategyLabel}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-800 dark:text-zinc-200">
                        {formatPercent(strategy.successRate)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-800 dark:text-zinc-200">
                        {strategy.averageCost.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-800 dark:text-zinc-200">
                        {formatCost(strategy.averageCostOnSuccess)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-800 dark:text-zinc-200">
                        {formatCost(strategy.expectedCostPerSuccess)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
