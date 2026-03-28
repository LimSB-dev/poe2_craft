import {
  areExplicitModsStillValidAtItemLevel,
  needsCraftLabItemLevelChangeConfirmation,
} from "@/lib/crafting-lab/craftLabItemLevelChangeGate";
import type { IModRollBaseFiltersType } from "@/lib/poe2-item-simulator/roller";

describe("needsCraftLabItemLevelChangeConfirmation", () => {
  const emptyItem: IItemRoll = {
    rarity: "normal",
    prefixes: [],
    suffixes: [],
  };

  const filters: IModRollBaseFiltersType = {
    baseItemSubType: "ring",
    itemStatTags: [],
    itemLevel: 50,
  };

  it("명시 옵션이 없으면 확인 불필요", () => {
    expect(
      needsCraftLabItemLevelChangeConfirmation(emptyItem, false, 10, filters),
    ).toBe(false);
  });

  it("영혼의 우물이 열려 있으면 항상 확인", () => {
    const withMod: IItemRoll = {
      rarity: "rare",
      prefixes: [
        {
          modKey: "test",
          displayName: "x",
          tier: 1,
          modType: "prefix",
          weight: 1,
        },
      ],
      suffixes: [],
    };
    expect(
      needsCraftLabItemLevelChangeConfirmation(withMod, true, 80, filters),
    ).toBe(true);
  });

  it("베이스 필터가 없고 옵션이 있으면 확인", () => {
    const withMod: IItemRoll = {
      rarity: "rare",
      prefixes: [
        {
          modKey: "test",
          displayName: "x",
          tier: 1,
          modType: "prefix",
          weight: 1,
        },
      ],
      suffixes: [],
    };
    expect(
      needsCraftLabItemLevelChangeConfirmation(withMod, false, 80, undefined),
    ).toBe(true);
  });
});

describe("areExplicitModsStillValidAtItemLevel", () => {
  it("미공개 타락 줄이 있으면 false", () => {
    const item: IItemRoll = {
      rarity: "rare",
      prefixes: [
        {
          modKey: "desecrated_unrevealed_x",
          displayName: "x",
          tier: 1,
          modType: "prefix",
          weight: 1,
          isDesecrated: true,
          isDesecratedRevealed: false,
        },
      ],
      suffixes: [],
    };
    const filters: IModRollBaseFiltersType = {
      baseItemSubType: "ring",
      itemStatTags: [],
      itemLevel: 80,
    };
    expect(areExplicitModsStillValidAtItemLevel(item, 80, filters)).toBe(
      false,
    );
  });
});
