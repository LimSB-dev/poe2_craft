import {
  computeModDbTotalWeightHintsFromWeightsByWikiModId,
  modDbTotalWeightHintTierCount,
} from "@/lib/poe2-item-simulator/poe2dbModDbTotalWeightHints";

describe("computeModDbTotalWeightHintsFromWeightsByWikiModId", () => {
  test("sums PoE2DB weights for prefix_max_life wiki ladder when all tiers present", () => {
    const weights: Record<string, number> = {
      IncreasedLife1: 100,
      IncreasedLife2: 100,
      IncreasedLife3: 100,
      IncreasedLife4: 100,
      IncreasedLife5: 100,
      IncreasedLife6: 100,
      IncreasedLife7: 100,
      IncreasedLife8: 100,
      IncreasedLife9: 100,
      IncreasedLife10: 100,
      IncreasedLife11: 100,
      IncreasedLife12: 100,
      IncreasedLife13: 100,
    };
    const hints = computeModDbTotalWeightHintsFromWeightsByWikiModId(weights);
    expect(hints.prefix_max_life?.suggestedTotalWeight).toBe(1300);
    expect(hints.prefix_max_life?.missingWikiModIds.length).toBe(0);
    expect(modDbTotalWeightHintTierCount(hints.prefix_max_life!)).toBe(13);
  });

  test("lists missing wiki mod ids when some tiers lack PoE2DB weight", () => {
    const hints = computeModDbTotalWeightHintsFromWeightsByWikiModId({
      IncreasedLife1: 100,
    });
    expect(hints.prefix_max_life?.missingWikiModIds.length).toBeGreaterThan(0);
    expect(hints.prefix_max_life?.suggestedTotalWeight).toBe(100);
  });
});
