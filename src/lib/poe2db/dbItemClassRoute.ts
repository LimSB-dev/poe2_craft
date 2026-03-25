import { BASE_ITEM_SUB_TYPES_BY_EQUIPMENT } from "@/lib/poe2-item-simulator/baseItemDb";
import { POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE } from "@/lib/poe2db/poe2dbItemClassPageUrl";

/** Stable order: weapon → offhand → armour → jewellery (same as base item DB grouping). */
export const DB_ITEM_CLASS_ROUTE_ORDER: readonly IBaseItemSubTypeType[] = Object.values(
  BASE_ITEM_SUB_TYPES_BY_EQUIPMENT,
).flat() as IBaseItemSubTypeType[];

const SUB_TYPE_SET = new Set<IBaseItemSubTypeType>(DB_ITEM_CLASS_ROUTE_ORDER);

const normalizeRouteKey = (value: string): string => {
  return decodeURIComponent(value).trim();
};

const compactKey = (value: string): string => {
  return value.replace(/_/g, "").toLowerCase();
};

/**
 * Resolves dynamic `/db/[itemClass]` segment to our internal subtype.
 * Accepts internal keys (`claw`) and PoE2DB wiki slugs (`Claws`, `One_Hand_Swords`).
 */
export const parseDbItemClassRouteParam = (raw: string): IBaseItemSubTypeType | null => {
  const key = normalizeRouteKey(raw);
  if (key.length === 0) {
    return null;
  }
  if (SUB_TYPE_SET.has(key as IBaseItemSubTypeType)) {
    return key as IBaseItemSubTypeType;
  }
  const compact = compactKey(key);
  for (const subType of SUB_TYPE_SET) {
    if (compactKey(subType) === compact) {
      return subType;
    }
  }
  for (const [subType, wikiSlug] of Object.entries(POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE)) {
    if (compactKey(wikiSlug) === compact || wikiSlug === key) {
      return subType as IBaseItemSubTypeType;
    }
  }
  return null;
};

export const itemClassToDbPathSegment = (subType: IBaseItemSubTypeType): string => {
  return subType;
};
