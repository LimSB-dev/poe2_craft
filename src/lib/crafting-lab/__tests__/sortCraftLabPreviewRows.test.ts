import { sortCraftLabPreviewRows } from "@/lib/crafting-lab/sortCraftLabPreviewRows";
import type { CraftLabPreviewRowType } from "@/lib/crafting-lab/craftLabOrbPreview";

const row = (
  nameTemplateKey: string,
  modKey: string,
  tier: number,
  probability: number,
  weight: number,
): CraftLabPreviewRowType => {
  return { modKey, nameTemplateKey, tier, probability, weight };
};

describe("sortCraftLabPreviewRows", () => {
  it("family mode groups same nameTemplateKey and orders families by max probability", () => {
    const input = [
      row("life", "m_life_t3", 3, 0.1, 100),
      row("armour", "m_arm_t1", 1, 0.05, 50),
      row("life", "m_life_t1", 1, 0.2, 200),
    ];
    const sorted = sortCraftLabPreviewRows(input, "family");
    expect(sorted.map((r) => {
      return r.modKey;
    })).toEqual(["m_life_t1", "m_life_t3", "m_arm_t1"]);
  });

  it("probability mode sorts by probability descending", () => {
    const input = [
      row("a", "a", 1, 0.1, 1),
      row("b", "b", 1, 0.3, 1),
    ];
    const sorted = sortCraftLabPreviewRows(input, "probability");
    expect(sorted[0].modKey).toBe("b");
  });

  it("tier mode sorts by tier ascending", () => {
    const input = [
      row("x", "x", 3, 0.5, 1),
      row("x", "x", 1, 0.5, 1),
    ];
    const sorted = sortCraftLabPreviewRows(input, "tier");
    expect(sorted[0].tier).toBe(1);
  });
});
