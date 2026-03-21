import type { IBaseItemDefinition } from "./types";

export type IBaseItemEquipmentTypeType = "weapon" | "offhand" | "armour" | "jewellery";
export type IBaseItemSubTypeType =
  | "dagger"
  | "oneHandSword"
  | "oneHandAxe"
  | "oneHandMace"
  | "sceptre"
  | "spear"
  | "flail"
  | "staff"
  | "wand"
  | "bow"
  | "claw"
  | "twoHandSword"
  | "twoHandAxe"
  | "twoHandMace"
  | "quarterstaff"
  | "fishingRod"
  | "crossbow"
  | "trap"
  | "talisman"
  | "quiver"
  | "shield"
  | "buckler"
  | "helmet"
  | "focus"
  | "gloves"
  | "bodyArmour"
  | "boots"
  | "amulet"
  | "ring"
  | "belt";

export interface IBaseItemDbRecordType {
  baseItemKey: string;
  displayName: string;
  itemClass: string;
  itemClassKey: IBaseItemSubTypeType;
  equipmentType: IBaseItemEquipmentTypeType;
  subType: IBaseItemSubTypeType;
  requiredStrength: number;
  requiredDexterity: number;
  requiredIntelligence: number;
  levelRequirement: number;
  source: "poe2db";
  sourceUrl: string;
}

export interface IBaseItemDbType {
  version: string;
  records: ReadonlyArray<IBaseItemDbRecordType>;
}

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

export const BASE_ITEM_DB: IBaseItemDbType = {
  version: "2026.03.poe2db.snapshot.v1",
  records: [
    {
      baseItemKey: "base_oak_staff",
      displayName: "Ashen Staff",
      itemClass: "Staff",
      itemClassKey: "staff",
      equipmentType: "weapon",
      subType: "staff",
      requiredStrength: 0,
      requiredDexterity: 0,
      requiredIntelligence: 6,
      levelRequirement: 1,
      source: "poe2db",
      sourceUrl: "https://poe2db.tw/us/Ashen_Staff",
    },
    {
      baseItemKey: "base_ember_wand",
      displayName: "Withered Wand",
      itemClass: "Wand",
      itemClassKey: "wand",
      equipmentType: "weapon",
      subType: "wand",
      requiredStrength: 0,
      requiredDexterity: 0,
      requiredIntelligence: 6,
      levelRequirement: 1,
      source: "poe2db",
      sourceUrl: "https://poe2db.tw/us/Withered_Wand",
    },
    {
      baseItemKey: "base_hunter_bow",
      displayName: "Shortbow",
      itemClass: "Bow",
      itemClassKey: "bow",
      equipmentType: "weapon",
      subType: "bow",
      requiredStrength: 0,
      requiredDexterity: 12,
      requiredIntelligence: 0,
      levelRequirement: 5,
      source: "poe2db",
      sourceUrl: "https://poe2db.tw/us/Shortbow",
    },
    {
      baseItemKey: "base_twin_fang_claw",
      displayName: "Pict Claw",
      itemClass: "Claw",
      itemClassKey: "claw",
      equipmentType: "weapon",
      subType: "claw",
      requiredStrength: 0,
      requiredDexterity: 14,
      requiredIntelligence: 0,
      levelRequirement: 6,
      source: "poe2db",
      sourceUrl: "https://poe2db.tw/us/Pict_Claw",
    },
    {
      baseItemKey: "base_iron_helmet",
      displayName: "Soldier Greathelm",
      itemClass: "Helmet",
      itemClassKey: "helmet",
      equipmentType: "armour",
      subType: "helmet",
      requiredStrength: 19,
      requiredDexterity: 0,
      requiredIntelligence: 0,
      levelRequirement: 12,
      source: "poe2db",
      sourceUrl: "https://poe2db.tw/us/Soldier_Greathelm",
    },
    {
      baseItemKey: "base_etched_focus",
      displayName: "Woven Focus",
      itemClass: "Focus",
      itemClassKey: "focus",
      equipmentType: "offhand",
      subType: "focus",
      requiredStrength: 0,
      requiredDexterity: 0,
      requiredIntelligence: 11,
      levelRequirement: 6,
      source: "poe2db",
      sourceUrl: "https://poe2db.tw/us/Woven_Focus",
    },
    {
      baseItemKey: "base_leather_gloves",
      displayName: "Riveted Mitts",
      itemClass: "Gloves",
      itemClassKey: "gloves",
      equipmentType: "armour",
      subType: "gloves",
      requiredStrength: 16,
      requiredDexterity: 0,
      requiredIntelligence: 0,
      levelRequirement: 11,
      source: "poe2db",
      sourceUrl: "https://poe2db.tw/us/Riveted_Mitts",
    },
    {
      baseItemKey: "base_chain_vest",
      displayName: "Fur Plate",
      itemClass: "Body Armour",
      itemClassKey: "bodyArmour",
      equipmentType: "armour",
      subType: "bodyArmour",
      requiredStrength: 10,
      requiredDexterity: 0,
      requiredIntelligence: 0,
      levelRequirement: 4,
      source: "poe2db",
      sourceUrl: "https://poe2db.tw/us/Fur_Plate",
    },
    {
      baseItemKey: "base_hardsole_boots",
      displayName: "Iron Greaves",
      itemClass: "Boots",
      itemClassKey: "boots",
      equipmentType: "armour",
      subType: "boots",
      requiredStrength: 17,
      requiredDexterity: 0,
      requiredIntelligence: 0,
      levelRequirement: 11,
      source: "poe2db",
      sourceUrl: "https://poe2db.tw/us/Iron_Greaves",
    },
    {
      baseItemKey: "base_lapis_amulet",
      displayName: "Lapis Amulet",
      itemClass: "Amulet",
      itemClassKey: "amulet",
      equipmentType: "jewellery",
      subType: "amulet",
      requiredStrength: 0,
      requiredDexterity: 0,
      requiredIntelligence: 0,
      levelRequirement: 8,
      source: "poe2db",
      sourceUrl: "https://poe2db.tw/us/Lapis_Amulet",
    },
    {
      baseItemKey: "base_gold_ring",
      displayName: "Gold Ring",
      itemClass: "Ring",
      itemClassKey: "ring",
      equipmentType: "jewellery",
      subType: "ring",
      requiredStrength: 0,
      requiredDexterity: 0,
      requiredIntelligence: 0,
      levelRequirement: 40,
      source: "poe2db",
      sourceUrl: "https://poe2db.tw/us/Gold_Ring",
    },
    {
      baseItemKey: "base_heavy_belt",
      displayName: "Heavy Belt",
      itemClass: "Belt",
      itemClassKey: "belt",
      equipmentType: "jewellery",
      subType: "belt",
      requiredStrength: 0,
      requiredDexterity: 0,
      requiredIntelligence: 0,
      levelRequirement: 50,
      source: "poe2db",
      sourceUrl: "https://poe2db.tw/us/Heavy_Belt",
    },
  ],
};

export const BASE_ITEMS: ReadonlyArray<IBaseItemDefinition> = BASE_ITEM_DB.records.map((record) => {
  return {
    baseItemKey: record.baseItemKey,
    displayName: record.displayName,
    itemClass: record.itemClass,
    itemClassKey: record.itemClassKey,
  };
});

