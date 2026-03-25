import { resolveAppSupportedLocale, type AppSupportedLocaleType } from "@/lib/i18n/appLocales";

const POE2DB_SITE_ORIGIN = "https://poe2db.tw";

/**
 * PoE2DB wiki segment for UI languages (path is `/{segment}/Wiki_Page`).
 * Matches poe2db.tw locale switcher.
 */
const APP_LOCALE_TO_POE2DB_PATH: Readonly<Record<AppSupportedLocaleType, string>> = {
  ko: "kr",
  en: "us",
  ja: "jp",
  "zh-CN": "cn",
};

/**
 * `IBaseItemSubTypeType` → PoE2DB item-class page slug (e.g. One_Hand_Swords).
 * Aligns with `applicableItemClass.code` in `poe2db-modifiers.full.json`.
 */
export const POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE: Readonly<
  Record<IBaseItemSubTypeType, string>
> = {
  claw: "Claws",
  dagger: "Daggers",
  wand: "Wands",
  oneHandSword: "One_Hand_Swords",
  oneHandAxe: "One_Hand_Axes",
  oneHandMace: "One_Hand_Maces",
  sceptre: "Sceptres",
  spear: "Spears",
  flail: "Flails",
  bow: "Bows",
  staff: "Staves",
  twoHandSword: "Two_Hand_Swords",
  twoHandAxe: "Two_Hand_Axes",
  twoHandMace: "Two_Hand_Maces",
  quarterstaff: "Quarterstaves",
  fishingRod: "Fishing_Rods",
  crossbow: "Crossbows",
  trap: "Traps",
  talisman: "Talismans",
  quiver: "Quivers",
  shield: "Shields",
  buckler: "Bucklers",
  focus: "Foci",
  gloves: "Gloves",
  boots: "Boots",
  bodyArmour: "Body_Armours",
  helmet: "Helmets",
  amulet: "Amulets",
  ring: "Rings",
  belt: "Belts",
};

export const resolvePoe2DbPathLocale = (appLocale: string): string => {
  const resolved = resolveAppSupportedLocale(appLocale);
  return APP_LOCALE_TO_POE2DB_PATH[resolved];
};

/**
 * Full URL to the PoE2DB item-class page (modifiers list for that weapon/armour class).
 * PoE2DB uses `/{locale}/{WikiSlug}` (not `db/{slug}`).
 */
export const buildPoe2DbItemClassPageUrl = (
  appLocale: string,
  subType: IBaseItemSubTypeType,
): string => {
  const pathLocale = resolvePoe2DbPathLocale(appLocale);
  const slug = POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE[subType];
  return `${POE2DB_SITE_ORIGIN}/${pathLocale}/${slug}`;
};

export const tryBuildPoe2DbItemClassPageUrl = (
  appLocale: string,
  subType: string,
): string | null => {
  const slug =
    POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE[subType as IBaseItemSubTypeType];
  if (slug === undefined) {
    return null;
  }
  return `${POE2DB_SITE_ORIGIN}/${resolvePoe2DbPathLocale(appLocale)}/${slug}`;
};
