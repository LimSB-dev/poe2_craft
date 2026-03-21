"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

type ItemSimulatorCatalogBaseNamePropsType = {
  baseItemKey: string;
  className?: string;
};

/**
 * 아이템 시뮬레이터 전용 베이스 아이템 표시명 — `simulator.itemSimulatorCatalog` 단일 네임스페이스.
 */
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
