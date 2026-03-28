import {
  craftLabPreviewMergeKey,
  mergeCraftLabPreviewRows,
} from "@/lib/crafting-lab/craftLabPreviewMerge";
import type { CraftLabPreviewRowType } from "@/lib/crafting-lab/craftLabOrbPreview";

describe("mergeCraftLabPreviewRows", () => {
  it("같은 modKey·statRanges면 표시 티어가 달라도 한 줄로 합치고 티어는 더 좋은 쪽(작은 숫자)을 남긴다", () => {
    const ranges = [{ min: 12, max: 19 }, { min: 22, max: 32 }];
    const a: CraftLabPreviewRowType = {
      modKey: "prefix_added_phys_damage_attack",
      nameTemplateKey: "prefix_added_phys_damage_attack",
      tier: 1,
      probability: 0.05,
      weight: 357,
      poolFraction: 0.1,
      statRanges: ranges,
    };
    const b: CraftLabPreviewRowType = {
      modKey: "prefix_added_phys_damage_attack",
      nameTemplateKey: "prefix_added_phys_damage_attack",
      tier: 2,
      probability: 0.0168,
      weight: 119,
      poolFraction: 0.05,
      statRanges: ranges,
    };
    const merged = mergeCraftLabPreviewRows([a, b]);
    expect(merged).toHaveLength(1);
    expect(merged[0].tier).toBe(1);
    expect(merged[0].probability).toBeCloseTo(0.05 + 0.0168, 6);
    expect(merged[0].weight).toBe(357);
    expect(merged[0].poolFraction).toBeCloseTo(0.15, 6);
  });

  it("statRanges가 다르면 병합하지 않는다", () => {
    const base = {
      modKey: "m",
      nameTemplateKey: "m",
      tier: 1,
      probability: 0.1,
      weight: 100,
    };
    const merged = mergeCraftLabPreviewRows([
      { ...base, statRanges: [{ min: 1, max: 2 }] },
      { ...base, statRanges: [{ min: 3, max: 4 }] },
    ]);
    expect(merged).toHaveLength(2);
  });

  it("statRanges가 없으면 modKey·티어로만 구분한다", () => {
    const a: CraftLabPreviewRowType = {
      modKey: "m",
      nameTemplateKey: "m",
      tier: 1,
      probability: 0.1,
      weight: 1,
    };
    const b: CraftLabPreviewRowType = {
      modKey: "m",
      nameTemplateKey: "m",
      tier: 2,
      probability: 0.2,
      weight: 1,
    };
    expect(craftLabPreviewMergeKey(a)).not.toBe(craftLabPreviewMergeKey(b));
    const merged = mergeCraftLabPreviewRows([a, b]);
    expect(merged).toHaveLength(2);
  });
});
