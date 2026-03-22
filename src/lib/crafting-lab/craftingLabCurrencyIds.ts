/**
 * 크래프트 랩 화폐 id — 일부 오브는 게임과 같이 **티어(3단)** 슬롯이 있다.
 * 연금술 오브는 PoE2에서 일반(단일)만 두고 티어 슬롯은 두지 않는다.
 * 제왕의 오브는 일반·상위·완벽(티어 3종) 슬롯이 있다.
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
    "orb_chaos",
    "orb_exalted",
    "orb_regal",
  ] as const;

export type CraftingLabTieredOrbIdType =
  | "orb_transmutation_t1"
  | "orb_transmutation_t2"
  | "orb_transmutation_t3"
  | "orb_augmentation_t1"
  | "orb_augmentation_t2"
  | "orb_augmentation_t3"
  | "orb_chaos_t1"
  | "orb_chaos_t2"
  | "orb_chaos_t3"
  | "orb_exalted_t1"
  | "orb_exalted_t2"
  | "orb_exalted_t3"
  | "orb_regal_t1"
  | "orb_regal_t2"
  | "orb_regal_t3";

export type CraftingLabOrbSlotIdType =
  | CraftingLabTieredOrbIdType
  | "orb_alchemy"
  | "orb_fracturing"
  | "orb_annulment";

export type CraftingCurrencyIdType =
  | CraftingLabOrbSlotIdType
  | "orb_divine"
  /** 바알 오브(타락) — UI만, 시뮬 미구현 */
  | "orb_vaal"
  /** 히네코라의 자물쇠 — 시뮬: 예견 후 다음 화폐 적용 */
  | "orb_hinekoras_lock"
  /** 칼란드라의 거울 — UI만, 시뮬 미구현 */
  | "orb_mirror"
  | "essence_life"
  | "essence_attack"
  | "omen_placeholder";

/**
 * 화폐 탭 하단 행(표시 순): 바알·디바인·히네코라·미러 — 히네코라만 시뮬 연결.
 */
export const CRAFT_LAB_CURRENCY_TAB_BOTTOM_ROW: readonly CraftingCurrencyIdType[] =
  ["orb_vaal", "orb_divine", "orb_hinekoras_lock", "orb_mirror"] as const;

/**
 * 창고 오브 UI: 5줄(각 3티어) + 마지막 줄(연금술·소멸·분열) — {@link CRAFT_LAB_ORB_UI_GROUPS}.
 */
export const CRAFT_LAB_ORB_UI_GROUPS: readonly (readonly CraftingOrbFamilyIdType[])[] =
  [
    ["orb_transmutation"],
    ["orb_augmentation"],
    ["orb_regal"],
    ["orb_exalted"],
    ["orb_chaos"],
    ["orb_alchemy", "orb_annulment", "orb_fracturing"],
  ] as const;

export const CRAFT_LAB_ORB_FAMILY_ORDER: readonly CraftingOrbFamilyIdType[] =
  CRAFT_LAB_ORB_UI_GROUPS.flat() as readonly CraftingOrbFamilyIdType[];

export const expandOrbFamilyToSlotIds = (
  family: CraftingOrbFamilyIdType,
): readonly CraftingLabOrbSlotIdType[] => {
  if (
    family === "orb_transmutation" ||
    family === "orb_augmentation" ||
    family === "orb_chaos" ||
    family === "orb_exalted" ||
    family === "orb_regal"
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

/** 창고 그리드 한 줄씩(슬롯 id) — UI에서 행 간격·라벨에 사용. */
export const getCraftLabOrbSlotIdsGrouped = (): CraftingLabOrbSlotIdType[][] => {
  return CRAFT_LAB_ORB_UI_GROUPS.map((rowFamilies) => {
    return rowFamilies.flatMap((family) => {
      return [...expandOrbFamilyToSlotIds(family)];
    });
  });
};

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
  orb_chaos: "orb_chaos_t1",
  orb_exalted: "orb_exalted_t1",
  orb_regal: "orb_regal_t1",
};

/**
 * localStorage 등 레거시 이벤트 id 정규화 (구버전 단일 키 → 티어 슬롯 id).
 */
export const normalizeCraftingCurrencyEventId = (id: string): string => {
  if (
    id === "orb_alchemy_t1" ||
    id === "orb_alchemy_t2" ||
    id === "orb_alchemy_t3"
  ) {
    return "orb_alchemy";
  }
  const mapped = LEGACY_ORB_ID_TO_TIER1[id];
  if (mapped !== undefined) {
    return mapped;
  }
  return id;
};
