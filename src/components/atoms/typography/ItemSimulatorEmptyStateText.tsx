"use client";

import type { ReactElement, ReactNode } from "react";

type ItemSimulatorEmptyStateTextPropsType = {
  children: ReactNode;
};

export const ItemSimulatorEmptyStateText = ({
  children,
}: ItemSimulatorEmptyStateTextPropsType): ReactElement => {
  return <p className="py-1 text-sm text-zinc-400 dark:text-zinc-500">{children}</p>;
};

