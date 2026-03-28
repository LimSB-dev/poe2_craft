"use client";

import type { ReactElement } from "react";

type ActionMixBarRowPropsType = {
  label: string;
  percentText: string;
};

export const ActionMixBarRow = ({
  label,
  percentText,
}: ActionMixBarRowPropsType): ReactElement => {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
        <span>{label}</span>
        <span className="tabular-nums">{percentText}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-amber-500/90"
          style={{ width: percentText }}
        />
      </div>
    </div>
  );
};
