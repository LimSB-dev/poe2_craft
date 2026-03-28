import { buildCraftLabPreviewFamilyGroups } from "@/lib/crafting-lab/craftLabPreviewFamilies";
import type { CraftLabPreviewRowType } from "@/lib/crafting-lab/craftLabOrbPreview";

const row = (
  nameTemplateKey: string,
  tier: number,
  probability: number,
  weight: number,
  poolFraction?: number,
): CraftLabPreviewRowType => {
  return {
    modKey: `mod_${nameTemplateKey}_${String(tier)}`,
    nameTemplateKey,
    tier,
    probability,
    weight,
    ...(poolFraction !== undefined ? { poolFraction } : {}),
  };
};

describe("buildCraftLabPreviewFamilyGroups", () => {
  test("groups by nameTemplateKey and sums family probability", () => {
    const input: CraftLabPreviewRowType[] = [
      row("a", 1, 0.1, 100),
      row("a", 2, 0.05, 50),
      row("b", 1, 0.2, 200),
    ];
    const groups = buildCraftLabPreviewFamilyGroups(input, "family");
    expect(groups).toHaveLength(2);
    const ga = groups.find((g) => {
      return g.nameTemplateKey === "a";
    });
    const gb = groups.find((g) => {
      return g.nameTemplateKey === "b";
    });
    expect(ga?.totalProbability).toBeCloseTo(0.15, 6);
    expect(ga?.tierCount).toBe(2);
    expect(ga?.totalPoolFraction).toBe(0);
    expect(ga?.totalWeightSum).toBe(150);
    expect(gb?.totalProbability).toBeCloseTo(0.2, 6);
    expect(gb?.totalWeightSum).toBe(200);
  });

  test("family mode orders families by max tier probability", () => {
    const input: CraftLabPreviewRowType[] = [
      row("low", 1, 0.01, 10),
      row("low", 2, 0.02, 20),
      row("high", 1, 0.5, 500),
    ];
    const groups = buildCraftLabPreviewFamilyGroups(input, "family");
    expect(groups[0]?.nameTemplateKey).toBe("high");
    expect(groups[1]?.nameTemplateKey).toBe("low");
  });

  test("probability mode orders families by total probability", () => {
    const input: CraftLabPreviewRowType[] = [
      row("a", 1, 0.1, 100),
      row("a", 2, 0.1, 100),
      row("b", 1, 0.5, 500),
    ];
    const groups = buildCraftLabPreviewFamilyGroups(input, "probability");
    expect(groups[0]?.nameTemplateKey).toBe("b");
    expect(groups[1]?.nameTemplateKey).toBe("a");
  });

  test("rows within a family are ordered by tier descending", () => {
    const input: CraftLabPreviewRowType[] = [
      row("a", 1, 0.1, 100),
      row("a", 3, 0.05, 50),
      row("a", 2, 0.05, 50),
    ];
    const groups = buildCraftLabPreviewFamilyGroups(input, "family");
    const ga = groups.find((g) => {
      return g.nameTemplateKey === "a";
    });
    expect(ga?.rows.map((r) => r.tier)).toEqual([3, 2, 1]);
  });

  test("sums totalPoolFraction when poolFraction is set", () => {
    const input: CraftLabPreviewRowType[] = [
      row("a", 1, 0.05, 100, 0.1),
      row("a", 2, 0.05, 100, 0.1),
    ];
    const groups = buildCraftLabPreviewFamilyGroups(input, "family");
    const ga = groups.find((g) => {
      return g.nameTemplateKey === "a";
    });
    expect(ga?.totalPoolFraction).toBeCloseTo(0.2, 6);
  });
});
