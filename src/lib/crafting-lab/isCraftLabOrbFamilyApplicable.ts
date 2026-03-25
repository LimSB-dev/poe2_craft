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
} from "./craftingLabCurrencyIds";

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

/** Tiered slot id → same applicability as its orb family. */
export const isCraftLabOrbSlotApplicable = (
  id: CraftingLabOrbSlotIdType,
  roll: IItemRoll,
): boolean => {
  return isCraftLabOrbFamilyApplicable(orbSlotIdToFamilyKind(id), roll);
};
