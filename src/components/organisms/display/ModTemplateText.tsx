"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

type ModTemplateTextPropsType = {
  nameTemplateKey: string;
  className?: string;
};

export const ModTemplateText = ({
  nameTemplateKey,
  className,
}: ModTemplateTextPropsType): ReactElement => {
  const t = useTranslations("simulator");
  const text = (() => {
    try {
      return t(`mods.${nameTemplateKey}` as never);
    } catch {
      return nameTemplateKey;
    }
  })();
  return <span className={className}>{text}</span>;
};
