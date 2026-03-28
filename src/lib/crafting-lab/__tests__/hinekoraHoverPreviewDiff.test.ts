import { buildHinekoraExplicitSlotHighlights } from "@/lib/crafting-lab/hinekoraHoverPreviewDiff";

const mod = (
  key: string,
  tier: number,
  name: string,
  kind: ModTypeType,
  statRanges?: ReadonlyArray<IModStatRangeType>,
): IModDefinition => {
  const m: IModDefinition = {
    modKey: key,
    tier,
    displayName: name,
    modType: kind,
    weight: 100,
  };
  if (statRanges !== undefined && statRanges.length > 0) {
    m.statRanges = statRanges;
  }
  return m;
};

describe("buildHinekoraExplicitSlotHighlights", () => {
  test("같은 modKey·티어여도 statRanges가 다르면 해당 슬롯 강조", () => {
    const baseline: IItemRoll = {
      rarity: "rare",
      prefixes: [
        mod("Life1", 5, "IncreasedLife", "prefix", [
          { min: 70, max: 79, statId: "x" },
        ]),
      ],
      suffixes: [],
    };
    const preview: IItemRoll = {
      rarity: "rare",
      prefixes: [
        mod("Life1", 5, "IncreasedLife", "prefix", [
          { min: 80, max: 89, statId: "x" },
        ]),
      ],
      suffixes: [],
    };
    const h = buildHinekoraExplicitSlotHighlights(preview, baseline);
    expect(h.prefix[0]).toBe(true);
  });

  test("modKey·티어·statRanges까지 동일하면 멀티셋상 변화 없음 → 강조 없음", () => {
    const ranges = [{ min: 70, max: 79, statId: "x" }] as const;
    const baseline: IItemRoll = {
      rarity: "rare",
      prefixes: [mod("Life1", 5, "IncreasedLife", "prefix", [...ranges])],
      suffixes: [],
    };
    const preview: IItemRoll = {
      rarity: "rare",
      prefixes: [mod("Life1", 5, "IncreasedLife", "prefix", [...ranges])],
      suffixes: [],
    };
    const h = buildHinekoraExplicitSlotHighlights(preview, baseline);
    expect(h.prefix[0]).toBe(false);
  });
});
