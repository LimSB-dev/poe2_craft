"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

type CatalogItemClassLabelPropsType = {
  itemClassKey: string;
  className?: string;
};

export const CatalogItemClassLabel = ({
  itemClassKey,
  className,
}: CatalogItemClassLabelPropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorCatalog");
  return <span className={className}>{t(`itemClass.${itemClassKey}`)}</span>;
};
