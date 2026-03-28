"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { CraftingLabOrbSlotButton } from "@/components/molecules";
import {
  CraftingLabStashOrbSlot,
  type CraftingLabStashOrbSlotPropsType,
} from "@/components/organisms/crafting-lab/CraftingLabStashOrbSlot";
import { getCraftingLabCurrencyIconUrl } from "@/lib/crafting-lab/craftingLabCurrencyIconUrls";
import type { CraftingCurrencyIdType } from "@/lib/crafting-lab/craftingLabCurrencyIds";
import { getCraftLabDisabledCurrencyRowTooltip } from "@/lib/crafting-lab/craftLabDisabledCurrencyTooltips";
import { applyHinekorasLock, canApplyHinekorasLock } from "@/lib/poe2-item-simulator/currency/hinekorasLock";

type CraftingLabStashMiscCurrencySlotPropsType = {
  currencyId: CraftingCurrencyIdType;
  orbSlotProps: Omit<CraftingLabStashOrbSlotPropsType, "slotId">;
  tryApply: CraftingLabStashOrbSlotPropsType["tryApply"];
  craftLabMode: CraftingLabStashOrbSlotPropsType["craftLabMode"];
  setLastError: (message: string) => void;
  onOrbBlockedMessage: CraftingLabStashOrbSlotPropsType["onOrbBlockedMessage"];
  onOrbHoverChange: CraftingLabStashOrbSlotPropsType["onOrbHoverChange"];
};

export const CraftingLabStashMiscCurrencySlot = ({
  currencyId,
  orbSlotProps,
  tryApply,
  craftLabMode,
  setLastError,
  onOrbBlockedMessage,
  onOrbHoverChange,
}: CraftingLabStashMiscCurrencySlotPropsType): ReactElement => {
  const t = useTranslations("simulator");

  if (
    currencyId === "orb_alchemy" ||
    currencyId === "orb_annulment" ||
    currencyId === "orb_fracturing"
  ) {
    return <CraftingLabStashOrbSlot slotId={currencyId} {...orbSlotProps} />;
  }

  const iconSrc = getCraftingLabCurrencyIconUrl(currencyId);
  const name = t(`craftLab.currency.${currencyId}`);
  const hoverHint = t(`craftLab.currencyHoverHint.${currencyId}`);

  if (currencyId === "orb_hinekoras_lock") {
    const { itemRoll } = orbSlotProps;
    const hinekoraApplicable = canApplyHinekorasLock(itemRoll);
    const hinekoraBlockedReason = hinekoraApplicable
      ? undefined
      : t("craftLab.hinekoraLockAlreadyActive");
    return (
      <CraftingLabOrbSlotButton
        iconSrc={iconSrc}
        applicable={hinekoraApplicable}
        currencyName={name}
        hoverHint={hoverHint}
        disabledReason={hinekoraBlockedReason}
        onBlockedClick={() => {
          if (hinekoraBlockedReason !== undefined) {
            onOrbBlockedMessage(hinekoraBlockedReason);
          }
        }}
        onUse={() => {
          if (craftLabMode === "simulation") {
            setLastError(t("craftLab.hinekoraLockNoSimPreview"));
            return;
          }
          tryApply("orb_hinekoras_lock", (roll) => {
            return applyHinekorasLock(roll);
          });
        }}
        onHoverChange={(hovered) => {
          onOrbHoverChange("orb_hinekoras_lock", hovered);
        }}
        tierRoman={null}
        ariaLabel={
          hinekoraApplicable ? name : t("craftLab.orbDisabledAria", { name })
        }
        showQuantityBadge={hinekoraApplicable}
        quantityLabel={t("craftLab.stashOrbQuantityUnlimited")}
      />
    );
  }

  const rowDisabledReason = getCraftLabDisabledCurrencyRowTooltip(currencyId, t);
  return (
    <CraftingLabOrbSlotButton
      iconSrc={iconSrc}
      applicable={false}
      currencyName={name}
      hoverHint={hoverHint}
      disabledReason={rowDisabledReason}
      onBlockedClick={() => {
        onOrbBlockedMessage(rowDisabledReason);
      }}
      onUse={() => {}}
      onHoverChange={(hovered) => {
        onOrbHoverChange(currencyId, hovered);
      }}
      tierRoman={null}
      ariaLabel={name}
      showQuantityBadge={false}
      quantityLabel=""
    />
  );
};
