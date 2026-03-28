import {
  CRAFT_LAB_ORB_SLOT_IDS,
  orbSlotIdToFamilyKind,
  type CraftingCurrencyIdType,
  type CraftingLabOrbSlotIdType,
  type CraftingOrbFamilyIdType,
  type CurrencyTierIndexType,
} from "@/lib/crafting-lab/craftingLabCurrencyIds";
import type { IModRollBaseFiltersType } from "@/lib/poe2-item-simulator/roller";

/**
 * PoE2 위키 **Minimum Modifier Level** (롤되는 속성의 최소 레벨 요구; 실전에선 보통 아이템 레벨과 함께 맞춤).
 *
 * - 매직용 오브(진화·확장): Greater 55, Perfect 70
 *   @see https://www.poe2wiki.net/wiki/Orb_of_Transmutation
 *   @see https://www.poe2wiki.net/wiki/Orb_of_Augmentation
 * - 레어용 오브(카오스·엑잘·제왕): Greater 35, Perfect 50
 *   @see https://www.poe2wiki.net/wiki/Chaos_Orb
 *   @see https://www.poe2wiki.net/wiki/Exalted_Orb
 *   @see https://www.poe2wiki.net/wiki/Regal_Orb
 *
 * 크래프트 랩에서는 **아이템 레벨(slider) ≥ 이 값**일 때만 해당 티어 슬롯 사용 가능으로 둔다.
 */
const CRAFT_LAB_ORB_FAMILY_MIN_MODIFIER_LEVEL: Readonly<
  Partial<
    Record<
      CraftingOrbFamilyIdType,
      Readonly<{
        /** Greater (t2) */
        2: number;
        /** Perfect (t3) */
        3: number;
      }>
    >
  >
> = {
  orb_transmutation: { 2: 55, 3: 70 },
  orb_augmentation: { 2: 55, 3: 70 },
  orb_chaos: { 2: 35, 3: 50 },
  orb_exalted: { 2: 35, 3: 50 },
  orb_regal: { 2: 35, 3: 50 },
};

/** 에센스(매직 승격 계열) — 위키에서 오브와 동일 티어 규칙을 두는 경우가 많아 매직 오브와 동일 최소치를 쓴다. */
const CRAFT_LAB_ESSENCE_TIER_MIN_MODIFIER_LEVEL: Readonly<
  Record<Exclude<CurrencyTierIndexType, 1>, number>
> = {
  2: 55,
  3: 70,
};

/** @deprecated 패밀리별 `CRAFT_LAB_ORB_FAMILY_MIN_MODIFIER_LEVEL` 사용 */
export const CRAFT_LAB_TIERED_CURRENCY_MIN_ITEM_LEVEL = {
  1: 1,
  2: 55,
  3: 70,
} as const;

/** @deprecated 패밀리별 `CRAFT_LAB_ORB_FAMILY_MIN_MODIFIER_LEVEL` 사용 */
export const CRAFT_LAB_TIERED_ORB_MIN_ITEM_LEVEL = CRAFT_LAB_TIERED_CURRENCY_MIN_ITEM_LEVEL;

export const getCraftLabOrbSlotTierIndexFromSlotId = (
  id: CraftingLabOrbSlotIdType,
): CurrencyTierIndexType | null => {
  if (id.endsWith("_t1")) {
    return 1;
  }
  if (id.endsWith("_t2")) {
    return 2;
  }
  if (id.endsWith("_t3")) {
    return 3;
  }
  return null;
};

/** 티어 오브 슬롯이 아니면 `null`(추가 ilvl 제한 없음). t1 → 1. */
export const getMinItemLevelForCraftLabOrbSlot = (
  id: CraftingLabOrbSlotIdType,
): number | null => {
  const tier = getCraftLabOrbSlotTierIndexFromSlotId(id);
  if (tier === null) {
    return null;
  }
  if (tier === 1) {
    return 1;
  }
  const family = orbSlotIdToFamilyKind(id);
  const row = CRAFT_LAB_ORB_FAMILY_MIN_MODIFIER_LEVEL[family];
  if (row === undefined) {
    return null;
  }
  return row[tier];
};

/** `essence_attack_t2` 등 `*_t1|2|3` 접미사. t1→1, t2/t3→매직 오브와 동일 최소 속성 레벨 가정. */
export const getCraftLabEssenceTierMinItemLevel = (
  essenceKey: string,
): number | null => {
  const match = essenceKey.match(/_t([123])$/);
  if (match === null || match[1] === undefined) {
    return null;
  }
  const tier = Number.parseInt(match[1], 10) as CurrencyTierIndexType;
  if (tier === 1) {
    return 1;
  }
  if (tier === 2) {
    return CRAFT_LAB_ESSENCE_TIER_MIN_MODIFIER_LEVEL[2];
  }
  if (tier === 3) {
    return CRAFT_LAB_ESSENCE_TIER_MIN_MODIFIER_LEVEL[3];
  }
  return null;
};

export const isCraftLabEssenceItemLevelAllowed = (
  essenceKey: string,
  itemLevel: number,
): boolean => {
  const min = getCraftLabEssenceTierMinItemLevel(essenceKey);
  if (min === null) {
    return true;
  }
  return itemLevel >= min;
};

export const isCraftLabOrbSlotItemLevelAllowed = (
  id: CraftingLabOrbSlotIdType,
  itemLevel: number,
): boolean => {
  const min = getMinItemLevelForCraftLabOrbSlot(id);
  if (min === null) {
    return true;
  }
  return itemLevel >= min;
};

/**
 * 롤 후보 티어 행에 쓰는 `levelRequirement` 하한(= {@link getMinItemLevelForCraftLabOrbSlot}와 동일 수치).
 * 일반(t1)은 1.
 */
export const getModifierLevelFloorForCraftLabOrbSlot = (
  id: CraftingLabOrbSlotIdType,
): number => {
  const min = getMinItemLevelForCraftLabOrbSlot(id);
  return min === null ? 1 : min;
};

/** 에센스 티어에 대응하는 속성 레벨 하한(일반 t1 → 1). */
export const getModifierLevelFloorForCraftLabEssenceKey = (
  essenceKey: string,
): number => {
  const min = getCraftLabEssenceTierMinItemLevel(essenceKey);
  return min === null ? 1 : min;
};

/**
 * 적용 중인 화폐(오브 슬롯 id / 에센스 id)에 맞춰 `minModifierLevelFloor`를 합성한다.
 * 연금·분열 등 티어 없는 화폐는 원본 그대로.
 */
export const mergeModRollFiltersWithCurrencyTierFloor = (
  base: IModRollBaseFiltersType | undefined,
  currencyId: CraftingCurrencyIdType,
): IModRollBaseFiltersType | undefined => {
  if (base === undefined) {
    return undefined;
  }
  let floor = 1;
  if (CRAFT_LAB_ORB_SLOT_IDS.includes(currencyId as CraftingLabOrbSlotIdType)) {
    floor = getModifierLevelFloorForCraftLabOrbSlot(
      currencyId as CraftingLabOrbSlotIdType,
    );
  } else if (currencyId.startsWith("essence_")) {
    floor = getModifierLevelFloorForCraftLabEssenceKey(currencyId);
  }
  if (floor <= 1) {
    return base;
  }
  return { ...base, minModifierLevelFloor: floor };
};
