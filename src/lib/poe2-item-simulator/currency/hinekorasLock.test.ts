import {
  applyHinekorasLock,
  canApplyHinekorasLock,
} from "@/lib/poe2-item-simulator/currency/hinekorasLock";
import { CORRUPTED_ITEM_STANDARD_CRAFTING_ERROR_MESSAGE } from "@/lib/poe2-item-simulator/itemCorruptionCraftingGuard";
import type { IItemRoll } from "@/types/poe2-item-simulator";

describe("hinekorasLock", () => {
  test("canApplyHinekorasLock: false when corrupted or lock already active", () => {
    const base: IItemRoll = {
      rarity: "normal",
      prefixes: [],
      suffixes: [],
    };
    expect(canApplyHinekorasLock(base)).toBe(true);
    expect(
      canApplyHinekorasLock({
        ...base,
        isCorrupted: true,
      }),
    ).toBe(false);
    expect(
      canApplyHinekorasLock({
        ...base,
        hinekoraLockActive: true,
      }),
    ).toBe(false);
  });

  test("applyHinekorasLock throws on corrupted item", () => {
    expect(() => {
      applyHinekorasLock({
        rarity: "normal",
        prefixes: [],
        suffixes: [],
        isCorrupted: true,
      });
    }).toThrow(CORRUPTED_ITEM_STANDARD_CRAFTING_ERROR_MESSAGE);
  });
});
