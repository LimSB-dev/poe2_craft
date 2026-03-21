export type ModTypeType = "prefix" | "suffix";

export type ItemRarityType = "magic" | "rare";

export interface IModDefinition {
  modKey: string;
  displayName: string;
  tier: number; // 1..5
  modType: ModTypeType;
  weight: number; // probability weight > 0
}

export interface IItemRoll {
  rarity: ItemRarityType;
  prefixes: IModDefinition[];
  suffixes: IModDefinition[];
}

export interface IModRollContext {
  rarity: ItemRarityType;
  modType: ModTypeType;
  excludedModKeys: ReadonlySet<string>;
}

export interface IBaseItemDefinition {
  baseItemKey: string;
  displayName: string;
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

