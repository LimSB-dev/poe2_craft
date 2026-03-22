"use client";

import type { ReactElement } from "react";

import { SimulatorModTemplateText } from "@/components/item-simulator/i18n/SimulatorModTemplateText";
import type { IModDefinition } from "@/lib/poe2-item-simulator/types";

type ItemSimulatorExplicitModLinePropsType = {
  modDefinition: IModDefinition;
};

/**
 * 에센스 강제 옵션은 `displayName`이 평문이고, DB 롤은 `nameTemplateKey`를 씁니다.
 */
export const ItemSimulatorExplicitModLine = ({
  modDefinition,
}: ItemSimulatorExplicitModLinePropsType): ReactElement => {
  if (modDefinition.modKey.startsWith("essence_forced_")) {
    return <span>{modDefinition.displayName}</span>;
  }
  return <SimulatorModTemplateText nameTemplateKey={modDefinition.displayName} />;
};
