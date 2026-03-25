import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";
import {
  sortWikiStatRangesForDisplay,
  tryGetWikiModTiers,
} from "@/lib/poe2-item-simulator/wikiModTierMerge";

describe("wikiModTierMerge", () => {
  test("sortWikiStatRangesForDisplay orders minimum before maximum", () => {
    const sorted = sortWikiStatRangesForDisplay([
      { statId: "attack_maximum_added_fire_damage", min: 6, max: 9 },
      { statId: "attack_minimum_added_fire_damage", min: 3, max: 5 },
    ]);
    expect(sorted).toEqual([
      { min: 3, max: 5 },
      { min: 6, max: 9 },
    ]);
  });

  test("tryGetWikiModTiers returns tiers for prefix_max_es", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "prefix_max_es";
    });
    expect(record).toBeDefined();
    const tiers = tryGetWikiModTiers(record!);
    expect(tiers).not.toBeNull();
    expect(tiers!.length).toBeGreaterThan(0);
    expect(tiers![0]?.tier).toBe(1);
    expect(tiers![0]?.statRanges.length).toBeGreaterThan(0);
  });

  test("tryGetWikiModTiers returns null for corrupted mod", () => {
    const record = MOD_DB.records.find((r) => {
      return r.modKey === "corrupted_str_int";
    });
    expect(record).toBeDefined();
    expect(tryGetWikiModTiers(record!)).toBeNull();
  });
});

