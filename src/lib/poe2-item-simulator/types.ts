export type ModTypeType = "prefix" | "suffix" | "corruptedPrefix" | "corruptedSuffix";

/** `normal` = no explicit modifiers; used by Transmutation / Alchemy-style orbs. */
export type ItemRarityType = "normal" | "magic" | "rare";

export interface IModDefinition {
  modKey: string;
  displayName: string;
  tier: number; // 1..5
  modType: ModTypeType;
  weight: number; // probability weight > 0
  /** 분열의 오브(Fracturing Orb) 등으로 고정된 옵션 — 제거·변경 불가(시뮬 범위). */
  isFractured?: boolean;
  /** 심연 타락(Desecrated) 옵션 — 영혼의 우물 공개 전에는 미공개 줄로 표시. */
  isDesecrated?: boolean;
  /** false이면 미공개(녹색 기호). 공개 후 true. */
  isDesecratedRevealed?: boolean;
}

export interface IItemRoll {
  rarity: ItemRarityType;
  prefixes: IModDefinition[];
  suffixes: IModDefinition[];
  /** 히네코라의 자물쇠 적용 후 — 다음 화폐 1회 결과를 예견한 뒤 적용 가능 */
  hinekoraLockActive?: boolean;
  /** 징조: 부패(Putrefaction) 등 — 타락 처리된 아이템(시뮬 플래그). */
  isCorrupted?: boolean;
}

export interface IModRollContext {
  rarity: ItemRarityType;
  modType: ModTypeType;
  excludedModKeys: ReadonlySet<string>;
}

export interface IBaseItemDefinition {
  baseItemKey: string;
  itemClass: string;
  /** Stable key for i18n (e.g. `simulator.itemClass.{itemClassKey}`). */
  itemClassKey: string;
}

/** User-selected knobs before rolling a preview. */
export interface ISimulationOptionsType {
  rarity: ItemRarityType;
  desiredPrefixCount: number;
  desiredSuffixCount: number;
}

/** One preview: chosen base + rolled mods. */
export interface IItemSimulationResultType {
  baseItem: IBaseItemDefinition;
  roll: IItemRoll;
}

/** A mod the user has explicitly marked as desired for the crafting target. */
export interface IDesiredModEntryType {
  /** Unique ID for list management (modKey + timestamp). */
  id: string;
  modKey: string;
  /** i18n key → `simulator.mods.{nameTemplateKey}` */
  nameTemplateKey: string;
  modType: ModTypeType;
}

/** PoE2: Lesser/Normal/Greater 에센스는 보통 매직에만, Perfect 등은 희귀에만 적용. */
export type EssenceApplicationRarityRequirementType = "magic" | "rare";

/**
 * Crafting essence: guarantees one mod (tier `forcedTierMin`..`forcedTierMax`, typically 1–3).
 * `allowedSubTypes`는 `baseItemDb`의 `subType` 값과 동일한 문자열이어야 한다.
 */
export interface IEssenceDefinitionType {
  essenceKey: string;
  displayName: string;
  forcedModKey: string;
  forcedDisplayName: string;
  guaranteedModType: ModTypeType;
  forcedTierMin: number;
  forcedTierMax: number;
  /** 게임 규칙상 적용 가능한 희귀도(기본: Lesser 계열 = magic). */
  requiresItemRarity: EssenceApplicationRarityRequirementType;
  /**
   * 비어 있지 않으면 선택한 베이스 `subType`이 이 목록에 있을 때만 적용 가능.
   * (PoE2 위키의 Armour / Jewellery / Martial Weapon 등 구분과 대응.)
   */
  allowedSubTypes?: ReadonlyArray<string>;
}

