"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

type CatalogBaseNamePropsType = {
  baseItemKey: string;
  className?: string;
};

export const CatalogBaseName = ({
  baseItemKey,
  className,
}: CatalogBaseNamePropsType): ReactElement => {
  const t = useTranslations("simulator");
  let label: string;
  try {
    label = t(`baseItems.${baseItemKey}.name`);
  } catch {
    label = baseItemKey;
  }
  return <span className={className}>{label}</span>;
};
