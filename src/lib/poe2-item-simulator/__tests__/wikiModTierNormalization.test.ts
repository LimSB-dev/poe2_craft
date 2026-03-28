import {
  enrichWikiModStatRangesWithLocalFlag,
  inferIsLocalFromStatId,
} from "@/lib/poe2-item-simulator/wikiModTierNormalization";

describe("wikiModTierNormalization", () => {
  test("inferIsLocalFromStatId detects local_ prefix", () => {
    expect(inferIsLocalFromStatId("local_energy_shield")).toBe(true);
    expect(inferIsLocalFromStatId("base_maximum_life")).toBe(false);
    expect(inferIsLocalFromStatId(null)).toBe(false);
    expect(inferIsLocalFromStatId(undefined)).toBe(false);
  });

  test("enrichWikiModStatRangesWithLocalFlag sets isLocal on stat ranges", () => {
    const out = enrichWikiModStatRangesWithLocalFlag([
      { statId: "local_energy_shield", min: 25, max: 30 },
      { statId: "base_maximum_life", min: 10, max: 19 },
    ]);
    expect(out[0]?.isLocal).toBe(true);
    expect(out[1]?.isLocal).toBe(false);
  });
});
