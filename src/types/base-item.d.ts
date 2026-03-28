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
    /**
     * 요구 힘/민/지에서 유도한 str/dex/int (참고·레거시).
     * 모드 풀·크래프트 필터에는 쓰지 않고 `tags` 기반 `itemAttributeStatTagsForModFiltering`를 쓴다.
     */
    statTags: ReadonlyArray<IBaseItemStatTagType>;
    /**
     * PoE2DB 상세 페이지 `Tags` 행 — `str_armour`, `str_shield`, `helmet`, `ezomyte_basetype` 등.
     * 속성·모드 적합성의 기준.
     */
    tags?: ReadonlyArray<string>;
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

