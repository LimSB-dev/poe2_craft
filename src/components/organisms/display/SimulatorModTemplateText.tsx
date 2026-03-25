"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

type SimulatorModTemplateTextPropsType = {
  nameTemplateKey: string;
  className?: string;
};

export const SimulatorModTemplateText = ({
  nameTemplateKey,
  className,
}: SimulatorModTemplateTextPropsType): ReactElement => {
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
