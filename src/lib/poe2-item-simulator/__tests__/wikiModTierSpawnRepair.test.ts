import {
  repairEmptySpawnWeightsInWikiTierRows,
  wikiModIdStatFamilyPrefix,
} from "@/lib/poe2-item-simulator/wikiModTierSpawnRepair";
import type { WikiExtractedModTierRowType } from "@/lib/poe2-item-simulator/wikiModTierTypes";

describe("wikiModTierSpawnRepair", () => {
  test("wikiModIdStatFamilyPrefix strips trailing tier suffix", () => {
    expect(wikiModIdStatFamilyPrefix("IncreasedLife13")).toBe("IncreasedLife");
    expect(wikiModIdStatFamilyPrefix("LocalIncreasedEnergyShieldPercent7_")).toBe(
      "LocalIncreasedEnergyShieldPercent",
    );
    expect(wikiModIdStatFamilyPrefix("AddedColdDamage10")).toBe("AddedColdDamage");
  });

  test("repairEmptySpawnWeightsInWikiTierRows copies spawn from adjacent tier in same ladder", () => {
    const donor: WikiExtractedModTierRowType = {
      wikiModId: "LocalIncreasedEnergyShieldPercent6",
      wikiModifierPageName: "Modifier:LocalIncreasedEnergyShieldPercent6",
      modGroups: "DefencesPercent",
      generationType: 1,
      requiredLevel: 60,
      modDomain: 1,
      effectiveLevel: null,
      goldPrice: null,
      craftTags: [],
      tierText: null,
      statText: "x",
      name: null,
      statRanges: [{ statId: "local_energy_shield_+%", min: 80, max: 91, isLocal: true }],
      spawnWeights: [{ ordinal: 1, tag: "int_armour", value: 1 }],
      simulatorTierWithinGroup: 0,
    };
    const empty: WikiExtractedModTierRowType = {
      ...donor,
      wikiModId: "LocalIncreasedEnergyShieldPercent7_",
      wikiModifierPageName: "Modifier:LocalIncreasedEnergyShieldPercent7_",
      requiredLevel: 65,
      statRanges: [{ statId: "local_energy_shield_+%", min: 92, max: 100, isLocal: true }],
      spawnWeights: [],
    };
    const { repairedCount } = repairEmptySpawnWeightsInWikiTierRows([donor, empty]);
    expect(repairedCount).toBe(1);
    expect(empty.spawnWeights).toEqual([{ ordinal: 1, tag: "int_armour", value: 1 }]);
  });

  test("repairEmptySpawnWeightsInWikiTierRows fills LifeRegeneration player ladder when Cargo omits spawn rows", () => {
    const donor: WikiExtractedModTierRowType = {
      wikiModId: "LifeRegeneration7",
      wikiModifierPageName: "Modifier:LifeRegeneration7",
      modGroups: "LifeRegeneration",
      generationType: 2,
      requiredLevel: 47,
      modDomain: 1,
      effectiveLevel: null,
      goldPrice: null,
      craftTags: [],
      tierText: null,
      statText: "x",
      name: null,
      statRanges: [{ statId: "base_life_regeneration_rate_per_minute", min: 360, max: 480, isLocal: false }],
      spawnWeights: [
        { ordinal: 1, tag: "body_armour", value: 1 },
        { ordinal: 2, tag: "boots", value: 1 },
      ],
      simulatorTierWithinGroup: 0,
    };
    const empty: WikiExtractedModTierRowType = {
      ...donor,
      wikiModId: "LifeRegeneration8_",
      wikiModifierPageName: "Modifier:LifeRegeneration8_",
      requiredLevel: 58,
      statRanges: [{ statId: "base_life_regeneration_rate_per_minute", min: 540, max: 720, isLocal: false }],
      spawnWeights: [],
    };
    const { repairedCount } = repairEmptySpawnWeightsInWikiTierRows([donor, empty]);
    expect(repairedCount).toBe(1);
    expect(empty.spawnWeights).toEqual([
      { ordinal: 1, tag: "body_armour", value: 1 },
      { ordinal: 2, tag: "boots", value: 1 },
    ]);
  });

  test("repairEmptySpawnWeightsInWikiTierRows fills EnergyShieldRegeneration ladder when Cargo omits EnergyShieldRechargeRate5______ spawn rows", () => {
    const donor: WikiExtractedModTierRowType = {
      wikiModId: "EnergyShieldRechargeRate4",
      wikiModifierPageName: "Modifier:EnergyShieldRechargeRate4",
      modGroups: "EnergyShieldRegeneration",
      generationType: 2,
      requiredLevel: 48,
      modDomain: 1,
      effectiveLevel: null,
      goldPrice: null,
      craftTags: [],
      tierText: null,
      statText: "x",
      name: null,
      statRanges: [{ statId: "energy_shield_recharge_rate_+%", min: 41, max: 45, isLocal: false }],
      spawnWeights: [
        { ordinal: 1, tag: "body_armour", value: 0 },
        { ordinal: 2, tag: "str_dex_int_armour", value: 1 },
        { ordinal: 3, tag: "focus", value: 1 },
      ],
      simulatorTierWithinGroup: 0,
    };
    const empty: WikiExtractedModTierRowType = {
      ...donor,
      wikiModId: "EnergyShieldRechargeRate5______",
      wikiModifierPageName: "Modifier:EnergyShieldRechargeRate5______",
      requiredLevel: 66,
      statRanges: [{ statId: "energy_shield_recharge_rate_+%", min: 46, max: 50, isLocal: false }],
      spawnWeights: [],
    };
    const { repairedCount } = repairEmptySpawnWeightsInWikiTierRows([donor, empty]);
    expect(repairedCount).toBe(1);
    expect(empty.spawnWeights).toEqual(donor.spawnWeights);
  });
});
