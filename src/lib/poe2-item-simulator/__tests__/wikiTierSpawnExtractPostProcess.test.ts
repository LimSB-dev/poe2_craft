import { applyPoe2dbWikiSpawnPostCorrections } from "@/lib/poe2-item-simulator/wikiTierSpawnExtractPostProcess";
import type { WikiExtractedModTierRowType } from "@/lib/poe2-item-simulator/wikiModTierTypes";

const baseRow = (wikiModId: string): WikiExtractedModTierRowType => {
  return {
    wikiModId,
    wikiModifierPageName: `Modifier:${wikiModId}`,
    modGroups: "ItemFoundRarityIncreasePrefix",
    generationType: 1,
    requiredLevel: 1,
    modDomain: 1,
    effectiveLevel: null,
    goldPrice: null,
    craftTags: [],
    tierText: null,
    statText: "",
    name: null,
    statRanges: [{ statId: "base_item_found_rarity_+%", min: 1, max: 2, isLocal: false }],
    spawnWeights: [
      { ordinal: 1, tag: "ring", value: 1 },
      { ordinal: 2, tag: "amulet", value: 1 },
      { ordinal: 3, tag: "helmet", value: 1 },
    ],
    simulatorTierWithinGroup: 0,
  };
};

describe("wikiTierSpawnExtractPostProcess", () => {
  test("applyPoe2dbWikiSpawnPostCorrections sets helmet to 0 for ItemFoundRarityIncreasePrefix4_ and Prefix5 only", () => {
    const p3 = baseRow("ItemFoundRarityIncreasePrefix3");
    const p4 = baseRow("ItemFoundRarityIncreasePrefix4_");
    const p5 = baseRow("ItemFoundRarityIncreasePrefix5");
    const out = applyPoe2dbWikiSpawnPostCorrections([p3, p4, p5]);
    expect(out.correctionsApplied).toBe(2);
    expect(out.intelligenceHintsApplied).toBe(0);
    expect(p3.spawnWeights.find((w) => w.tag === "helmet")?.value).toBe(1);
    expect(p4.spawnWeights.find((w) => w.tag === "helmet")?.value).toBe(0);
    expect(p5.spawnWeights.find((w) => w.tag === "helmet")?.value).toBe(0);
    expect(p4.spawnWeights.find((w) => w.tag === "ring")?.value).toBe(1);
  });

  test("applyPoe2dbWikiSpawnPostCorrections sets requiredIntelligence 900 for EnergyShieldRechargeRate6 (PoE2DB)", () => {
    const row: WikiExtractedModTierRowType = {
      wikiModId: "EnergyShieldRechargeRate6",
      wikiModifierPageName: "Modifier:EnergyShieldRechargeRate6",
      modGroups: "EnergyShieldRegeneration",
      generationType: 2,
      requiredLevel: 81,
      modDomain: 1,
      effectiveLevel: null,
      goldPrice: null,
      craftTags: [],
      tierText: null,
      statText: "",
      name: null,
      statRanges: [{ statId: "energy_shield_recharge_rate_+%", min: 51, max: 55, isLocal: false }],
      spawnWeights: [{ ordinal: 1, tag: "focus", value: 1 }],
      simulatorTierWithinGroup: 1,
    };
    const out = applyPoe2dbWikiSpawnPostCorrections([row]);
    expect(out.intelligenceHintsApplied).toBe(1);
    expect(row.requiredIntelligence).toBe(900);
  });

  test("applyPoe2dbWikiSpawnPostCorrections returns zeros when no matching rows", () => {
    const row = baseRow("ItemFoundRarityIncreasePrefix1");
    const out = applyPoe2dbWikiSpawnPostCorrections([row]);
    expect(out.correctionsApplied).toBe(0);
    expect(out.intelligenceHintsApplied).toBe(0);
    expect(row.spawnWeights.find((w) => w.tag === "helmet")?.value).toBe(1);
  });
});
