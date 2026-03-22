/**
 * 크래프트 랩: 베이스별로 사용한 화폐 순서를 로컬(localStorage)에만 저장합니다.
 */

export const CRAFTING_LAB_USAGE_STORAGE_KEY: string =
  "poe2_craft.craftingLab.usage.v1";

export type CraftingLabUsagePersistType = {
  baseItemKey: string;
  /** 성공 적용 순서대로 화폐 id */
  events: string[];
};

export const readCraftingLabUsage = (): CraftingLabUsagePersistType | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(CRAFTING_LAB_USAGE_STORAGE_KEY);
    if (raw === null || raw.length === 0) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as CraftingLabUsagePersistType).baseItemKey !== "string" ||
      !Array.isArray((parsed as CraftingLabUsagePersistType).events)
    ) {
      return null;
    }
    return parsed as CraftingLabUsagePersistType;
  } catch {
    return null;
  }
};

export const writeCraftingLabUsage = (payload: CraftingLabUsagePersistType): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      CRAFTING_LAB_USAGE_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // quota / private mode — 무시
  }
};

export const aggregateUsageCounts = (
  events: readonly string[],
): Map<string, number> => {
  const map = new Map<string, number>();
  for (const id of events) {
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
};
