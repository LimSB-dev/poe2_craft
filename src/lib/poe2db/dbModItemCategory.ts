export type DbModItemCategoryIdType =
  | "oneHandWeapon"
  | "twoHandWeapon"
  | "jewellery"
  | "gloves"
  | "boots"
  | "bodyArmour"
  | "helmet"
  | "offhand";

/** Order matches PoE2DB-style grouping: 한손 → 양손 → 장신구 → 방어구 슬롯 → 보조. */
export const DB_MOD_ITEM_CATEGORY_ORDER: readonly DbModItemCategoryIdType[] = [
  "oneHandWeapon",
  "twoHandWeapon",
  "jewellery",
  "gloves",
  "boots",
  "bodyArmour",
  "helmet",
  "offhand",
];

export const DB_MOD_ITEM_CATEGORY_SUB_TYPES: Readonly<
  Record<DbModItemCategoryIdType, ReadonlyArray<IBaseItemSubTypeType>>
> = {
  oneHandWeapon: [
    "claw",
    "dagger",
    "wand",
    "oneHandSword",
    "oneHandAxe",
    "oneHandMace",
    "sceptre",
    "spear",
    "flail",
  ],
  twoHandWeapon: [
    "bow",
    "staff",
    "twoHandSword",
    "twoHandAxe",
    "twoHandMace",
    "quarterstaff",
    "crossbow",
    "trap",
    "talisman",
  ],
  jewellery: ["amulet", "ring", "belt"],
  gloves: ["gloves"],
  boots: ["boots"],
  bodyArmour: ["bodyArmour"],
  helmet: ["helmet"],
  offhand: ["quiver", "shield", "buckler", "focus"],
};

const CATEGORY_SUBTYPE_SETS: Readonly<Record<DbModItemCategoryIdType, Set<IBaseItemSubTypeType>>> = {
  oneHandWeapon: new Set(DB_MOD_ITEM_CATEGORY_SUB_TYPES.oneHandWeapon),
  twoHandWeapon: new Set(DB_MOD_ITEM_CATEGORY_SUB_TYPES.twoHandWeapon),
  jewellery: new Set(DB_MOD_ITEM_CATEGORY_SUB_TYPES.jewellery),
  gloves: new Set(DB_MOD_ITEM_CATEGORY_SUB_TYPES.gloves),
  boots: new Set(DB_MOD_ITEM_CATEGORY_SUB_TYPES.boots),
  bodyArmour: new Set(DB_MOD_ITEM_CATEGORY_SUB_TYPES.bodyArmour),
  helmet: new Set(DB_MOD_ITEM_CATEGORY_SUB_TYPES.helmet),
  offhand: new Set(DB_MOD_ITEM_CATEGORY_SUB_TYPES.offhand),
};

export const modRecordMatchesItemCategory = (
  record: IModDbRecordType,
  categoryId: DbModItemCategoryIdType,
): boolean => {
  const allowed = CATEGORY_SUBTYPE_SETS[categoryId];
  return record.applicableSubTypes.some((subType) => {
    return allowed.has(subType);
  });
};
