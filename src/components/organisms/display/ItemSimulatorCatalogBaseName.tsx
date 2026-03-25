"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

type ItemSimulatorCatalogBaseNamePropsType = {
  baseItemKey: string;
  className?: string;
};

export const ItemSimulatorCatalogBaseName = ({
  baseItemKey,
  className,
}: ItemSimulatorCatalogBaseNamePropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorCatalog");
  let label: string;
  try {
    label = t(`baseItems.${baseItemKey}.name`);
  } catch {
    label = baseItemKey;
  }
  return <span className={className}>{label}</span>;
};
