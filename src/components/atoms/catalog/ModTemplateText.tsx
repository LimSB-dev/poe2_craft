"use client";

import { useTranslations } from "next-intl";
import { Fragment, type ReactElement } from "react";

import { buildModStatDisplayLines } from "@/lib/poe2-item-simulator/modDbTierDisplay";

type ModTemplateTextPropsType = {
  nameTemplateKey: string;
  className?: string;
  /** 있으면 i18n 템플릿의 `#`를 티어 수치로 치환한다. */
  statRanges?: ReadonlyArray<{ min: number; max: number }>;
};

export const ModTemplateText = ({
  nameTemplateKey,
  className,
  statRanges,
}: ModTemplateTextPropsType): ReactElement => {
  const t = useTranslations("simulator");
  const template = (() => {
    try {
      return t(`mods.${nameTemplateKey}` as never);
    } catch {
      return nameTemplateKey;
    }
  })();

  if (statRanges !== undefined && statRanges.length > 0) {
    const { lines, isPending } = buildModStatDisplayLines(template, statRanges);
    if (!isPending && lines.length > 0) {
      return (
        <span className={className}>
          {lines.map((line, lineIndex) => {
            return (
              <Fragment key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {line}
              </Fragment>
            );
          })}
        </span>
      );
    }
  }

  return <span className={className}>{template}</span>;
};
