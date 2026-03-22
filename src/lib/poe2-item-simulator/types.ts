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
}

export interface IItemRoll {
  rarity: ItemRarityType;
  prefixes: IModDefinition[];
  suffixes: IModDefinition[];
  /** 히네코라의 자물쇠 적용 후 — 다음 화폐 1회 결과를 예견한 뒤 적용 가능 */
  hinekoraLockActive?: boolean;
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

/** Crafting essence: guarantees one mod (tier `forcedTierMin`..`forcedTierMax`, typically 1–3). */
export interface IEssenceDefinitionType {
  essenceKey: string;
  displayName: string;
  forcedModKey: string;
  forcedDisplayName: string;
  guaranteedModType: ModTypeType;
  forcedTierMin: number;
  forcedTierMax: number;
}

