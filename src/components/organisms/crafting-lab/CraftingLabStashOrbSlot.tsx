"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { CraftingLabOrbSlotButton } from "@/components/molecules";
import { getCraftingLabCurrencyIconUrl } from "@/lib/crafting-lab/craftingLabCurrencyIconUrls";
import {
  getOrbSlotTierRoman,
  orbSlotIdToFamilyKind,
  type CraftingCurrencyIdType,
  type CraftingLabOrbSlotIdType,
} from "@/lib/crafting-lab/craftingLabCurrencyIds";
import { CRAFT_LAB_ORB_APPLY } from "@/lib/crafting-lab/craftLabOrbApplyMap";
import {
  applyChaosOrbWithWhittling,
  applyOrbOfAnnulmentDesecratedOnly,
} from "@/lib/poe2-item-simulator/currency";
import type { CraftLabStagedOmenIdType } from "@/lib/poe2-item-simulator/craftLabStagedOmen";
import type { IModRollBaseFiltersType } from "@/lib/poe2-item-simulator/roller";

type CraftLabModeType = "random" | "simulation";

type CraftLabTryApplyOptionsType = {
  clearActiveStagedOmenId?: CraftLabStagedOmenIdType;
};

export type CraftingLabStashOrbSlotPropsType = {
  slotId: CraftingLabOrbSlotIdType;
  itemRoll: IItemRoll;
  craftLabMode: CraftLabModeType;
  modRollFilters: IModRollBaseFiltersType | undefined;
  hasStagedLightOmen: boolean;
  hasStagedWhittlingOmen: boolean;
  /** `undefined`이면 슬롯 사용 가능. */
  getOrbSlotDisabledReason: (
    id: CraftingLabOrbSlotIdType,
    roll: IItemRoll,
  ) => string | undefined;
  tryApply: (
    id: CraftingCurrencyIdType,
    apply: (
      roll: IItemRoll,
      filters: IModRollBaseFiltersType | undefined,
    ) => IItemRoll,
    options?: CraftLabTryApplyOptionsType,
  ) => void;
  onSimulationOrbUse: (slotId: CraftingLabOrbSlotIdType, currencyName: string) => void;
  onOrbBlockedMessage: (message: string) => void;
  onOrbHoverChange: (currencyId: CraftingCurrencyIdType, hovered: boolean) => void;
};

export const CraftingLabStashOrbSlot = ({
  slotId,
  itemRoll,
  craftLabMode,
  modRollFilters,
  hasStagedLightOmen,
  hasStagedWhittlingOmen,
  getOrbSlotDisabledReason,
  tryApply,
  onSimulationOrbUse,
  onOrbBlockedMessage,
  onOrbHoverChange,
}: CraftingLabStashOrbSlotPropsType): ReactElement => {
  const t = useTranslations("simulator");
  const orbBlockedReason = getOrbSlotDisabledReason(slotId, itemRoll);
  const applicable = orbBlockedReason === undefined;
  const family = orbSlotIdToFamilyKind(slotId);
  const applyOrb =
    family === "orb_annulment" && hasStagedLightOmen
      ? (roll: IItemRoll, filters: IModRollBaseFiltersType | undefined) => {
          void filters;
          return applyOrbOfAnnulmentDesecratedOnly(roll);
        }
      : family === "orb_chaos" && hasStagedWhittlingOmen
        ? (roll: IItemRoll, filters: IModRollBaseFiltersType | undefined) => {
            return applyChaosOrbWithWhittling(roll, filters);
          }
        : CRAFT_LAB_ORB_APPLY[family];
  const orbCommitOpts =
    family === "orb_annulment" && hasStagedLightOmen
      ? { clearActiveStagedOmenId: "omen_light" as const }
      : family === "orb_chaos" && hasStagedWhittlingOmen
        ? { clearActiveStagedOmenId: "omen_whittling" as const }
        : undefined;
  const name = t(`craftLab.currency.${slotId}`);
  const hoverHint = t(`craftLab.currencyHoverHint.${slotId}`);
  const iconSrc = getCraftingLabCurrencyIconUrl(slotId);
  const tierRoman = getOrbSlotTierRoman(slotId);

  return (
    <CraftingLabOrbSlotButton
      iconSrc={iconSrc}
      applicable={applicable}
      currencyName={name}
      hoverHint={hoverHint}
      disabledReason={orbBlockedReason}
      onBlockedClick={() => {
        if (orbBlockedReason !== undefined) {
          onOrbBlockedMessage(orbBlockedReason);
        }
      }}
      onUse={() => {
        if (craftLabMode === "simulation") {
          if (!applicable) {
            return;
          }
          onSimulationOrbUse(slotId, name);
          return;
        }
        tryApply(slotId, applyOrb, orbCommitOpts);
      }}
      onHoverChange={(hovered) => {
        onOrbHoverChange(slotId, hovered);
      }}
      tierRoman={tierRoman}
      ariaLabel={
        applicable
          ? craftLabMode === "simulation"
            ? t("craftLab.orbSimulateAria", { name })
            : name
          : t("craftLab.orbDisabledAria", { name })
      }
      showQuantityBadge={applicable}
      quantityLabel={t("craftLab.stashOrbQuantityUnlimited")}
      strongDisabled={slotId === "orb_fracturing" && !applicable}
    />
  );
};
