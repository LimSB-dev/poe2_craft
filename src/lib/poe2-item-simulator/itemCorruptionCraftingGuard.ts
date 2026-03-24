import type { IItemRoll } from "./types";

/**
 * PoE2-style rule for this simulator: while `isCorrupted` is set, **standard** crafting
 * (basic orbs, essences, preserved bone) cannot change the item.
 *
 * Exceptions live next to those flows (e.g. Omen of Light: annul **desecrated** lines only).
 */
export const CORRUPTED_ITEM_STANDARD_CRAFTING_ERROR_MESSAGE: string =
  "Corrupted items cannot be modified with this currency in the simulator.";

export const isCorruptedRoll = (item: IItemRoll): boolean => {
  return item.isCorrupted === true;
};

/**
 * Use at the start of `apply*` implementations that mirror `canApply*` with corruption blocked.
 */
export const assertRollNotCorruptedForStandardCrafting = (item: IItemRoll): void => {
  if (isCorruptedRoll(item)) {
    throw new Error(CORRUPTED_ITEM_STANDARD_CRAFTING_ERROR_MESSAGE);
  }
};
