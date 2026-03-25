"use client";

import type { ReactElement } from "react";

export type IStrategyRateRowType = {
  strategyId: string;
  label: string;
  successRate: number;
};

type StrategySuccessRateChartPropsType = {
  title: string;
  rows: ReadonlyArray<IStrategyRateRowType>;
  formatPercent: (rate: number) => string;
};

export const StrategySuccessRateChart = ({
  title,
  rows,
  formatPercent,
}: StrategySuccessRateChartPropsType): ReactElement => {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <ul className="flex flex-col gap-4" aria-label={title}>
        {rows.map((row) => {
          const widthPercent = Math.min(100, Math.max(0, row.successRate * 100));
          return (
            <li key={row.strategyId} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {row.label}
                </span>
                <span className="tabular-nums shrink-0">{formatPercent(row.successRate)}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-amber-500/90 dark:bg-amber-500/80 transition-[width] duration-300 ease-out"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
