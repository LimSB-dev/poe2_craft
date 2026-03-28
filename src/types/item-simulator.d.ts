export {};

declare global {
  type ModTypeType = "prefix" | "suffix" | "corruptedPrefix" | "corruptedSuffix";
  /** `normal` = no explicit modifiers; used by Transmutation / Alchemy-style orbs. */
  type ItemRarityType = "normal" | "magic" | "rare";

  interface IModDefinition {
    modKey: string;
    displayName: string;
    tier: number; // 1..5
    modType: ModTypeType;
    weight: number; // probability weight > 0
    isFractured?: boolean;
    isDesecrated?: boolean;
    isDesecratedRevealed?: boolean;
  }

  interface IItemRoll {
    rarity: ItemRarityType;
    prefixes: IModDefinition[];
    suffixes: IModDefinition[];
    hinekoraLockActive?: boolean;
    isCorrupted?: boolean;
  }

  interface IModRollContext {
    rarity: ItemRarityType;
    modType: ModTypeType;
    excludedModKeys: ReadonlySet<string>;
  }

  interface IBaseItemDefinition {
    baseItemKey: string;
    itemClass: string;
    /** Stable key for i18n (e.g. `simulator.itemClass.{itemClassKey}`). */
    itemClassKey: string;
  }

  /** User-selected knobs before rolling a preview. */
  interface ISimulationOptionsType {
    rarity: ItemRarityType;
    desiredPrefixCount: number;
    desiredSuffixCount: number;
  }

  /** One preview: chosen base + rolled mods. */
  interface IItemSimulationResultType {
    baseItem: IBaseItemDefinition;
    roll: IItemRoll;
  }

  interface IDesiredModEntryType {
    id: string;
    modKey: string;
    /** Display line key → `simulator.mods.{nameTemplateKey}` in i18n */
    nameTemplateKey: string;
    modType: ModTypeType;
  }

  type EssenceApplicationRarityRequirementType = "magic" | "rare";
  type IEssenceFamilyKeyFieldType = string;

  interface IEssenceDefinitionType {
    essenceKey: string;
    essenceFamilyKey: IEssenceFamilyKeyFieldType;
    essenceTierGrade: 1 | 2 | 3;
    wikiDropLevel: number;
    referenceSpawnWeight: number;
    displayName: string;
    forcedModKey: string;
    forcedDisplayName: string;
    guaranteedModType: ModTypeType;
    forcedTierMin: number;
    forcedTierMax: number;
    requiresItemRarity: EssenceApplicationRarityRequirementType;
    allowedSubTypes?: ReadonlyArray<string>;
  }

  type BaseItemEquipmentFilterType = "all" | IBaseItemEquipmentTypeType;
  type BaseItemSubTypeFilterType = "all" | IBaseItemSubTypeType;
}

