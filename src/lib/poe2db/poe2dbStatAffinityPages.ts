import { POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE } from "@/lib/poe2db/poe2dbItemClassSlugs";

/**
 * Armour slots on PoE2DB use separate list pages per stat **and** hybrid
 * (e.g. `Gloves_str_dex`).
 */
export const ARMOUR_SUB_TYPES_WITH_POE2DB_STAT_PAGE: ReadonlyArray<IBaseItemSubTypeType> = [
  "gloves",
  "boots",
  "bodyArmour",
  "helmet",
];

/** Route segment and PoE2DB list slug suffix after `Gloves_`, `Boots_`, etc. */
export const DB_ARMOUR_STAT_AFFINITY_VALUES = [
  "str",
  "dex",
  "int",
  "str_dex",
  "str_int",
  "dex_int",
] as const;

export type DbArmourStatAffinityRouteType = (typeof DB_ARMOUR_STAT_AFFINITY_VALUES)[number];

const ARMOUR_STAT_PAGE_SET = new Set<IBaseItemSubTypeType>(
  ARMOUR_SUB_TYPES_WITH_POE2DB_STAT_PAGE,
);

/** PoE2DB wiki slug prefix (before `_${affinity}`) for Modifiers Calc / list pages. */
const POE2DB_STAT_PAGE_PREFIX_BY_SUB_TYPE: Readonly<Record<IBaseItemSubTypeType, string | null>> = {
  gloves: "Gloves",
  boots: "Boots",
  bodyArmour: "Body_Armours",
  helmet: "Helmets",
  claw: null,
  dagger: null,
  wand: null,
  oneHandSword: null,
  oneHandAxe: null,
  oneHandMace: null,
  sceptre: null,
  spear: null,
  flail: null,
  bow: null,
  staff: null,
  twoHandSword: null,
  twoHandAxe: null,
  twoHandMace: null,
  quarterstaff: null,
  fishingRod: null,
  crossbow: null,
  trap: null,
  talisman: null,
  quiver: null,
  shield: null,
  buckler: null,
  focus: null,
  amulet: null,
  ring: null,
  belt: null,
};

export const subTypeUsesPoe2DbStatAffinityPages = (
  subType: IBaseItemSubTypeType,
): boolean => {
  return ARMOUR_STAT_PAGE_SET.has(subType);
};

/**
 * PoE2DB `sourcePageSlug` / path segment, e.g. `Gloves_str` or `Gloves_str_dex`.
 */
export const buildPoe2DbStatAffinitySourceSlug = (
  subType: IBaseItemSubTypeType,
  statAffinity: DbArmourStatAffinityRouteType,
): string | null => {
  const prefix = POE2DB_STAT_PAGE_PREFIX_BY_SUB_TYPE[subType];
  if (prefix === null) {
    return null;
  }
  return `${prefix}_${statAffinity}`;
};

/** Route segment → wiki / spawn filter `itemStatTags` (armour stat pages). */
export const statTagsFromDbArmourStatAffinity = (
  affinity: DbArmourStatAffinityRouteType,
): IBaseItemStatTagType[] => {
  switch (affinity) {
    case "str":
      return ["str"];
    case "dex":
      return ["dex"];
    case "int":
      return ["int"];
    case "str_dex":
      return ["str", "dex"];
    case "str_int":
      return ["str", "int"];
    case "dex_int":
      return ["dex", "int"];
    default: {
      return [];
    }
  }
};

export const parseDbStatAffinityRouteParam = (raw: string): DbArmourStatAffinityRouteType | null => {
  const key = decodeURIComponent(raw).trim().toLowerCase().replace(/\s+/g, "");
  for (const candidate of DB_ARMOUR_STAT_AFFINITY_VALUES) {
    if (key === candidate) {
      return candidate;
    }
  }
  return null;
};

/**
 * PoE2DB 베이스 HTML `Tags`의 방어구·방패 클래스 → 모드 `requiredItemTags`용 str/dex/int.
 * (`str_armour`, `str_dex_shield` 등 — 요구 스탯에서 유도한 `statTags` 필드와 별개.)
 */
export const inferItemStatTagsFromPoe2dbTags = (
  poe2dbTags: ReadonlyArray<string> | undefined,
): ReadonlyArray<IBaseItemStatTagType> => {
  if (poe2dbTags === undefined || poe2dbTags.length === 0) {
    return [];
  }
  const armourOrder = [
    "str_dex_int_armour",
    "str_dex_armour",
    "str_int_armour",
    "dex_int_armour",
    "str_armour",
    "dex_armour",
    "int_armour",
  ] as const;
  for (const key of armourOrder) {
    if (poe2dbTags.includes(key)) {
      switch (key) {
        case "str_dex_int_armour": {
          return ["str", "dex", "int"];
        }
        case "str_dex_armour": {
          return ["str", "dex"];
        }
        case "str_int_armour": {
          return ["str", "int"];
        }
        case "dex_int_armour": {
          return ["dex", "int"];
        }
        case "str_armour": {
          return ["str"];
        }
        case "dex_armour": {
          return ["dex"];
        }
        case "int_armour": {
          return ["int"];
        }
        default: {
          return [];
        }
      }
    }
  }
  const shieldOrder = [
    "str_dex_shield",
    "str_int_shield",
    "str_shield",
    "dex_shield",
  ] as const;
  for (const key of shieldOrder) {
    if (poe2dbTags.includes(key)) {
      switch (key) {
        case "str_dex_shield": {
          return ["str", "dex"];
        }
        case "str_int_shield": {
          return ["str", "int"];
        }
        case "str_shield": {
          return ["str"];
        }
        case "dex_shield": {
          return ["dex"];
        }
        default: {
          return [];
        }
      }
    }
  }
  return [];
};

/**
 * 모드 풀·크래프트 랩·DB 능력치 구분용 속성 태그. **항상 PoE2DB `tags`만** 해석한다.
 * 레코드의 `statTags`(요구 스탯 유도)는 사용하지 않는다.
 */
export const itemAttributeStatTagsForModFiltering = (
  record: Pick<IBaseItemDbRecordType, "tags">,
): ReadonlyArray<IBaseItemStatTagType> => {
  return inferItemStatTagsFromPoe2dbTags(record.tags);
};

/**
 * Maps inferred attribute tags to PoE2DB armour stat/hybrid **route** pages.
 * - Pure STR/DEX/INT: only that single-stat page.
 * - Hybrids: every matching hybrid row (STR+DEX → `str_dex`, etc.).
 * - Empty tags: shown on every armour stat page (shared low-tier bases).
 *   베이스 목록 필터에는 `itemAttributeStatTagsForModFiltering` 결과를 넘긴다.
 */
export const matchesBaseItemToArmourStatAffinity = (
  statTags: ReadonlyArray<IBaseItemStatTagType>,
  affinity: DbArmourStatAffinityRouteType,
): boolean => {
  if (statTags.length === 0) {
    return true;
  }
  const hasS = statTags.includes("str");
  const hasD = statTags.includes("dex");
  const hasI = statTags.includes("int");

  switch (affinity) {
    case "str":
      return hasS && !hasD && !hasI;
    case "dex":
      return hasD && !hasS && !hasI;
    case "int":
      return hasI && !hasS && !hasD;
    case "str_dex":
      return hasS && hasD;
    case "str_int":
      return hasS && hasI;
    case "dex_int":
      return hasD && hasI;
    default: {
      return false;
    }
  }
};

/**
 * `ModsView` / `#ModifiersCalc` URL 슬러그 목록 — 방어구 4부위는 능력치별(`Helmets_str` 등), 그 외는 단일 슬러그.
 * `weightsByWikiModIdAndPoe2DbPageSlug` 조회 시 `wikiTierContext`와 맞춘다.
 */
export const resolvePoe2DbModifiersCalcPageSlugsForWikiTierContext = (
  baseItemSubType: IBaseItemSubTypeType | undefined,
  itemStatTags: ReadonlyArray<IBaseItemStatTagType> | undefined,
): readonly string[] => {
  if (baseItemSubType === undefined) {
    return [];
  }
  if (subTypeUsesPoe2DbStatAffinityPages(baseItemSubType)) {
    const tags = itemStatTags ?? [];
    const slugs: string[] = [];
    for (const affinity of DB_ARMOUR_STAT_AFFINITY_VALUES) {
      if (matchesBaseItemToArmourStatAffinity(tags, affinity)) {
        const s = buildPoe2DbStatAffinitySourceSlug(baseItemSubType, affinity);
        if (s !== null) {
          slugs.push(s);
        }
      }
    }
    return slugs;
  }
  const single = POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE[baseItemSubType];
  return single !== undefined && single.length > 0 ? [single] : [];
};
