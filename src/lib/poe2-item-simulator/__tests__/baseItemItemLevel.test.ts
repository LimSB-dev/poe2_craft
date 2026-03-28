import {
  BASE_ITEM_ITEM_LEVEL_DEFAULT,
  BASE_ITEM_ITEM_LEVEL_MAX,
  BASE_ITEM_ITEM_LEVEL_MIN,
  clampBaseItemItemLevel,
} from "@/lib/poe2-item-simulator/baseItemItemLevel";

describe("clampBaseItemItemLevel", () => {
  test("clamps to bounds and rounds", () => {
    expect(clampBaseItemItemLevel(0)).toBe(BASE_ITEM_ITEM_LEVEL_MIN);
    expect(clampBaseItemItemLevel(150)).toBe(BASE_ITEM_ITEM_LEVEL_MAX);
    expect(clampBaseItemItemLevel(45.7)).toBe(46);
  });

  test("non-finite falls back to default", () => {
    expect(clampBaseItemItemLevel(Number.NaN)).toBe(BASE_ITEM_ITEM_LEVEL_DEFAULT);
    expect(clampBaseItemItemLevel(Number.POSITIVE_INFINITY)).toBe(
      BASE_ITEM_ITEM_LEVEL_DEFAULT,
    );
  });
});
