export {};

declare global {
  /**
   * PoE2 / PoE2DB-style single stat slot; `#` 치환 순서와 일치.
   * `statId`는 게임·DB 내부 식별자(예: `base maximum life`).
   */
  interface IModStatRangeType {
    min: number;
    max: number;
    statId?: string;
    /** PoE2DB `지역` — `local_` 등 내부 stat id 로부터 옵션으로 붙임. */
    isLocal?: boolean;
  }

  interface IModTierType {
    /** 1 = best tier. */
    tier: number;
    levelRequirement: number;
    /** PoE2DB 등 — 해당 티 롤에 필요한 지능(위키 Cargo에 없을 수 있음). */
    requiredIntelligence?: number;
    weight: number;
    /** Value ranges for each stat placeholder (#) in the mod template. */
    statRanges: ReadonlyArray<IModStatRangeType>;
    /**
     * PoE2DB·위키에서의 티어 롤 이름(예: 영문 `Hale`, 한글 `정정한`).
     * 시뮬 표시 티어 숫자와 구분.
     */
    tierRollName?: string;
  }

  interface IModDbRecordType {
    modKey: string;
    modType: ModTypeType;
    applicableSubTypes: ReadonlyArray<IBaseItemSubTypeType>;
    requiredItemTags: ReadonlyArray<IBaseItemStatTagType>;
    modTags: ReadonlyArray<string>;
    tierCount: number;
    maxLevelRequirement: number;
    totalWeight: number;
    nameTemplateKey: string;
    tiers?: ReadonlyArray<IModTierType>;
    maxTierBySubType?: Readonly<Partial<Record<IBaseItemSubTypeType, number>>>;
    /**
     * PoE2 `mods.mod_groups` / PoE2DB Family. 동일 패밀리 속성 배타 규칙 등에 사용.
     * 위키 Cargo 매핑(`MOD_WIKI_TIER_SOURCES`)과 동일한 문자열 스케일.
     */
    modFamilyKey?: string;
    /**
     * PoE2 modifier domain (예: 아이템=1). 원본 DB와 동기화할 때만 설정.
     */
    modDomain?: number;
    /**
     * PoE2DB·위키에서의 제작/크래프트 태그(예: `resource`, `생명력`).
     */
    craftTags?: ReadonlyArray<string>;
  }
}

