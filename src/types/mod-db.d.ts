export {};

declare global {
  interface IModTierType {
    /** 1 = best tier. */
    tier: number;
    levelRequirement: number;
    weight: number;
    /** Value ranges for each stat placeholder (#) in the mod template. */
    statRanges: ReadonlyArray<{ min: number; max: number }>;
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
  }
}

