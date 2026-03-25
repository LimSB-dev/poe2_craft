"use client";

import type { ReactElement } from "react";

type ItemSimulatorPanelHeaderPropsType = {
  title: string;
  description: string;
};

export const ItemSimulatorPanelHeader = ({
  title,
  description,
}: ItemSimulatorPanelHeaderPropsType): ReactElement => {
  return (
    <header className="flex flex-col gap-1">
      <h2 className="font-sc text-base font-semibold text-zinc-950 dark:text-zinc-50">
        {title}
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </header>
  );
};

