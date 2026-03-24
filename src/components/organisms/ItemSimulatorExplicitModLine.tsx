"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { SimulatorModTemplateText } from "@/components/organisms/SimulatorModTemplateText";
import type { IModDefinition } from "@/types/poe2-item-simulator";

type ItemSimulatorExplicitModLinePropsType = {
  modDefinition: IModDefinition;
  /** 미공개 타락 줄 클릭(크래프트 랩 등) */
  onUnrevealedDesecratedActivate?: () => void;
  unrevealedDesecratedDisabled?: boolean;
};

/**
 * 에센스 강제 옵션은 `displayName`이 평문이고, DB 롤은 `nameTemplateKey`를 씁니다.
 */
export const ItemSimulatorExplicitModLine = ({
  modDefinition,
  onUnrevealedDesecratedActivate,
  unrevealedDesecratedDisabled = false,
}: ItemSimulatorExplicitModLinePropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorWorkspace");

  if (modDefinition.modKey.startsWith("essence_forced_")) {
    return <span>{modDefinition.displayName}</span>;
  }
  if (modDefinition.modKey.startsWith("desecrated_unrevealed")) {
    const interactive =
      onUnrevealedDesecratedActivate !== undefined && !unrevealedDesecratedDisabled;
    const label = t("explicitMod.desecratedUnrevealed");
    const aria = t("explicitMod.desecratedUnrevealedAria");
    if (interactive) {
      return (
        <button
          type="button"
          onClick={() => {
            onUnrevealedDesecratedActivate();
          }}
          className="font-mono text-emerald-400 tracking-[0.18em] underline underline-offset-2 decoration-emerald-500/70 hover:text-emerald-300"
          aria-label={aria}
        >
          {label}
        </button>
      );
    }
    return (
      <span
        className="font-mono text-emerald-400 tracking-[0.18em]"
        aria-label={aria}
      >
        {label}
      </span>
    );
  }
  if (modDefinition.modKey.startsWith("desecrated_family_")) {
    return (
      <span className="text-emerald-300">
        {t(`explicitMod.${modDefinition.displayName}`)}
      </span>
    );
  }
  return <SimulatorModTemplateText nameTemplateKey={modDefinition.displayName} />;
};
