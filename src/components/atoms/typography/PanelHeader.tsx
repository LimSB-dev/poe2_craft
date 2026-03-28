"use client";

import type { ReactElement } from "react";

type PanelHeaderPropsType = {
  title: string;
  description: string;
  /** When set, applied to the `h2` (e.g. section `aria-labelledby`). */
  titleId?: string;
};

export const PanelHeader = ({
  title,
  description,
  titleId,
}: PanelHeaderPropsType): ReactElement => {
  return (
    <header className="flex flex-col gap-1">
      <h2
        id={titleId}
        className="font-sc text-base font-semibold text-zinc-950 dark:text-zinc-50"
      >
        {title}
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </header>
  );
};
