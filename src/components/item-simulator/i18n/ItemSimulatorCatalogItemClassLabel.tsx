"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

type ItemSimulatorCatalogItemClassLabelPropsType = {
  itemClassKey: string;
  className?: string;
};

/**
 * 아이템 시뮬레이터 전용 장비 유형 라벨 — `simulator.itemSimulatorCatalog` 단일 네임스페이스.
 */
export const ItemSimulatorCatalogItemClassLabel = ({
  itemClassKey,
  className,
}: ItemSimulatorCatalogItemClassLabelPropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorCatalog");
  return <span className={className}>{t(`itemClass.${itemClassKey}`)}</span>;
};
