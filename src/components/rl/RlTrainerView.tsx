"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReactElement } from "react";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { Link } from "@/lib/i18n/navigation";
import type { IRlTrainResponseType } from "@/lib/rl/rlTrainApiTypes";

const toPercent = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

export const RlTrainerView = (): ReactElement => {
  const t = useTranslations("simulator.rlView");
  const [desiredGoodMods, setDesiredGoodMods] = useState<number>(3);
  const [budget, setBudget] = useState<number>(80);
  const [episodes, setEpisodes] = useState<number>(3000);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IRlTrainResponseType | null>(null);

  const handleTrain = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/rl-train", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ desiredGoodMods, budget, episodes }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as IRlTrainResponseType;
      setResult(data);
    } catch {
      setError(t("error"));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const actionLabel = (action: "chaos" | "essence" | "stop"): string => {
    return t(`actions.${action}`);
  };

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 dark:bg-black px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-5xl flex flex-col gap-6">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {t("inputs.desiredGoodMods")}
              </span>
              <input
                type="number"
                min={1}
                max={6}
                value={desiredGoodMods}
                onChange={(event) => {
                  const next = Number.parseInt(event.target.value, 10);
                  if (Number.isFinite(next)) {
                    setDesiredGoodMods(Math.min(6, Math.max(1, next)));
                  }
                }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {t("inputs.budget")}
              </span>
              <input
                type="number"
                min={1}
                max={200}
                value={budget}
                onChange={(event) => {
                  const next = Number.parseInt(event.target.value, 10);
                  if (Number.isFinite(next)) {
                    setBudget(Math.min(200, Math.max(1, next)));
                  }
                }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {t("inputs.episodes")}
              </span>
              <input
                type="number"
                min={200}
                max={20000}
                value={episodes}
                onChange={(event) => {
                  const next = Number.parseInt(event.target.value, 10);
                  if (Number.isFinite(next)) {
                    setEpisodes(Math.min(20000, Math.max(200, next)));
                  }
                }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => {
              void handleTrain();
            }}
            disabled={loading}
            className="mt-4 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 disabled:opacity-50"
          >
            {loading ? t("inputs.training") : t("inputs.run")}
          </button>
        </section>

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm">
          <h2 className="font-sc text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            {t("definition.title")}
          </h2>
          <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
            <li>{t("definition.state")}</li>
            <li>{t("definition.action")}</li>
            <li>{t("definition.reward")}</li>
          </ul>
        </section>

        {error !== null && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {result !== null && (
          <section className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-5">
            <h2 className="font-sc text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              {t("result.title")}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/40 p-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("result.meanReward")}</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                  {result.summary.meanReward.toFixed(4)}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/40 p-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("result.last10Reward")}</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                  {result.summary.last10AverageReward.toFixed(4)}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/40 p-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t("result.bestInitialAction")}
                </p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {actionLabel(result.summary.bestInitialAction)}
                </p>
              </div>
            </div>

            <h3 className="font-sc text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              {t("result.actionRatio")}
            </h3>
            <div className="space-y-3">
              {(
                [
                  { key: "chaos", value: result.summary.actionRatio.chaos },
                  { key: "essence", value: result.summary.actionRatio.essence },
                  { key: "stop", value: result.summary.actionRatio.stop },
                ] as const
              ).map((row) => (
                <div key={row.key}>
                  <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                    <span>{t(`actions.${row.key}`)}</span>
                    <span className="tabular-nums">{toPercent(row.value)}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500/90" style={{ width: toPercent(row.value) }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
