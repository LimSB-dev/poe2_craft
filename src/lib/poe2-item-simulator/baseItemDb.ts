import poe2dbBaseItemRecords from "@/lib/poe2-item-simulator/data/poe2dbBaseItems.generated.json";

export const BASE_ITEM_SUB_TYPES_BY_EQUIPMENT: Readonly<
  Record<IBaseItemEquipmentTypeType, ReadonlyArray<IBaseItemSubTypeType>>
> = {
  weapon: [
    "claw",
    "dagger",
    "wand",
    "oneHandSword",
    "oneHandAxe",
    "oneHandMace",
    "sceptre",
    "spear",
    "flail",
    "bow",
    "staff",
    "twoHandSword",
    "twoHandAxe",
    "twoHandMace",
    "quarterstaff",
    "fishingRod",
    "crossbow",
    "trap",
    "talisman",
  ],
  offhand: ["quiver", "shield", "buckler", "focus"],
  armour: ["gloves", "boots", "bodyArmour", "helmet"],
  jewellery: ["amulet", "ring", "belt"],
};

export const BASE_ITEM_DB: { version: string; records: ReadonlyArray<IBaseItemDbRecordType> } = {
  version: "2026.03.poe2db.extract.v5",
  records: poe2dbBaseItemRecords as IBaseItemDbRecordType[],
};
export const BASE_ITEMS: ReadonlyArray<IBaseItemDefinition> = BASE_ITEM_DB.records.map((record) => {
  return {
    baseItemKey: record.baseItemKey,
    itemClass: record.itemClass,
    itemClassKey: record.itemClassKey,
  };
});

