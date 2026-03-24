"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

type ItemSimulatorCatalogItemClassLabelPropsType = {
  itemClassKey: string;
  className?: string;
};

export const ItemSimulatorCatalogItemClassLabel = ({
  itemClassKey,
  className,
}: ItemSimulatorCatalogItemClassLabelPropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorCatalog");
  return <span className={className}>{t(`itemClass.${itemClassKey}`)}</span>;
};
