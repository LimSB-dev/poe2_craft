export {};

declare global {
  type IBaseItemEquipmentTypeType = "weapon" | "offhand" | "armour" | "jewellery";

  type IBaseItemSubTypeType =
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

  /** Primary stat tags derived from stat requirements (str/dex/int > 0). */
  type IBaseItemStatTagType = "str" | "dex" | "int";

  interface IBaseItemDbRecordType {
    baseItemKey: string;
    itemClass: string;
    itemClassKey: IBaseItemSubTypeType;
    equipmentType: IBaseItemEquipmentTypeType;
    subType: IBaseItemSubTypeType;
    requiredStrength: number;
    requiredDexterity: number;
    requiredIntelligence: number;
    levelRequirement: number;
    /** Primary stat tags derived from required attributes. Used to filter which mods can appear. */
    statTags: ReadonlyArray<IBaseItemStatTagType>;
    /** Base armour value (undefined for items with no armour). */
    armour?: number;
    /** Base evasion value (undefined for items with no evasion). */
    evasion?: number;
    /** Base energy shield value (undefined for items with no energy shield). */
    energyShield?: number;
    source: "poe2db";
    sourceUrl: string;
    /** i18n keys referencing `simulator.baseItemImplicits.*` */
    implicitMods?: ReadonlyArray<string>;
  }

  interface IBaseItemDbType {
    version: string;
    records: ReadonlyArray<IBaseItemDbRecordType>;
  }
}

