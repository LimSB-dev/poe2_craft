import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";
import { listEligibleModTierRowsForRecord } from "@/lib/poe2-item-simulator/roller";

describe("listEligibleModTierRowsForRecord · minModifierLevelFloor", () => {
  test("helmet life/mana: high orb floor still yields tiers when pool max ilvl is below floor (e.g. 65 vs 75)", () => {
    const life = MOD_DB.records.find((r) => {
      return r.modKey === "prefix_max_life";
    });
    const mana = MOD_DB.records.find((r) => {
      return r.modKey === "prefix_max_mana";
    });
    expect(life).toBeDefined();
    expect(mana).toBeDefined();
    const base = {
      baseItemSubType: "helmet" as const,
      itemStatTags: ["str"] as const,
      itemLevel: 82,
      minModifierLevelFloor: 75,
    };
    const lifeTiers = listEligibleModTierRowsForRecord(life!, base);
    const manaTiers = listEligibleModTierRowsForRecord(mana!, base);
    expect(lifeTiers.length).toBeGreaterThan(0);
    expect(manaTiers.length).toBeGreaterThan(0);
    const maxLifeReq = Math.max(...lifeTiers.map((r) => r.levelRequirement));
    const maxManaReq = Math.max(...manaTiers.map((r) => r.levelRequirement));
    expect(maxLifeReq).toBeLessThanOrEqual(65);
    expect(maxManaReq).toBeLessThanOrEqual(65);
  });

  test("body armour life: floor 75 still excludes ilvl 74 tiers when T13 exists at 80", () => {
    const life = MOD_DB.records.find((r) => {
      return r.modKey === "prefix_max_life";
    });
    expect(life).toBeDefined();
    const tiers = listEligibleModTierRowsForRecord(life!, {
      baseItemSubType: "bodyArmour",
      itemStatTags: ["str"],
      itemLevel: 82,
      minModifierLevelFloor: 75,
    });
    expect(tiers.length).toBeGreaterThan(0);
    expect(tiers.every((r) => r.levelRequirement >= 75)).toBe(true);
  });
});
