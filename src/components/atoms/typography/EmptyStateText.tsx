"use client";

import type { ReactElement, ReactNode } from "react";

type EmptyStateTextPropsType = {
  children: ReactNode;
};

export const EmptyStateText = ({
  children,
}: EmptyStateTextPropsType): ReactElement => {
  return <p className="py-1 text-sm text-zinc-400 dark:text-zinc-500">{children}</p>;
};
