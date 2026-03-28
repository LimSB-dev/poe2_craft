import type { WikiExtractedModTierRowType } from "@/lib/poe2-item-simulator/wikiModTierTypes";

export { inferItemStatTagsFromPoe2dbTags } from "@/lib/poe2db/poe2dbStatAffinityPages";

/**
 * 베이스(부위 + str/dex/int)에 맞춰 위키 Cargo `mod_spawn_weights` 행을 걸러낼 때 사용.
 * `IModRollBaseFiltersType`의 부분집합.
 */
export type WikiTierSpawnContextType = {
  baseItemSubType?: IBaseItemSubTypeType;
  /** PoE2DB `tags`에서 추론한 str/dex/int(또는 라우트·테스트에서 명시). */
  itemStatTags?: ReadonlyArray<IBaseItemStatTagType>;
  /** PoE2DB 베이스 `tags` 전체 — 스폰 매칭·추론 보강. */
  poe2dbTags?: ReadonlyArray<string>;
};

/** `roller`의 `IModRollBaseFiltersType`과 동일 필드만 사용(순환 import 방지). */
type WikiTierSpawnFilterInputFiltersType = {
  baseItemSubType?: IBaseItemSubTypeType;
  itemStatTags?: ReadonlyArray<IBaseItemStatTagType>;
  poe2dbTags?: ReadonlyArray<string>;
};

export const wikiTierSpawnContextFromBaseFilters = (
  filters: WikiTierSpawnFilterInputFiltersType | undefined,
): WikiTierSpawnContextType | undefined => {
  if (filters === undefined) {
    return undefined;
  }
  const hasStat =
    filters.itemStatTags !== undefined && filters.itemStatTags.length > 0;
  const hasPoe2db =
    filters.poe2dbTags !== undefined && filters.poe2dbTags.length > 0;
  if (filters.baseItemSubType === undefined && !hasStat && !hasPoe2db) {
    return undefined;
  }
  /** 스폰 번들은 부위가 있어야 의미가 있다. `statTags` 없이 `poe2dbTags`만 있으면 무시. */
  if (filters.baseItemSubType === undefined && hasPoe2db && !hasStat) {
    return undefined;
  }
  return {
    baseItemSubType: filters.baseItemSubType,
    itemStatTags: filters.itemStatTags,
    ...(hasPoe2db ? { poe2dbTags: filters.poe2dbTags } : {}),
  };
};

/**
 * 능력치 미지정(`itemStatTags` 빈 배열)일 때 — 위키 일부 행은 `helmet`/`armour` 대신 `str_armour` 등 **클래스 태그만** 둔다.
 * DB 부위 페이지 기본 뷰에서도 해당 티가 보이게 OR 매칭 후보에 넣는다.
 */
const ALL_WIKI_ARMOUR_CLASS_SPAWN_TAGS: readonly string[] = [
  "str_armour",
  "dex_armour",
  "int_armour",
  "str_dex_armour",
  "str_int_armour",
  "dex_int_armour",
  "str_dex_int_armour",
];

const armourClassWikiTagsFromStatTags = (
  statTags: ReadonlyArray<IBaseItemStatTagType>,
): string[] => {
  const has = (t: IBaseItemStatTagType): boolean => {
    return statTags.includes(t);
  };
  const s = has("str");
  const d = has("dex");
  const i = has("int");
  if (s && d && i) {
    return ["str_dex_int_armour"];
  }
  if (s && d && !i) {
    return ["str_dex_armour"];
  }
  if (s && i && !d) {
    return ["str_int_armour"];
  }
  if (d && i && !s) {
    return ["dex_int_armour"];
  }
  if (s && !d && !i) {
    return ["str_armour"];
  }
  if (d && !s && !i) {
    return ["dex_armour"];
  }
  if (i && !s && !d) {
    return ["int_armour"];
  }
  return [];
};

/**
 * 위키 `mod_spawn_weights`의 방패 능력치 태그(str_shield 등). `shield` 단독 행과 함께 매칭한다.
 */
const shieldClassWikiTagsFromStatTags = (
  statTags: ReadonlyArray<IBaseItemStatTagType>,
): string[] => {
  const has = (t: IBaseItemStatTagType): boolean => {
    return statTags.includes(t);
  };
  const s = has("str");
  const d = has("dex");
  const i = has("int");
  if (s && d && !i) {
    return ["str_dex_shield"];
  }
  if (s && i && !d) {
    return ["str_int_shield"];
  }
  if (s && !d && !i) {
    return ["str_shield"];
  }
  return [];
};

/**
 * PoE2 위키 Cargo에 등장하는 무기/원거리 클래스 태그와의 대응.
 * `weapon` / `one_hand_weapon` / `two_hand_weapon` / `ranged` 는 상위 풀 폭넓게 매칭용.
 */
const WIKI_SPAWN_TAGS_BY_WEAPON_SUBTYPE: Partial<
  Record<IBaseItemSubTypeType, readonly string[]>
> = {
  dagger: ["dagger", "one_hand_weapon", "weapon"],
  oneHandSword: ["sword", "one_hand_weapon", "weapon"],
  oneHandAxe: ["axe", "one_hand_weapon", "weapon"],
  oneHandMace: ["mace", "one_hand_weapon", "weapon"],
  sceptre: ["sceptre", "one_hand_weapon", "weapon"],
  spear: ["spear", "one_hand_weapon", "ranged", "weapon"],
  flail: ["flail", "one_hand_weapon", "weapon"],
  staff: ["staff", "two_hand_weapon", "weapon"],
  wand: ["wand", "one_hand_weapon", "weapon"],
  bow: ["bow", "ranged", "weapon"],
  claw: ["claw", "one_hand_weapon", "weapon"],
  twoHandSword: ["sword", "two_hand_weapon", "weapon"],
  twoHandAxe: ["axe", "two_hand_weapon", "weapon"],
  twoHandMace: ["mace", "two_hand_weapon", "weapon"],
  quarterstaff: ["warstaff", "staff", "two_hand_weapon", "weapon"],
  fishingRod: ["fishing_rod", "weapon"],
  crossbow: ["crossbow", "ranged", "weapon"],
  trap: ["trap", "weapon"],
  talisman: ["talisman", "weapon"],
};

/** 테스트 및 디버깅: 부위별로 어떤 위키 스폰 태그와 OR 매칭하는지. */
/**
 * `mod_spawn_weights` JSON 행의 **단일 슬롯 컬럼** 키(예: `helmet`, `amulet`).
 * 무기류는 태그가 복수라 여기서는 `null` → 티어 가중치는 `buildTierWeights`만 사용.
 */
export const wikiPrimarySpawnWeightColumnTag = (
  subType: IBaseItemSubTypeType,
): string | null => {
  const m: Partial<Record<IBaseItemSubTypeType, string>> = {
    helmet: "helmet",
    bodyArmour: "body_armour",
    gloves: "gloves",
    boots: "boots",
    amulet: "amulet",
    ring: "ring",
    belt: "belt",
    buckler: "shield",
    shield: "shield",
    focus: "focus",
    quiver: "quiver",
  };
  const tag = m[subType];
  return tag ?? null;
};

export const wikiPositiveSpawnTagsForSubType = (
  subType: IBaseItemSubTypeType,
  statTags: ReadonlyArray<IBaseItemStatTagType>,
  poe2dbTags?: ReadonlyArray<string>,
): string[] => {
  const weapon = WIKI_SPAWN_TAGS_BY_WEAPON_SUBTYPE[subType];
  if (weapon !== undefined) {
    return [...new Set([...weapon, ...(poe2dbTags ?? [])])];
  }

  const out: string[] = [];

  const armourLike: IBaseItemSubTypeType[] = ["bodyArmour", "boots", "gloves", "helmet"];
  if (armourLike.includes(subType)) {
    /** 위키 Cargo에 `str_armour` 대신 전 방어구 공통 `armour`만 있는 행(원소 저항 등). */
    out.push("armour");
    out.push(...armourClassWikiTagsFromStatTags(statTags));
    if (statTags.length === 0) {
      const fromPoe2db = (poe2dbTags ?? []).filter((t) => {
        return ALL_WIKI_ARMOUR_CLASS_SPAWN_TAGS.includes(t);
      });
      if (fromPoe2db.length > 0) {
        out.push(...fromPoe2db);
      } else {
        out.push(...ALL_WIKI_ARMOUR_CLASS_SPAWN_TAGS);
      }
    }
    if (subType === "bodyArmour") {
      out.push("body_armour");
    }
    if (subType === "helmet") {
      out.push("helmet");
    }
    if (subType === "gloves") {
      out.push("gloves");
    }
    if (subType === "boots") {
      out.push("boots");
    }
  }

  if (subType === "shield" || subType === "buckler") {
    out.push("shield", ...shieldClassWikiTagsFromStatTags(statTags));
  }

  if (subType === "focus") {
    out.push("focus", ...armourClassWikiTagsFromStatTags(statTags));
    if (statTags.length === 0) {
      const fromPoe2db = (poe2dbTags ?? []).filter((t) => {
        return ALL_WIKI_ARMOUR_CLASS_SPAWN_TAGS.includes(t);
      });
      if (fromPoe2db.length > 0) {
        out.push(...fromPoe2db);
      } else {
        out.push(...ALL_WIKI_ARMOUR_CLASS_SPAWN_TAGS);
      }
    }
  }

  const jewelleryMap: Partial<Record<IBaseItemSubTypeType, string>> = {
    ring: "ring",
    amulet: "amulet",
    belt: "belt",
  };
  const jw = jewelleryMap[subType];
  if (jw !== undefined) {
    out.push(jw);
  }

  if (subType === "quiver") {
    out.push("quiver");
  }

  return [...new Set([...out, ...(poe2dbTags ?? [])])];
};

type WikiSpawnTagBundleType = {
  /** 이 슬롯이 스폰 행에 `value: 0`이면 해당 베이스는 이 티어를 쓸 수 없음. */
  slotExclusionTags: string[];
  /** 하나라도 `value > 0`이면 이 행이 베이스에 적용될 수 있음. */
  positiveMatchTags: string[];
};

const buildWikiSpawnTagBundleForBaseItem = (
  subType: IBaseItemSubTypeType,
  statTags: ReadonlyArray<IBaseItemStatTagType>,
  poe2dbTags: ReadonlyArray<string> | undefined,
): WikiSpawnTagBundleType => {
  const slotExclusionTags: string[] = [];

  if (subType === "boots" || subType === "gloves" || subType === "helmet") {
    slotExclusionTags.push(subType);
  }
  if (subType === "shield" || subType === "buckler") {
    slotExclusionTags.push("shield");
  }
  if (subType === "focus") {
    slotExclusionTags.push("focus");
  }

  const positiveMatchTags = wikiPositiveSpawnTagsForSubType(
    subType,
    statTags,
    poe2dbTags,
  );

  return {
    slotExclusionTags,
    positiveMatchTags: [...new Set(positiveMatchTags)],
  };
};

/** `mod_spawn_weights`에서 방어구 네 부위(투구/장갑/장화/몸통) 중 하나라도 양수로 박혀 있으면 “부위별 티어 줄”로 본다. */
const ARMOUR_GEARSLOT_WIKI_TAGS: ReadonlyArray<string> = [
  "helmet",
  "gloves",
  "boots",
  "body_armour",
];

const wikiSpawnTagForArmourGearSubType = (
  sub: IBaseItemSubTypeType,
): string | undefined => {
  if (sub === "bodyArmour") {
    return "body_armour";
  }
  if (sub === "helmet" || sub === "gloves" || sub === "boots") {
    return sub;
  }
  return undefined;
};

const rowHasPositiveArmourGearSlotWeight = (byTag: Map<string, number>): boolean => {
  return ARMOUR_GEARSLOT_WIKI_TAGS.some((t) => {
    return (byTag.get(t) ?? 0) > 0;
  });
};

/** 위키 `mod_spawn_weights`에 str_armour·int_armour·`armour`(공통) 등이 있으면 부위 슬롯 키 없이도 해당 방어구에 스폰 가능. */
const rowHasPositiveArmourClassWeight = (byTag: Map<string, number>): boolean => {
  if ((byTag.get("armour") ?? 0) > 0) {
    return true;
  }
  const armourClassTags: readonly string[] = [
    "str_armour",
    "dex_armour",
    "int_armour",
    "str_dex_armour",
    "str_int_armour",
    "dex_int_armour",
    "str_dex_int_armour",
  ];
  return armourClassTags.some((t) => {
    return (byTag.get(t) ?? 0) > 0;
  });
};

/**
 * 위키 한 줄이 현재 베이스에 스폰 가능한지(`mod_spawn_weights` 기준 근사).
 * - 슬롯 전용 태그가 `0`이면 해당 부위는 제외(예: flat ES 최상위 티어는 몸통만).
 * - 방어구 네 부위 중 **이 행에 해당 부위 키가 아예 없고**, 다른 부위만 양수면 그 부위 전용 티어로 본다
 *   (예: `IncreasedLife` 상위 티는 `body_armour`만 있어 투구에는 최대 `IncreasedLife10`만 해당).
 * - 방패·무기·포커스 등은 `wikiPositiveSpawnTagsForSubType`으로 `positiveMatchTags`를 채워
 *   위와 같은 이유로 스폰 필터가 빈 집합이 되어 전체 티로 폴백되지 않게 한다.
 * - `positiveMatchTags`가 비어 있으면 필터를 적용하지 않는다(미매핑 슬롯).
 */
export const wikiSpawnRowMatchesBaseItem = (
  row: WikiExtractedModTierRowType,
  context: WikiTierSpawnContextType | undefined,
): boolean => {
  if (context === undefined) {
    return true;
  }
  const sub = context.baseItemSubType;
  const statTags = context.itemStatTags ?? [];
  if (sub === undefined) {
    return true;
  }

  const bundle = buildWikiSpawnTagBundleForBaseItem(
    sub,
    statTags,
    context.poe2dbTags,
  );

  if (bundle.positiveMatchTags.length === 0 && bundle.slotExclusionTags.length === 0) {
    return true;
  }

  const byTag = new Map<string, number>();
  for (const w of row.spawnWeights) {
    byTag.set(w.tag, w.value);
  }

  const armourGearTag = wikiSpawnTagForArmourGearSubType(sub);
  if (armourGearTag !== undefined) {
    const w = byTag.get(armourGearTag);
    if (w === 0) {
      return false;
    }
    if (w === undefined && rowHasPositiveArmourGearSlotWeight(byTag)) {
      /** `body_armour` 키가 없고 투구·장갑·장화만 있으면 부위 전용 티로 본다. 단 `int_armour` 등 클래스 태그가 있으면 몸통 포함 전 방어구 공통 행이다. */
      if (!rowHasPositiveArmourClassWeight(byTag)) {
        return false;
      }
    }
  }

  for (const slot of bundle.slotExclusionTags) {
    const v = byTag.get(slot);
    if (v === 0) {
      return false;
    }
  }

  if (bundle.positiveMatchTags.length === 0) {
    return true;
  }

  return bundle.positiveMatchTags.some((t) => {
    const v = byTag.get(t);
    return v !== undefined && v > 0;
  });
};
