import {
  canApplyPreservedBone,
  getBoneDefinition,
} from "@/lib/poe2-item-simulator/abyss/abyssCrafting";
import { ATTACK_ESSENCE, canApplyEssence } from "@/lib/poe2-item-simulator/essence/essence";
import { isCraftLabOrbSlotApplicable } from "@/lib/crafting-lab/isCraftLabOrbFamilyApplicable";
import type { IItemRoll } from "@/lib/poe2-item-simulator/types";

describe("crafting material applicability (essence, abyss bone, craft-lab orb slot)", () => {
  test("canApplyEssence: rejects corrupted magic item", () => {
    const item: IItemRoll = {
      rarity: "magic",
      prefixes: [{ modKey: "x", displayName: "x", tier: 1, modType: "prefix", weight: 1 }],
      suffixes: [],
      isCorrupted: true,
    };
    expect(canApplyEssence(item, ATTACK_ESSENCE, { baseItemSubType: "oneHandSword" })).toBe(
      false,
    );
  });

  test("canApplyPreservedBone: rejects corrupted rare even when slot matches", () => {
    const bone = getBoneDefinition("bone_preserved_rib");
    expect(bone).toBeDefined();
    if (bone === undefined) {
      return;
    }
    const item: IItemRoll = {
      rarity: "rare",
      prefixes: [],
      suffixes: [],
      isCorrupted: true,
    };
    expect(canApplyPreservedBone(item, bone, { baseItemSubType: "bodyArmour" })).toBe(false);
  });

  test("isCraftLabOrbSlotApplicable: corrupted rare blocks chaos tier slot", () => {
    const roll: IItemRoll = {
      rarity: "rare",
      prefixes: [{ modKey: "a", displayName: "a", tier: 1, modType: "prefix", weight: 1 }],
      suffixes: [{ modKey: "b", displayName: "b", tier: 1, modType: "suffix", weight: 1 }],
      isCorrupted: true,
    };
    expect(isCraftLabOrbSlotApplicable("orb_chaos_t1", roll)).toBe(false);
  });
});
