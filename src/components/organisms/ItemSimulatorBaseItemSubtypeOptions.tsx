"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import type { IBaseItemSubTypeType } from "@/lib/poe2-item-simulator/baseItemDb";

type ItemSimulatorBaseItemSubtypeOptionsPropsType = {
  allLabel: string;
  subTypes: readonly IBaseItemSubTypeType[];
};

export const ItemSimulatorBaseItemSubtypeOptions = ({
  allLabel,
  subTypes,
}: ItemSimulatorBaseItemSubtypeOptionsPropsType): ReactElement => {
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
