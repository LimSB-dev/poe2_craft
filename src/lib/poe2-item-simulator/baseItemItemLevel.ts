/** PoE2 장비 아이템 레벨(ilvl) 시뮬레이터에서 허용하는 범위. */
export const BASE_ITEM_ITEM_LEVEL_MIN = 1;
export const BASE_ITEM_ITEM_LEVEL_MAX = 100;

/**
 * 모드 롤 등에 `itemLevel`이 없을 때 쓰는 기본 ilvl.
 * (일반적인 말복·엔드게임 장비 가정)
 */
export const BASE_ITEM_ITEM_LEVEL_DEFAULT = 84;

export const clampBaseItemItemLevel = (value: number): number => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return BASE_ITEM_ITEM_LEVEL_DEFAULT;
  }
  return Math.round(
    Math.min(
      BASE_ITEM_ITEM_LEVEL_MAX,
      Math.max(BASE_ITEM_ITEM_LEVEL_MIN, value),
    ),
  );
};
