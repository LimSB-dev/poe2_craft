import {
  formatBaseItemRequirementSummary,
  getAttributeDisplayName,
  getAttributeRequirementPrefix,
  getLevelRequirementLabel,
} from "@/lib/poe2-item-simulator/coreAttributeLabels";

describe("coreAttributeLabels (poe2wiki-aligned locale DB)", () => {
  test("Korean requirement prefixes match PoE2-style naming", () => {
    expect(getAttributeRequirementPrefix("str", "ko")).toBe("힘");
    expect(getAttributeRequirementPrefix("dex", "ko")).toBe("민첩");
    expect(getAttributeRequirementPrefix("int", "ko")).toBe("지능");
    expect(getLevelRequirementLabel("ko")).toBe("레벨");
  });

  test("English keeps STR/DEX/INT abbreviations", () => {
    expect(getAttributeRequirementPrefix("str", "en")).toBe("STR");
    expect(getAttributeDisplayName("str", "en")).toBe("Strength");
  });

  test("formatBaseItemRequirementSummary orders str, dex, int, then level", () => {
    const line = formatBaseItemRequirementSummary(
      {
        requiredStrength: 10,
        requiredDexterity: 0,
        requiredIntelligence: 0,
        levelRequirement: 5,
      },
      "en",
    );
    expect(line).toBe("STR 10 · Lv 5");
  });

  test("unknown locale falls back to English", () => {
    expect(getAttributeRequirementPrefix("dex", "xx-YY")).toBe("DEX");
  });
});
