"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

type SimulatorModTemplateTextPropsType = {
  nameTemplateKey: string;
  className?: string;
};

/**
 * mod DB의 `nameTemplateKey` → `simulator.mods` 번역. 속성 패널 전용 리프 (단일 훅).
 */
export const SimulatorModTemplateText = ({
  nameTemplateKey,
  className,
}: SimulatorModTemplateTextPropsType): ReactElement => {
  const t = useTranslations("simulator.mods");
  return <span className={className}>{t(nameTemplateKey)}</span>;
};
