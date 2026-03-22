import type { IItemRoll } from "./types";

/**
 * 히네코라의 자물쇠 — 다음에 사용할 화폐 1회의 결과를 미리 볼 수 있게 한다(시뮬: 예견 후 확인 시 적용).
 * 게임: 그 외 방식으로 아이템을 바꾸면 예견이 사라진다 → 여기서는 다른 화폐 적용 시 플래그 제거.
 */

export const stripHinekoraLock = (item: IItemRoll): IItemRoll => {
  if (item.hinekoraLockActive !== true) {
    return item;
  }
  return {
    rarity: item.rarity,
    prefixes: item.prefixes,
    suffixes: item.suffixes,
  };
};

export const canApplyHinekorasLock = (item: IItemRoll): boolean => {
  return item.hinekoraLockActive !== true;
};

/**
 * 자물쇠 적용: 옵션 수치는 바꾸지 않고, 다음 화폐 1회에 대해 예견 가능 상태만 켠다.
 */
export const applyHinekorasLock = (item: IItemRoll): IItemRoll => {
  if (!canApplyHinekorasLock(item)) {
    throw new Error("Hinekora's Lock is already active on this item.");
  }
  return {
    ...stripHinekoraLock(item),
    hinekoraLockActive: true,
  };
};
