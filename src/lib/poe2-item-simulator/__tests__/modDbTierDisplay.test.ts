import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";
import {
  applyStatRangesToModTemplate,
  buildModStatDisplayLines,
  formatStatRangesCell,
  getModTierDisplayRows,
} from "@/lib/poe2-item-simulator/modDbTierDisplay";
import { wikiTierSpawnContextFromBaseFilters } from "@/lib/poe2-item-simulator/wikiTierSpawnFilter";

describe("modDbTierDisplay", () => {
  test("getModTierDisplayRows: synthetic tier 1 has highest level requirement", () => {
    const record = MOD_DB.records.find((r) => r.modKey === "corrupted_str_int");
    expect(record).toBeDefined();
    if (record === undefined) {
      return;
    }
    const rows = getModTierDisplayRows(record);
    expect(rows.length).toBe(record.tierCount);
    expect(rows[0]?.tier).toBe(1);
    expect(rows[0]?.levelRequirement).toBe(record.maxLevelRequirement);
    expect(rows[rows.length - 1]?.levelRequirement).toBe(1);
    expect(rows.every((row) => row.isSynthetic)).toBe(true);
  });

  test("getModTierDisplayRows: wiki-backed prefix_max_life uses real stat ranges", () => {
    const record = MOD_DB.records.find((r) => r.modKey === "prefix_max_life");
    expect(record).toBeDefined();
    if (record === undefined) {
      return;
    }
    const rows = getModTierDisplayRows(record);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.isSynthetic)).toBe(false);
    expect(rows.every((row) => row.statRanges.length > 0)).toBe(true);
  });

  test("getModTierDisplayRows: helmet slot filters prefix_max_life tiers (PoE2DB parity)", () => {
    const record = MOD_DB.records.find((r) => r.modKey === "prefix_max_life");
    expect(record).toBeDefined();
    if (record === undefined) {
      return;
    }
    const ctx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "helmet",
      itemStatTags: ["int"],
    });
    expect(ctx).toBeDefined();
    const rows = getModTierDisplayRows(record, ctx);
    expect(rows.length).toBe(10);
    expect(rows[0]?.statRanges[0]).toMatchObject({
      min: 150,
      max: 174,
      statId: "base_maximum_life",
    });
  });

  test("getModTierDisplayRows: prefix_max_mana matches single wiki ladder (no two-hand merge)", () => {
    const record = MOD_DB.records.find((r) => r.modKey === "prefix_max_mana");
    expect(record).toBeDefined();
    if (record === undefined) {
      return;
    }
    const rows = getModTierDisplayRows(record);
    expect(rows.length).toBe(13);
    expect(rows[0]?.isSynthetic).toBe(false);
    expect(rows[0]?.levelRequirement).toBe(82);
    expect(rows.every((row) => row.statRanges.length > 0)).toBe(true);
  });

  test("getModTierDisplayRows: staff spell damage prefix uses wiki staff ladder (SpellDamageOnTwoHandWeapon)", () => {
    const record = MOD_DB.records.find((r) => r.modKey === "prefix_inc_spell_damage_staff");
    expect(record).toBeDefined();
    if (record === undefined) {
      return;
    }
    const ctx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "staff",
      itemStatTags: ["int"],
      poe2dbTags: ["staff", "twohand"],
    });
    expect(ctx).toBeDefined();
    const rows = getModTierDisplayRows(record, ctx);
    expect(rows.length).toBe(8);
    expect(rows.every((row) => row.isSynthetic)).toBe(false);
    expect(rows.every((row) => row.statRanges.length > 0)).toBe(true);
  });

  test("getModTierDisplayRows: staff fire gain-as-extra uses wiki SpellDamageGainedAsFireTwoHand ladder", () => {
    const record = MOD_DB.records.find((r) => r.modKey === "prefix_gain_as_extra_fire_staff");
    expect(record).toBeDefined();
    if (record === undefined) {
      return;
    }
    const ctx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "staff",
      itemStatTags: ["int"],
      poe2dbTags: ["staff", "twohand"],
    });
    expect(ctx).toBeDefined();
    const rows = getModTierDisplayRows(record, ctx);
    expect(rows.length).toBe(6);
    expect(rows.every((row) => row.isSynthetic)).toBe(false);
    expect(rows[0]?.statRanges[0]?.statId).toBe("non_skill_base_all_damage_%_to_gain_as_fire");
  });

  test("getModTierDisplayRows: no_* blocks inc% only; gain-as-extra still has wiki tiers", () => {
    const fireWeapon = MOD_DB.records.find((r) => r.modKey === "prefix_inc_weapon_fire_damage_staff");
    const fireGain = MOD_DB.records.find((r) => r.modKey === "prefix_gain_as_extra_fire_staff");
    const lightningWeapon = MOD_DB.records.find((r) => {
      return r.modKey === "prefix_inc_weapon_lightning_damage_staff";
    });
    expect(fireWeapon).toBeDefined();
    expect(fireGain).toBeDefined();
    expect(lightningWeapon).toBeDefined();
    const lightningThemedStaffTags = [
      "no_fire_spell_mods",
      "no_cold_spell_mods",
      "no_chaos_spell_mods",
      "no_physical_spell_mods",
      "staff",
      "twohand",
    ];
    const ctx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "staff",
      itemStatTags: ["int"],
      poe2dbTags: lightningThemedStaffTags,
    });
    expect(ctx).toBeDefined();
    expect(getModTierDisplayRows(fireWeapon!, ctx!).length).toBe(0);
    expect(getModTierDisplayRows(fireGain!, ctx!).length).toBe(6);
    expect(getModTierDisplayRows(lightningWeapon!, ctx!).length).toBeGreaterThan(0);
  });

  test("getModTierDisplayRows: prefix_max_mana_staff tier row count matches wiki staff ladder (8)", () => {
    const record = MOD_DB.records.find((r) => r.modKey === "prefix_max_mana_staff");
    expect(record).toBeDefined();
    if (record === undefined) {
      return;
    }
    expect(record.tierCount).toBe(8);
    const ctx = wikiTierSpawnContextFromBaseFilters({
      baseItemSubType: "staff",
      itemStatTags: ["int"],
      poe2dbTags: ["staff", "twohand"],
    });
    const rows = getModTierDisplayRows(record, ctx);
    expect(rows.length).toBe(8);
    expect(rows[0]?.levelRequirement).toBe(70);
  });

  test("getModTierDisplayRows: prefix_added_fire_damage_attack not applicable to staff (no synthetic fallback needed here)", () => {
    const record = MOD_DB.records.find((r) => r.modKey === "prefix_added_fire_damage_attack");
    expect(record).toBeDefined();
    if (record === undefined) {
      return;
    }
    expect(record.applicableSubTypes.includes("staff")).toBe(false);
  });

  test("formatStatRangesCell", () => {
    expect(formatStatRangesCell([])).toBe("");
    expect(formatStatRangesCell([{ min: 5, max: 5 }])).toBe("5");
    expect(formatStatRangesCell([{ min: 1, max: 3 }, { min: 10, max: 20 }])).toBe("1–3, 10–20");
  });

  test("applyStatRangesToModTemplate replaces # in order", () => {
    const template = "+# to ES, #% increased ES";
    expect(applyStatRangesToModTemplate(template, [{ min: 1, max: 2 }, { min: 10, max: 20 }])).toBe(
      "+(1—2) to ES, (10—20)% increased ES",
    );
  });

  test("buildModStatDisplayLines splits hybrid mods", () => {
    const template = "+# to ES, #% increased ES";
    const { lines, isPending } = buildModStatDisplayLines(template, [
      { min: 26, max: 30 },
      { min: 35, max: 38 },
    ]);
    expect(isPending).toBe(false);
    expect(lines).toEqual(["+(26—30) to ES", "(35—38)% increased ES"]);
  });
});

