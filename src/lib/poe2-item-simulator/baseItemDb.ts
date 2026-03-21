import type { IBaseItemDefinition } from "./types";

export type IBaseItemEquipmentTypeType = "weapon" | "armour" | "accessory";
export type IBaseItemSubTypeType =
  | "staff"
  | "wand"
  | "bow"
  | "claw"
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

export const BASE_ITEM_DB: IBaseItemDbType = {
  version: "2026.03.poe2db.snapshot.v1",
  records: [
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

