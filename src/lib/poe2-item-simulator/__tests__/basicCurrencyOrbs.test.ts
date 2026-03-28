import {
  applyDivineOrb,
  applyOrbOfAlchemy,
  applyOrbOfAnnulment,
  applyOrbOfAugmentation,
  applyOrbOfTransmutation,
  applyRegalOrb,
  canApplyChaosOrb,
  canApplyExaltedOrb,
  canApplyFracturingOrb,
  canApplyOrbOfAlchemy,
  canApplyOrbOfAnnulment,
  canApplyOrbOfAnnulmentDesecratedOnly,
  canApplyOrbOfAugmentation,
  canApplyOrbOfTransmutation,
  canApplyRegalOrb,
  enforceAtMostOneFracturedMod,
} from "@/lib/poe2-item-simulator/currency/basicCurrencyOrbs";
import { CORRUPTED_ITEM_STANDARD_CRAFTING_ERROR_MESSAGE } from "@/lib/poe2-item-simulator/itemCorruptionCraftingGuard";

const baseMod = (overrides: Partial<IModDefinition> = {}): IModDefinition => {
  return {
    modKey: "test_mod",
    displayName: "Test Mod",
    tier: 1,
    modType: "prefix",
    weight: 100,
    ...overrides,
  };
};

describe("basicCurrencyOrbs — applicability (canApply*)", () => {
  test("canApplyOrbOfTransmutation: normal, no explicits only", () => {
    expect(
      canApplyOrbOfTransmutation({
        rarity: "normal",
        prefixes: [],
        suffixes: [],
      }),
    ).toBe(true);
    expect(
      canApplyOrbOfTransmutation({
        rarity: "magic",
        prefixes: [baseMod()],
        suffixes: [],
      }),
    ).toBe(false);
  });

  test("canApplyOrbOfAugmentation: magic with affix room", () => {
    expect(
      canApplyOrbOfAugmentation({
        rarity: "magic",
        prefixes: [baseMod()],
        suffixes: [],
      }),
    ).toBe(true);
    expect(
      canApplyOrbOfAugmentation({
        rarity: "magic",
        prefixes: [baseMod({ modKey: "a" })],
        suffixes: [baseMod({ modKey: "b", modType: "suffix" })],
      }),
    ).toBe(false);
  });

  test("canApplyRegalOrb: magic with at least one mod and room for rare growth", () => {
    expect(
      canApplyRegalOrb({
        rarity: "magic",
        prefixes: [baseMod()],
        suffixes: [],
      }),
    ).toBe(true);
    expect(
      canApplyRegalOrb({
        rarity: "magic",
        prefixes: [],
        suffixes: [],
      }),
    ).toBe(false);
  });

  test("canApplyOrbOfAlchemy: empty normal or any magic", () => {
    expect(
      canApplyOrbOfAlchemy({
        rarity: "normal",
        prefixes: [],
        suffixes: [],
      }),
    ).toBe(true);
    expect(
      canApplyOrbOfAlchemy({
        rarity: "magic",
        prefixes: [baseMod()],
        suffixes: [],
      }),
    ).toBe(true);
    expect(
      canApplyOrbOfAlchemy({
        rarity: "rare",
        prefixes: [],
        suffixes: [],
      }),
    ).toBe(false);
  });

  test("canApplyExaltedOrb: rare under 6 affixes", () => {
    expect(
      canApplyExaltedOrb({
        rarity: "rare",
        prefixes: [baseMod({ modKey: "p1" })],
        suffixes: [],
      }),
    ).toBe(true);
    const sixMods: IItemRoll = {
      rarity: "rare",
      prefixes: [
        baseMod({ modKey: "p1" }),
        baseMod({ modKey: "p2" }),
        baseMod({ modKey: "p3" }),
      ],
      suffixes: [
        baseMod({ modKey: "s1", modType: "suffix" }),
        baseMod({ modKey: "s2", modType: "suffix" }),
        baseMod({ modKey: "s3", modType: "suffix" }),
      ],
    };
    expect(canApplyExaltedOrb(sixMods)).toBe(false);
  });

  test("canApplyChaosOrb: rare, has removable non-fractured affix", () => {
    expect(
      canApplyChaosOrb({
        rarity: "rare",
        prefixes: [baseMod({ isFractured: true })],
        suffixes: [baseMod({ modKey: "s", modType: "suffix" })],
      }),
    ).toBe(true);
    expect(
      canApplyChaosOrb({
        rarity: "rare",
        prefixes: [baseMod({ isFractured: true })],
        suffixes: [],
      }),
    ).toBe(false);
  });

  test("canApplyFracturingOrb: rare, ≥4 mods, no existing fracture", () => {
    const four: IItemRoll = {
      rarity: "rare",
      prefixes: [
        baseMod({ modKey: "p1" }),
        baseMod({ modKey: "p2" }),
      ],
      suffixes: [
        baseMod({ modKey: "s1", modType: "suffix" }),
        baseMod({ modKey: "s2", modType: "suffix" }),
      ],
    };
    expect(canApplyFracturingOrb(four)).toBe(true);
    expect(
      canApplyFracturingOrb({
        ...four,
        prefixes: [baseMod({ modKey: "p1", isFractured: true }), baseMod({ modKey: "p2" })],
      }),
    ).toBe(false);
  });

  test("canApplyOrbOfAnnulment: magic/rare with removable mod", () => {
    expect(
      canApplyOrbOfAnnulment({
        rarity: "magic",
        prefixes: [baseMod()],
        suffixes: [],
      }),
    ).toBe(true);
    expect(
      canApplyOrbOfAnnulment({
        rarity: "normal",
        prefixes: [],
        suffixes: [],
      }),
    ).toBe(false);
  });

  test("corrupted: standard canApply* false; Omen of Light annul still allowed", () => {
    const corruptedRare: IItemRoll = {
      rarity: "rare",
      prefixes: [baseMod({ modKey: "p1" })],
      suffixes: [],
      isCorrupted: true,
    };
    expect(canApplyChaosOrb(corruptedRare)).toBe(false);
    expect(canApplyOrbOfAnnulment(corruptedRare)).toBe(false);
    expect(
      canApplyOrbOfAnnulmentDesecratedOnly({
        ...corruptedRare,
        prefixes: [baseMod({ modKey: "p1", isDesecrated: true })],
      }),
    ).toBe(true);
  });

  test("canApplyOrbOfAnnulmentDesecratedOnly: requires removable desecrated line", () => {
    expect(
      canApplyOrbOfAnnulmentDesecratedOnly({
        rarity: "rare",
        prefixes: [baseMod({ isDesecrated: true })],
        suffixes: [],
      }),
    ).toBe(true);
    expect(
      canApplyOrbOfAnnulmentDesecratedOnly({
        rarity: "rare",
        prefixes: [baseMod()],
        suffixes: [],
      }),
    ).toBe(false);
  });
});

describe("basicCurrencyOrbs — enforceAtMostOneFracturedMod", () => {
  test("keeps first fractured mod only", () => {
    const input: IItemRoll = {
      rarity: "rare",
      prefixes: [
        baseMod({ modKey: "a", isFractured: true }),
        baseMod({ modKey: "b", isFractured: true }),
      ],
      suffixes: [],
    };
    const out = enforceAtMostOneFracturedMod(input);
    expect(out.prefixes.filter((m) => m.isFractured === true).length).toBe(1);
    expect(out.prefixes[0]?.isFractured).toBe(true);
    expect(out.prefixes[1]?.isFractured).toBeUndefined();
  });
});

describe("basicCurrencyOrbs — apply* guard errors", () => {
  test("applyOrbOfTransmutation throws when not applicable", () => {
    expect(() => {
      applyOrbOfTransmutation({
        rarity: "magic",
        prefixes: [baseMod()],
        suffixes: [],
      });
    }).toThrow();
  });

  test("applyOrbOfAugmentation throws on non-magic", () => {
    expect(() => {
      applyOrbOfAugmentation({
        rarity: "rare",
        prefixes: [baseMod()],
        suffixes: [],
      });
    }).toThrow();
  });

  test("applyRegalOrb throws on empty magic", () => {
    expect(() => {
      applyRegalOrb({
        rarity: "magic",
        prefixes: [],
        suffixes: [],
      });
    }).toThrow();
  });

  test("applyOrbOfAlchemy throws on rare", () => {
    expect(() => {
      applyOrbOfAlchemy({
        rarity: "rare",
        prefixes: [baseMod()],
        suffixes: [],
      });
    }).toThrow();
  });

  test("applyOrbOfAnnulment throws on normal", () => {
    expect(() => {
      applyOrbOfAnnulment({
        rarity: "normal",
        prefixes: [],
        suffixes: [],
      });
    }).toThrow();
  });

  test("applyOrbOfTransmutation throws on corrupted item", () => {
    expect(() => {
      applyOrbOfTransmutation({
        rarity: "normal",
        prefixes: [],
        suffixes: [],
        isCorrupted: true,
      });
    }).toThrow(CORRUPTED_ITEM_STANDARD_CRAFTING_ERROR_MESSAGE);
  });

  test("applyDivineOrb is not implemented", () => {
    expect(() => {
      applyDivineOrb({
        rarity: "rare",
        prefixes: [],
        suffixes: [],
      });
    }).toThrow(/not implemented/);
  });
});

describe("basicCurrencyOrbs — happy path with deterministic randomness", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("applyOrbOfTransmutation produces magic item with one explicit", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const next = applyOrbOfTransmutation({
      rarity: "normal",
      prefixes: [],
      suffixes: [],
    });
    expect(next.rarity).toBe("magic");
    expect(next.prefixes.length + next.suffixes.length).toBe(1);
  });

  test("applyOrbOfTransmutation: ring rolls one explicit (prefix pool e.g. accuracy exists — no throw)", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const next = applyOrbOfTransmutation(
      { rarity: "normal", prefixes: [], suffixes: [] },
      { baseItemSubType: "ring", itemStatTags: [] },
    );
    expect(next.rarity).toBe("magic");
    expect(next.prefixes.length + next.suffixes.length).toBe(1);
  });

  test("applyOrbOfTransmutation: claw uses weapon attack mod pool (prefix+suffix candidates exist)", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const next = applyOrbOfTransmutation(
      { rarity: "normal", prefixes: [], suffixes: [] },
      { baseItemSubType: "claw", itemStatTags: [] },
    );
    expect(next.rarity).toBe("magic");
    expect(next.prefixes.length + next.suffixes.length).toBe(1);
  });

  test("applyOrbOfAlchemy produces rare with 4 affixes", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const next = applyOrbOfAlchemy({
      rarity: "normal",
      prefixes: [],
      suffixes: [],
    });
    expect(next.rarity).toBe("rare");
    expect(next.prefixes.length).toBe(2);
    expect(next.suffixes.length).toBe(2);
  });
});

