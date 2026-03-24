"use client";

import type { ReactElement } from "react";

import type { ModTypeType } from "@/types/poe2-item-simulator";

type ItemSimulatorModTypeBadgePropsType = {
  modType: ModTypeType;
  label: string;
};

const MOD_TYPE_BADGE_CLASSES: Record<ModTypeType, string> = {
  prefix: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  suffix: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  corruptedPrefix: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  corruptedSuffix:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

export const ItemSimulatorModTypeBadge = ({
  modType,
  label,
}: ItemSimulatorModTypeBadgePropsType): ReactElement => {
  return (
    <span
      className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium ${MOD_TYPE_BADGE_CLASSES[modType]}`}
    >
      {label}
    </span>
  );
};
