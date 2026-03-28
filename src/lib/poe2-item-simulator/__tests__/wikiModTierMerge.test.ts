import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";
import {
  normalizeWikiStatRangesForDisplay,
  sortWikiStatRangesForDisplay,
  tryGetWikiModTiers,
} from "@/lib/poe2-item-simulator/wikiModTierMerge";
import { wikiTierSpawnContextFromBaseFilters } from "@/lib/poe2-item-simulator/wikiTierSpawnFilter";

describe("wikiModTierMerge", () => {
  test("normalizeWikiStatRangesForDisplay converts life regen per-minute to per-second", () => {
    expect(
      normalizeWikiStatRangesForDisplay([
        { statId: "base_life_regeneration_rate_per_minute", min: 60, max: 120 },
      ]),
    ).toEqual([{ statId: "base_life_regeneration_rate_per_minute", min: 1, max: 2 }]);
    const hi = normalizeWikiStatRangesForDisplay([
      { statId: "base_life_regeneration_rate_per_minute", min: 1986, max: 2160 },
    ])[0];
    expect(hi?.min).toBeCloseTo(33.1, 5);
    expect(hi?.max).toBe(36);
  });

  test("suffix_life_regen wiki tiers: lowest roll is 1–2/s (not raw per-minute 60–120)", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "suffix_life_regen";
    });
    expect(record).toBeDefined();
    const tiers = tryGetWikiModTiers(record!, undefined);
    expect(tiers).not.toBeNull();
    const worst = tiers![tiers!.length - 1];
    expect(worst?.statRanges[0]).toMatchObject({
      statId: "base_life_regeneration_rate_per_minute",
      min: 1,
      max: 2,
    });
    const best = tiers![0];
    expect(best?.statRanges[0]?.min).toBeCloseTo(33.1, 5);
    expect(best?.statRanges[0]?.max).toBe(36);
  });

  test("sortWikiStatRangesForDisplay orders minimum before maximum", () => {
    const sorted = sortWikiStatRangesForDisplay([
      { statId: "attack_maximum_added_fire_damage", min: 6, max: 9 },
      { statId: "attack_minimum_added_fire_damage", min: 3, max: 5 },
    ]);
    expect(sorted).toEqual([
      { min: 3, max: 5, statId: "attack_minimum_added_fire_damage" },
      { min: 6, max: 9, statId: "attack_maximum_added_fire_damage" },
    ]);
  });

  test("suffix_crit_chance: helmet 5 wiki tiers, amulet 6 (top tier amulet-only)", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "suffix_crit_chance";
    });
    expect(record).toBeDefined();
    const helmet = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "helmet",
      itemStatTags: ["int"],
    });
    const amulet = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "amulet",
      itemStatTags: [],
    });
    const helmetTiers = tryGetWikiModTiers(record!, helmet);
    const amuletTiers = tryGetWikiModTiers(record!, amulet);
    expect(helmetTiers).not.toBeNull();
    expect(amuletTiers).not.toBeNull();
    expect(helmetTiers!.length).toBe(5);
    expect(amuletTiers!.length).toBe(6);
    expect(helmetTiers![0]?.statRanges[0]?.statId).toBe("critical_strike_chance_+%");
    expect(amuletTiers![0]?.statRanges[0]?.statId).toBe("critical_strike_chance_+%");
    expect(helmetTiers![0]?.weight).toBe(250);
    expect(helmetTiers![4]?.weight).toBe(1000);
    expect(amuletTiers![0]?.weight).toBe(125);
    expect(amuletTiers![0]?.levelRequirement).toBe(72);
  });

  test("tryGetWikiModTiers for prefix_max_mana uses one ladder (no two-hand duplicate rows)", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "prefix_max_mana";
    });
    expect(record).toBeDefined();
    const tiers = tryGetWikiModTiers(record!);
    expect(tiers).not.toBeNull();
    expect(tiers!.length).toBe(13);
    expect(tiers![0]?.levelRequirement).toBe(82);
    const firstRange = tiers![0]?.statRanges[0];
    expect(firstRange?.min).toBe(180);
    expect(firstRange?.max).toBe(189);
  });

  test("tryGetWikiModTiers for prefix_max_es uses BaseLocalDefences flat local ES ladder (not IncreasedEnergyShield)", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "prefix_max_es";
    });
    expect(record).toBeDefined();
    const tiers = tryGetWikiModTiers(record!);
    expect(tiers).not.toBeNull();
    expect(tiers!.length).toBe(11);
    expect(tiers![0]?.tier).toBe(1);
    expect(tiers![0]?.levelRequirement).toBe(79);
    expect(tiers![0]?.statRanges[0]).toMatchObject({
      min: 91,
      max: 96,
      statId: "local_energy_shield",
    });
    const worst = tiers![tiers!.length - 1];
    expect(worst?.levelRequirement).toBe(1);
    expect(worst?.statRanges[0]).toMatchObject({ min: 10, max: 17 });
  });

  test("tryGetWikiModTiers for prefix_inc_es uses DefencesPercent LocalIncreasedEnergyShieldPercent (8 tiers; PoE2DB 갑옷 INT)", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "prefix_inc_es";
    });
    expect(record).toBeDefined();
    const ctx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "bodyArmour",
      itemStatTags: ["int"],
    });
    const tiers = tryGetWikiModTiers(record!, ctx ?? undefined);
    expect(tiers).not.toBeNull();
    expect(tiers!.length).toBe(8);
    expect(tiers![0]?.levelRequirement).toBe(75);
    expect(tiers![0]?.statRanges[0]).toMatchObject({
      min: 101,
      max: 110,
      statId: "local_energy_shield_+%",
    });
    const worst = tiers![tiers!.length - 1];
    expect(worst?.levelRequirement).toBe(2);
    expect(worst?.statRanges[0]).toMatchObject({ min: 15, max: 26 });
    expect(tiers![0]?.weight).toBe(1000);
  });

  test("tryGetWikiModTiers for prefix_inc_es_max_mana uses BaseLocalDefencesAndMana (ES + Mana only)", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "prefix_inc_es_max_mana";
    });
    expect(record).toBeDefined();
    const tiers = tryGetWikiModTiers(record!);
    expect(tiers).not.toBeNull();
    expect(tiers!.length).toBe(6);
    expect(tiers![0]?.levelRequirement).toBe(78);
    expect(
      tiers![0]?.statRanges.some((s) => (s.statId ?? "").includes("energy_shield")),
    ).toBe(true);
    expect(tiers![0]?.statRanges.some((s) => (s.statId ?? "").includes("mana"))).toBe(true);
  });

  test("prefix_max_life tier count follows mod_spawn_weights (helmet vs body; body-only high tiers)", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "prefix_max_life";
    });
    expect(record).toBeDefined();
    const helmetStr = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "helmet",
      itemStatTags: ["str"],
    });
    const bodyStr = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "bodyArmour",
      itemStatTags: ["str"],
    });
    const helmetTiers = tryGetWikiModTiers(record!, helmetStr);
    const bodyTiers = tryGetWikiModTiers(record!, bodyStr);
    expect(helmetTiers).not.toBeNull();
    expect(bodyTiers).not.toBeNull();
    expect(helmetTiers!.length).toBe(10);
    expect(bodyTiers!.length).toBe(13);
    const bestHelmet = helmetTiers![0];
    expect(bestHelmet?.statRanges[0]).toMatchObject({
      min: 150,
      max: 174,
      statId: "base_maximum_life",
    });
  });

  test("suffix_reduced_attr_req: helmet str uses PoE2DB Helmets_str DropChance (800), not global max (1000)", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "suffix_reduced_attr_req";
    });
    expect(record).toBeDefined();
    const helmetStr = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "helmet",
      itemStatTags: ["str"],
    });
    const tiers = tryGetWikiModTiers(record!, helmetStr);
    expect(tiers).not.toBeNull();
    const top = tiers!.find((t) => {
      return t.tier === 1;
    });
    expect(top?.weight).toBe(800);
  });

  test("suffix_minion_spell_gem_level: helmet has 2 wiki tiers, amulet has 3 (top tier amulet-only)", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "suffix_minion_spell_gem_level";
    });
    expect(record).toBeDefined();
    const helmet = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "helmet",
      itemStatTags: ["int"],
    });
    const amulet = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "amulet",
      itemStatTags: [],
    });
    const helmetTiers = tryGetWikiModTiers(record!, helmet);
    const amuletTiers = tryGetWikiModTiers(record!, amulet);
    expect(helmetTiers).not.toBeNull();
    expect(amuletTiers).not.toBeNull();
    expect(helmetTiers!.length).toBe(2);
    expect(amuletTiers!.length).toBe(3);
    expect(helmetTiers![0]?.statRanges[0]?.statId).toBe("minion_skill_gem_level_+");
    /** PoE2DB `ModsView` `DropChance` → `poe2db-mod-drop-weights.json` (예: +2 티 250, +1 티 500). */
    expect(helmetTiers![0]?.tier).toBe(1);
    expect(helmetTiers![0]?.statRanges[0]?.max).toBe(2);
    expect(helmetTiers![0]?.weight).toBe(250);
    expect(helmetTiers![1]?.tier).toBe(2);
    expect(helmetTiers![1]?.statRanges[0]?.max).toBe(1);
    expect(helmetTiers![1]?.weight).toBe(500);

    expect(amuletTiers![0]?.weight).toBe(100);
    expect(amuletTiers![1]?.weight).toBe(250);
    expect(amuletTiers![2]?.weight).toBe(500);
  });

  test("prefix_max_life shield str has fewer tiers than body (body-only top tiers)", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "prefix_max_life";
    });
    expect(record).toBeDefined();
    const shieldStr = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "shield",
      itemStatTags: ["str"],
    });
    const bodyStr = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "bodyArmour",
      itemStatTags: ["str"],
    });
    const shieldTiers = tryGetWikiModTiers(record!, shieldStr);
    const bodyTiers = tryGetWikiModTiers(record!, bodyStr);
    expect(shieldTiers).not.toBeNull();
    expect(bodyTiers).not.toBeNull();
    expect(shieldTiers!.length).toBe(11);
    expect(bodyTiers!.length).toBe(13);
  });

  test("prefix_added_fire_damage_attack wiki ladder differs by weapon class (bow vs gloves)", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "prefix_added_fire_damage_attack";
    });
    expect(record).toBeDefined();
    const bowDex = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "bow",
      itemStatTags: ["dex"],
    });
    const glovesDex = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "gloves",
      itemStatTags: ["dex"],
    });
    const bowTiers = tryGetWikiModTiers(record!, bowDex);
    const glovesTiers = tryGetWikiModTiers(record!, glovesDex);
    expect(bowTiers).not.toBeNull();
    expect(glovesTiers).not.toBeNull();
    expect(bowTiers!.length).toBe(9);
    expect(glovesTiers!.length).toBe(9);
  });

  test("prefix_max_es tier count follows mod_spawn_weights slot pool (boots int vs body int)", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "prefix_max_es";
    });
    expect(record).toBeDefined();
    const bootsInt = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "boots",
      itemStatTags: ["int"],
    });
    const bodyInt = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "bodyArmour",
      itemStatTags: ["int"],
    });
    const bootsTiers = tryGetWikiModTiers(record!, bootsInt);
    const bodyTiers = tryGetWikiModTiers(record!, bodyInt);
    expect(bootsTiers).not.toBeNull();
    expect(bodyTiers).not.toBeNull();
    expect(bootsTiers!.length).toBe(7);
    expect(bodyTiers!.length).toBe(11);
  });

  test("tryGetWikiModTiers returns null for corrupted mod", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "corrupted_str_int";
    });
    expect(record).toBeDefined();
    expect(tryGetWikiModTiers(record!)).toBeNull();
  });

  test("tryGetWikiModTiers returns tiers with stat ranges for suffix_life_on_kill", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "suffix_life_on_kill";
    });
    expect(record).toBeDefined();
    const tiers = tryGetWikiModTiers(record!);
    expect(tiers).not.toBeNull();
    expect(tiers!.length).toBeGreaterThan(0);
    expect(tiers![0]?.statRanges.length).toBeGreaterThan(0);
  });

  test("tryGetWikiModTiers returns tiers with stat ranges for suffix_mana_on_kill", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "suffix_mana_on_kill";
    });
    expect(record).toBeDefined();
    const tiers = tryGetWikiModTiers(record!);
    expect(tiers).not.toBeNull();
    expect(tiers![0]?.statRanges.length).toBeGreaterThan(0);
  });

  describe("two-hand wiki ladder exclusion (same mod_groups, parallel ids)", () => {
    test("prefix_added_fire_damage_attack uses non-TwoHand row count only", () => {
      const record = MOD_DB.records.find((r) => {
        return r.modKey === "prefix_added_fire_damage_attack";
      });
      expect(record).toBeDefined();
      const tiers = tryGetWikiModTiers(record!);
      expect(tiers).not.toBeNull();
      expect(tiers!.length).toBe(34);
    });

    test("prefix_added_cold_damage_attack uses non-TwoHand row count only", () => {
      const record = MOD_DB.records.find((r) => {
        return r.modKey === "prefix_added_cold_damage_attack";
      });
      expect(record).toBeDefined();
      expect(tryGetWikiModTiers(record!)?.length).toBe(34);
    });

    test("prefix_added_lightning_damage_attack uses non-TwoHand row count only", () => {
      const record = MOD_DB.records.find((r) => {
        return r.modKey === "prefix_added_lightning_damage_attack";
      });
      expect(record).toBeDefined();
      expect(tryGetWikiModTiers(record!)?.length).toBe(34);
    });

    test("prefix_added_phys_damage_attack uses non-TwoHand row count only", () => {
      const record = MOD_DB.records.find((r) => {
        return r.modKey === "prefix_added_phys_damage_attack";
      });
      expect(record).toBeDefined();
      expect(tryGetWikiModTiers(record!)?.length).toBe(27);
    });

    test("suffix_melee_skill_levels excludes TwoHandWeapon parallel rows", () => {
      const record = MOD_DB.records.find((r) => {
        return r.modKey === "suffix_melee_skill_levels";
      });
      expect(record).toBeDefined();
      const tiers = tryGetWikiModTiers(record!);
      expect(tiers).not.toBeNull();
      expect(tiers!.length).toBe(8);
      expect(tiers![0]?.levelRequirement).toBe(81);
    });
  });

  test("sortWikiStatRangesForDisplay ties break by statId when no minimum/maximum in id", () => {
    const sorted = sortWikiStatRangesForDisplay([
      { statId: "z_stat", min: 1, max: 2 },
      { statId: "a_stat", min: 3, max: 4 },
    ]);
    expect(sorted.map((s) => s.statId)).toEqual(["a_stat", "z_stat"]);
  });
});

