/**
 * 크래프트 랩 화폐 id — 일부 오브는 게임과 같이 **티어(3단)** 슬롯이 있다.
 * 티어별 수치·가중치는 아직 시뮬에 없으므로, 적용 로직은 동일 패밀리로 묶는다.
 */

export type CurrencyTierIndexType = 1 | 2 | 3;

/** 시뮬레이터 `basicCurrencyOrbs`와 1:1 대응하는 오브 패밀리(티어 없음 = 패밀리 id 그대로). */
export type CraftingOrbFamilyIdType =
  | "orb_transmutation"
  | "orb_augmentation"
  | "orb_regal"
  | "orb_alchemy"
  | "orb_exalted"
  | "orb_fracturing"
  | "orb_chaos"
  | "orb_annulment";

/**
 * 티어 3종으로 나뉘는 오브 패밀리(창고 UI는 3열 그리드 한 줄).
 */
export const CRAFT_LAB_ORB_FAMILIES_WITH_THREE_TIERS: readonly CraftingOrbFamilyIdType[] =
  [
    "orb_transmutation",
    "orb_augmentation",
    "orb_alchemy",
    "orb_chaos",
    "orb_exalted",
  ] as const;

export type CraftingLabTieredOrbIdType =
  | "orb_transmutation_t1"
  | "orb_transmutation_t2"
  | "orb_transmutation_t3"
  | "orb_augmentation_t1"
  | "orb_augmentation_t2"
  | "orb_augmentation_t3"
  | "orb_alchemy_t1"
  | "orb_alchemy_t2"
  | "orb_alchemy_t3"
  | "orb_chaos_t1"
  | "orb_chaos_t2"
  | "orb_chaos_t3"
  | "orb_exalted_t1"
  | "orb_exalted_t2"
  | "orb_exalted_t3";

export type CraftingLabOrbSlotIdType =
  | CraftingLabTieredOrbIdType
  | "orb_regal"
  | "orb_fracturing"
  | "orb_annulment";

export type CraftingCurrencyIdType =
  | CraftingLabOrbSlotIdType
  | "orb_divine"
  | "essence_life"
  | "essence_attack"
  | "omen_placeholder";

/**
 * 창고 오브: 게임과 같이 티어 오브는 3열, 그 다음 한 줄에 단일 오브 3종(제왕·분열·소멸).
 */
export const CRAFT_LAB_ORB_FAMILY_ORDER: readonly CraftingOrbFamilyIdType[] = [
  "orb_transmutation",
  "orb_augmentation",
  "orb_alchemy",
  "orb_chaos",
  "orb_exalted",
  "orb_regal",
  "orb_fracturing",
  "orb_annulment",
] as const;

export const expandOrbFamilyToSlotIds = (
  family: CraftingOrbFamilyIdType,
): readonly CraftingLabOrbSlotIdType[] => {
  if (
    family === "orb_transmutation" ||
    family === "orb_augmentation" ||
    family === "orb_alchemy" ||
    family === "orb_chaos" ||
    family === "orb_exalted"
  ) {
    return [
      `${family}_t1`,
      `${family}_t2`,
      `${family}_t3`,
    ] as const satisfies readonly CraftingLabOrbSlotIdType[];
  }
  return [family];
};

export const CRAFT_LAB_ORB_SLOT_IDS: readonly CraftingLabOrbSlotIdType[] =
  CRAFT_LAB_ORB_FAMILY_ORDER.flatMap((family) => {
    return [...expandOrbFamilyToSlotIds(family)];
  });

/**
 * 티어 슬롯 id → 시뮬 적용에 쓰는 패밀리 id (예: orb_transmutation_t2 → orb_transmutation).
 */
export const orbSlotIdToFamilyKind = (
  id: CraftingLabOrbSlotIdType,
): CraftingOrbFamilyIdType => {
  for (const family of CRAFT_LAB_ORB_FAMILIES_WITH_THREE_TIERS) {
    if (
      id === `${family}_t1` ||
      id === `${family}_t2` ||
      id === `${family}_t3`
    ) {
      return family;
    }
  }
  return id as CraftingOrbFamilyIdType;
};

/** 슬롯 우하단 로마 숫자 표기용. 단일 오브는 null. */
export const getOrbSlotTierRoman = (
  id: CraftingLabOrbSlotIdType,
): "I" | "II" | "III" | null => {
  if (id.endsWith("_t1")) {
    return "I";
  }
  if (id.endsWith("_t2")) {
    return "II";
  }
  if (id.endsWith("_t3")) {
    return "III";
  }
  return null;
};

const LEGACY_ORB_ID_TO_TIER1: Readonly<Record<string, string>> = {
  orb_transmutation: "orb_transmutation_t1",
  orb_augmentation: "orb_augmentation_t1",
  orb_alchemy: "orb_alchemy_t1",
  orb_chaos: "orb_chaos_t1",
  orb_exalted: "orb_exalted_t1",
};

/**
 * localStorage 등 레거시 이벤트 id 정규화 (구버전 단일 키 → 티어 슬롯 id).
 */
export const normalizeCraftingCurrencyEventId = (id: string): string => {
  const mapped = LEGACY_ORB_ID_TO_TIER1[id];
  if (mapped !== undefined) {
    return mapped;
  }
  return id;
};
