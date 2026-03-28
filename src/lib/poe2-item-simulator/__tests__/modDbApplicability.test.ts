import { isRecordEligibleForBaseFilters } from "@/lib/poe2-item-simulator/roller";
import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";

const recordByKey = (modKey: string) => {
  return MOD_DB.records.find((r) => {
    return r.modKey === modKey;
  });
};

describe("modDb applicableSubTypes (PoE2 wiki spawn alignment)", () => {
  test("prefix_phys_thorns: body / shield / belt — not helmet or gloves", () => {
    const rec = recordByKey("prefix_phys_thorns");
    expect(rec).toBeDefined();
    const f = { baseItemSubType: "helmet" as const, itemStatTags: ["str"] as const };
    expect(isRecordEligibleForBaseFilters(rec!, f)).toBe(false);
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "gloves", itemStatTags: ["str"] }),
    ).toBe(false);
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "bodyArmour", itemStatTags: ["str"] }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "shield", itemStatTags: ["str"] }),
    ).toBe(true);
    expect(isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "belt", itemStatTags: [] })).toBe(
      true,
    );
  });

  test("suffix_reduced_bleed_duration: body armour only — not helmet", () => {
    const rec = recordByKey("suffix_reduced_bleed_duration");
    expect(rec).toBeDefined();
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "helmet",
        itemStatTags: ["str"],
      }),
    ).toBe(false);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "bodyArmour",
        itemStatTags: ["str"],
      }),
    ).toBe(true);
  });

  test("suffix_stun_threshold: body / boots / belt / shield — not helmet or gloves", () => {
    const rec = recordByKey("suffix_stun_threshold");
    expect(rec).toBeDefined();
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "helmet",
        itemStatTags: ["str"],
      }),
    ).toBe(false);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "gloves",
        itemStatTags: ["str"],
      }),
    ).toBe(false);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "bodyArmour",
        itemStatTags: ["str"],
      }),
    ).toBe(true);
    expect(isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "belt", itemStatTags: [] })).toBe(
      true,
    );
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "shield", itemStatTags: ["str"] }),
    ).toBe(true);
  });

  test("suffix_crit_chance: helmet and amulet — not gloves", () => {
    const rec = recordByKey("suffix_crit_chance");
    expect(rec).toBeDefined();
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "helmet",
        itemStatTags: ["dex"],
      }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "amulet", itemStatTags: [] }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "gloves",
        itemStatTags: ["dex"],
      }),
    ).toBe(false);
  });

  test("suffix_life_regen: body / boots / belt / amulet / ring — not helmet or gloves", () => {
    const rec = recordByKey("suffix_life_regen");
    expect(rec).toBeDefined();
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "helmet",
        itemStatTags: ["str"],
      }),
    ).toBe(false);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "gloves",
        itemStatTags: ["str"],
      }),
    ).toBe(false);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "bodyArmour",
        itemStatTags: ["str"],
      }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "ring", itemStatTags: [] }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "amulet", itemStatTags: [] }),
    ).toBe(true);
  });

  test("prefix_accuracy: helmet / gloves / weapons / ring / amulet / quiver — not body armour", () => {
    const rec = recordByKey("prefix_accuracy");
    expect(rec).toBeDefined();
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "helmet",
        itemStatTags: ["dex"],
      }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "gloves",
        itemStatTags: ["dex"],
      }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "ring", itemStatTags: [] }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "amulet", itemStatTags: [] }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "quiver", itemStatTags: [] }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "bodyArmour",
        itemStatTags: ["str"],
      }),
    ).toBe(false);
  });

  test("prefix_item_rarity: ring, amulet, helmet — not boots, gloves, weapons", () => {
    const rec = recordByKey("prefix_item_rarity");
    expect(rec).toBeDefined();
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "ring", itemStatTags: [] }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "amulet", itemStatTags: [] }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "helmet", itemStatTags: ["str"] }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "boots", itemStatTags: ["str"] }),
    ).toBe(false);
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "gloves", itemStatTags: ["str"] }),
    ).toBe(false);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "bow",
        itemStatTags: ["dex"],
      }),
    ).toBe(false);
  });

  test("suffix_item_rarity: ring, amulet, boots, helmet, gloves — not weapons", () => {
    const rec = recordByKey("suffix_item_rarity");
    expect(rec).toBeDefined();
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "ring", itemStatTags: [] }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "amulet", itemStatTags: [] }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, { baseItemSubType: "boots", itemStatTags: ["str"] }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "bow",
        itemStatTags: ["dex"],
      }),
    ).toBe(false);
  });

  test("prefix_inc_es_max_mana: helmet & focus only — not body armour / gloves / boots (PoE2DB BaseLocalDefencesAndMana)", () => {
    const rec = recordByKey("prefix_inc_es_max_mana");
    expect(rec).toBeDefined();
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "bodyArmour",
        itemStatTags: ["int"],
      }),
    ).toBe(false);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "gloves",
        itemStatTags: ["int"],
      }),
    ).toBe(false);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "boots",
        itemStatTags: ["int"],
      }),
    ).toBe(false);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "helmet",
        itemStatTags: ["int"],
      }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "focus",
        itemStatTags: ["int"],
      }),
    ).toBe(true);
  });

  test("prefix_max_mana: helmet / gloves / boots — not body armour (PoE2DB Body_Armours has no IncreasedMana pool)", () => {
    const rec = recordByKey("prefix_max_mana");
    expect(rec).toBeDefined();
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "bodyArmour",
        itemStatTags: ["int"],
      }),
    ).toBe(false);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "bodyArmour",
        itemStatTags: ["str"],
      }),
    ).toBe(false);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "helmet",
        itemStatTags: ["int"],
      }),
    ).toBe(true);
  });

  test("suffix_minion_spell_gem_level: helmet and amulet — not gloves", () => {
    const rec = recordByKey("suffix_minion_spell_gem_level");
    expect(rec).toBeDefined();
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "helmet",
        itemStatTags: ["int"],
      }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "amulet",
        itemStatTags: [],
      }),
    ).toBe(true);
    expect(
      isRecordEligibleForBaseFilters(rec!, {
        baseItemSubType: "gloves",
        itemStatTags: ["int"],
      }),
    ).toBe(false);
  });
});
