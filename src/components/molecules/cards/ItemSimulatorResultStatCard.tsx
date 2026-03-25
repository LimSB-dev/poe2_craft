"use client";

import type { ReactElement, ReactNode } from "react";

type ItemSimulatorResultStatCardPropsType = {
  label: string;
  value: ReactNode;
};

export const ItemSimulatorResultStatCard = ({
  label,
  value,
}: ItemSimulatorResultStatCardPropsType): ReactElement => {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-700 dark:bg-zinc-900/40">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
};
