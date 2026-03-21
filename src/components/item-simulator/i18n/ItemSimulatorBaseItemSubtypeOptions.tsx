"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import type { IBaseItemSubTypeType } from "@/lib/poe2-item-simulator/baseItemDb";

type ItemSimulatorBaseItemSubtypeOptionsPropsType = {
  allLabel: string;
  subTypes: readonly IBaseItemSubTypeType[];
};

/**
 * 베이스 필터 `<select>` 옵션 — `itemClass.*`는 카탈로그 네임스페이스만 사용 (부모는 `allLabel`만 전달).
 */
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
