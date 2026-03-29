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

  /** PoE2DB `kr` `스킬 부여:` implicit lines (wand / staff / some weapons). */
  type IBaseItemGrantedSkillKoType = {
    /** `스킬 부여: 레벨 N …` 가 있을 때만. */
    level?: number;
    /** 스킬 이름 (한국어). */
    nameKo: string;
  };

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
    /** Base physical damage (weapon attack bases). PoE2DB `kr` detail `Stats` / keyvals. */
    physicalDamageMin?: number;
    physicalDamageMax?: number;
    /** Local critical strike chance % on weapon bases. */
    criticalStrikeChancePercent?: number;
    /** Attacks per second (weapon bases). */
    attacksPerSecond?: number;
    /** Weapon range (melee / some weapons). */
    weaponRange?: number;
    /** 쇠뇌 재장전 시간(초). PoE2DB `kr` `재장전 시간`. */
    reloadTimeSeconds?: number;
    /** Shield / buckler block chance %. */
    blockChancePercent?: number;
    /**
     * Local / 표시 주문 피해 % 증가 범위 (아이템 박스 `property`에 있을 때만, PoE2DB `kr`).
     * 지팡이·마법봉 베이스는 툴팁에 없을 수 있음.
     */
    spellDamageIncreasedPercentMin?: number;
    spellDamageIncreasedPercentMax?: number;
    /**
     * PoE2DB 상세 아이템 박스 `Stats` 안의 표시 줄 순서( property → requirements → implicitMod ).
     * 한손/양손 무기·장신구·보조 장비 전체 요약용.
     */
    itemStatsLinesKo?: ReadonlyArray<string>;
    /** `property` 줄만 (클래스명, 물리·주문 피해 등). */
    propertyLinesKo?: ReadonlyArray<string>;
    /** `requirements` 한 줄 평문 (예: 요구 사항: 레벨 11, 23 지능). */
    requirementsLineKo?: string;
    /**
     * PoE2DB `kr` item-box implicit lines (`implicitMod`), plain text (tags stripped).
     * Used for jewellery, quivers, wands with grant-skill implicits, etc.
     */
    implicitModLinesKo?: ReadonlyArray<string>;
    /** `implicitModLinesKo` 중 `스킬 부여:` 만 구조화. */
    grantedSkillsKo?: ReadonlyArray<IBaseItemGrantedSkillKoType>;
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

