/**
 * Armour slots on PoE2DB use separate Modifiers Calc pages per stat **and** hybrid
 * (e.g. {@link https://poe2db.tw/kr/Gloves_str_dex#ModifiersCalc Gloves_str_dex}).
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
 * Maps a base item's `statTags` to PoE2DB armour stat/hybrid pages.
 * - Pure STR/DEX/INT: only that single-stat page.
 * - Hybrids: every matching hybrid row (STR+DEX → `str_dex`, etc.).
 * - Triple-attribute bases match all three hybrid pages.
 * - Empty tags: shown on every armour stat page (shared low-tier bases).
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
