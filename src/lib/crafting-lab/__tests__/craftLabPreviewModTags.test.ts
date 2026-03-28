import {
  craftLabPreviewTagChipClassName,
  getCraftLabPreviewTagLabelsForModKey,
} from "@/lib/crafting-lab/craftLabPreviewModTags";

describe("craftLabPreviewModTags", () => {
  test("getCraftLabPreviewTagLabelsForModKey returns modTags for known modKey", () => {
    const tags = getCraftLabPreviewTagLabelsForModKey("prefix_max_life");
    expect(tags.length).toBeGreaterThan(0);
  });

  test("getCraftLabPreviewTagLabelsForModKey prefers craftTags when set", () => {
    expect(getCraftLabPreviewTagLabelsForModKey("suffix_minion_spell_gem_level")).toEqual([
      "minion",
      "spell",
    ]);
  });

  test("getCraftLabPreviewTagLabelsForModKey returns empty for unknown key", () => {
    expect(getCraftLabPreviewTagLabelsForModKey("__no_such_mod__").length).toBe(0);
  });

  test("craftLabPreviewTagChipClassName maps common English craft tags", () => {
    expect(craftLabPreviewTagChipClassName("life")).toContain("emerald");
    expect(craftLabPreviewTagChipClassName("unknown_tag_xyz")).toContain("zinc");
  });
});
