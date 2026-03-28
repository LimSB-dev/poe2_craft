"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { CraftingLabOrbSlotButton } from "@/components/molecules";
import { getCraftingLabCurrencyIconUrl } from "@/lib/crafting-lab/craftingLabCurrencyIconUrls";
import {
  canApplyPreservedBone,
  getBoneDefinition,
  type CraftLabAbyssBoneIdType,
} from "@/lib/poe2-item-simulator/abyss/abyssCrafting";
import type { IModRollBaseFiltersType } from "@/lib/poe2-item-simulator/roller";

type CraftLabModeType = "random" | "simulation";

export type CraftingLabStashAbyssBoneSlotPropsType = {
  boneId: CraftLabAbyssBoneIdType;
  itemRoll: IItemRoll;
  craftLabMode: CraftLabModeType;
  modRollFilters: IModRollBaseFiltersType | undefined;
  onStashMessage: (message: string) => void;
  onUsePreservedBone: (boneId: CraftLabAbyssBoneIdType) => void;
  onBoneHoverChange: (hovered: boolean) => void;
};

export const CraftingLabStashAbyssBoneSlot = ({
  boneId,
  itemRoll,
  craftLabMode,
  modRollFilters,
  onStashMessage,
  onUsePreservedBone,
  onBoneHoverChange,
}: CraftingLabStashAbyssBoneSlotPropsType): ReactElement | null => {
  const t = useTranslations("simulator");
  const boneDef = getBoneDefinition(boneId);
  if (boneDef === undefined) {
    return null;
  }
  const name = t(`craftLab.currency.${boneId}`);
  const hoverHint = t(`craftLab.currencyHoverHint.${boneId}`);
  const boneOk = canApplyPreservedBone(itemRoll, boneDef, modRollFilters);
  const boneDisabledInRandom = craftLabMode !== "random" || !boneOk;
  const boneDisabledTitle = boneDisabledInRandom
    ? !boneOk
      ? itemRoll.rarity !== "rare"
        ? t("craftLab.boneRequiresRare")
        : itemRoll.isCorrupted === true
          ? t("craftLab.boneCorrupted")
          : t("craftLab.boneWrongSlotOrFull")
      : t("craftLab.boneRequiresRandomMode")
    : undefined;

  return (
    <CraftingLabOrbSlotButton
      iconSrc={getCraftingLabCurrencyIconUrl(boneId)}
      applicable={!boneDisabledInRandom}
      currencyName={name}
      hoverHint={hoverHint}
      disabledReason={boneDisabledTitle}
      onBlockedClick={() => {
        if (boneDisabledTitle !== undefined) {
          onStashMessage(boneDisabledTitle);
        }
      }}
      onUse={() => {
        onUsePreservedBone(boneId);
      }}
      onHoverChange={(hovered) => {
        onBoneHoverChange(hovered);
      }}
      tierRoman={null}
      ariaLabel={boneDisabledInRandom ? t("craftLab.orbDisabledAria", { name }) : name}
      showQuantityBadge
      quantityLabel={t("craftLab.stashOrbQuantityUnlimited")}
    />
  );
};
