/**
 * 워크스페이스에서 고른 베이스 아이템 키를 localStorage에만 저장합니다 (다음 방문 시 복원).
 */

import { BASE_ITEMS } from "@/lib/poe2-item-simulator/baseItems";

export const SELECTED_BASE_ITEM_KEY_STORAGE_KEY: string =
  "poe2_craft.selectedBaseItemKey.v1";

export const readPersistedSelectedBaseItemKey = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(SELECTED_BASE_ITEM_KEY_STORAGE_KEY);
    if (raw === null || raw.length === 0) {
      return null;
    }
    const exists = BASE_ITEMS.some((item) => {
      return item.baseItemKey === raw;
    });
    return exists ? raw : null;
  } catch {
    return null;
  }
};

export const persistSelectedBaseItemKey = (baseItemKey: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      SELECTED_BASE_ITEM_KEY_STORAGE_KEY,
      baseItemKey,
    );
  } catch {
    // quota / private mode — 무시
  }
};
