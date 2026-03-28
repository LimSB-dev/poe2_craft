"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

type BaseItemSubtypeOptionsPropsType = {
  allLabel: string;
  subTypes: readonly IBaseItemSubTypeType[];
};

export const BaseItemSubtypeOptions = ({
  allLabel,
  subTypes,
}: BaseItemSubtypeOptionsPropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorCatalog");
  return (
    <>
      <option value="all">{allLabel}</option>
      {subTypes.map((subType) => {
        return (
          <option key={subType} value={subType}>
            {t(`itemClass.${subType}`)}
          </option>
        );
      })}
    </>
  );
};
