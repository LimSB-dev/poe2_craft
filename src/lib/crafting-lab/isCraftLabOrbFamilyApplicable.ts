import {
  canApplyChaosOrb,
  canApplyExaltedOrb,
  canApplyFracturingOrb,
  canApplyOrbOfAlchemy,
  canApplyOrbOfAnnulment,
  canApplyOrbOfAugmentation,
  canApplyOrbOfTransmutation,
  canApplyRegalOrb,
} from "@/lib/poe2-item-simulator/currency";

import {
  type CraftingLabOrbSlotIdType,
  type CraftingOrbFamilyIdType,
  orbSlotIdToFamilyKind,
} from "@/lib/crafting-lab/craftingLabCurrencyIds";
import { isCraftLabOrbSlotItemLevelAllowed } from "@/lib/crafting-lab/craftLabOrbTierItemLevel";

/**
 * Whether the given orb **family** can be used on `roll` (same rules as `canApply*` in the simulator).
 */
export const isCraftLabOrbFamilyApplicable = (
  family: CraftingOrbFamilyIdType,
  roll: IItemRoll,
): boolean => {
  switch (family) {
    case "orb_transmutation": {
      return canApplyOrbOfTransmutation(roll);
    }
    case "orb_augmentation": {
      return canApplyOrbOfAugmentation(roll);
    }
    case "orb_regal": {
      return canApplyRegalOrb(roll);
    }
    case "orb_alchemy": {
      return canApplyOrbOfAlchemy(roll);
    }
    case "orb_exalted": {
      return canApplyExaltedOrb(roll);
    }
    case "orb_fracturing": {
      return canApplyFracturingOrb(roll);
    }
    case "orb_chaos": {
      return canApplyChaosOrb(roll);
    }
    case "orb_annulment": {
      return canApplyOrbOfAnnulment(roll);
    }
    default: {
      return false;
    }
  }
};

/**
 * 티어 슬롯 id → 패밀리 규칙 + (옵션) 아이템 레벨이 해당 티어 오브 최소 ilvl을 만족하는지.
 * `itemLevel` 생략 시 티어 ilvl 제한은 적용하지 않음(테스트·레거시 호출 호환).
 */
export const isCraftLabOrbSlotApplicable = (
  id: CraftingLabOrbSlotIdType,
  roll: IItemRoll,
  itemLevel?: number,
): boolean => {
  if (!isCraftLabOrbFamilyApplicable(orbSlotIdToFamilyKind(id), roll)) {
    return false;
  }
  if (itemLevel === undefined) {
    return true;
  }
  return isCraftLabOrbSlotItemLevelAllowed(id, itemLevel);
};
