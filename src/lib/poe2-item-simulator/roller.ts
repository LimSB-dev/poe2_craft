import type { IBaseItemStatTagType, IBaseItemSubTypeType } from "./baseItemDb";
import { MOD_DB } from "./modDb";
import type { IModDbRecordType } from "./modDb";
import { MOD_POOL } from "./modPool";
import type {
  IItemRoll,
  IModDefinition,
  IModRollContext,
  ISimulationOptionsType,
  ItemRarityType,
  ModTypeType,
} from "./types";
import { getRandomIntInclusive, pickWeightedRandom } from "./random";

/** 베이스가 알려질 때만 적용(크래프트 랩 등). 생략 시 기존 전역 MOD_POOL 동작. */
export type IModRollBaseFiltersType = {
  baseItemSubType?: IBaseItemSubTypeType;
  itemStatTags?: ReadonlyArray<IBaseItemStatTagType>;
};

export type IModRollContextInputType = IModRollContext & IModRollBaseFiltersType;

const MOD_KEY_TO_RECORD: ReadonlyMap<string, IModDbRecordType> = new Map(
  MOD_DB.records.map((record) => {
    return [record.modKey, record] as const;
  }),
);

const isModEligibleForBaseFilters = (
  modDefinition: IModDefinition,
  filters: IModRollBaseFiltersType | undefined,
): boolean => {
  if (filters === undefined) {
    return true;
  }
  const hasSubType = filters.baseItemSubType !== undefined;
  const hasStatTags = filters.itemStatTags !== undefined;
  if (!hasSubType && !hasStatTags) {
    return true;
  }
  const record = MOD_KEY_TO_RECORD.get(modDefinition.modKey);
  if (record === undefined) {
    return true;
  }
  if (hasSubType) {
    const subType = filters.baseItemSubType;
    if (subType !== undefined && !record.applicableSubTypes.includes(subType)) {
      return false;
    }
  }
  if (hasStatTags) {
    const tags = filters.itemStatTags;
    if (tags === undefined) {
      return true;
    }
    for (const requiredTag of record.requiredItemTags) {
      if (!tags.includes(requiredTag)) {
        return false;
      }
    }
  }
  return true;
};

const MAGIC_MAX_TIER: number = 3;
const RARE_MAX_TIER: number = 5;

const getTierLimit = (rarity: ItemRarityType): number => {
  if (rarity === "normal") {
    throw new Error("Normal items cannot roll explicit modifiers until rarity is upgraded.");
  }
  if (rarity === "magic") {
    return MAGIC_MAX_TIER;
  }
  return RARE_MAX_TIER;
};

export const rollRandomMod = (modRollContext: IModRollContextInputType): IModDefinition => {
  const tierLimit = getTierLimit(modRollContext.rarity);
  const baseFilters: IModRollBaseFiltersType | undefined =
    modRollContext.baseItemSubType !== undefined || modRollContext.itemStatTags !== undefined
      ? {
          baseItemSubType: modRollContext.baseItemSubType,
          itemStatTags: modRollContext.itemStatTags,
        }
      : undefined;

  const candidates = MOD_POOL.filter((modDefinition) => {
    if (modDefinition.modType !== modRollContext.modType) {
      return false;
    }
    if (modDefinition.tier > tierLimit) {
      return false;
    }
    if (modRollContext.excludedModKeys.has(modDefinition.modKey)) {
      return false;
    }
    if (modDefinition.weight <= 0) {
      return false;
    }
    if (!isModEligibleForBaseFilters(modDefinition, baseFilters)) {
      return false;
    }
    return true;
  });

  if (candidates.length === 0) {
    throw new Error(
      `No candidates available for mod roll. rarity=${modRollContext.rarity} modType=${modRollContext.modType}`
    );
  }

  const weightedChoices = candidates.map((candidate) => ({
    candidate,
    weight: candidate.weight,
  }));

  return pickWeightedRandom(weightedChoices);
};

/**
 * `rollRandomMod`와 동일한 필터로 후보 목록만 반환 (크래프트 랩 시뮬 확률 UI용).
 */
export const listModRollCandidates = (modRollContext: IModRollContextInputType): IModDefinition[] => {
  const tierLimit = getTierLimit(modRollContext.rarity);
  const baseFilters: IModRollBaseFiltersType | undefined =
    modRollContext.baseItemSubType !== undefined || modRollContext.itemStatTags !== undefined
      ? {
          baseItemSubType: modRollContext.baseItemSubType,
          itemStatTags: modRollContext.itemStatTags,
        }
      : undefined;

  return MOD_POOL.filter((modDefinition) => {
    if (modDefinition.modType !== modRollContext.modType) {
      return false;
    }
    if (modDefinition.tier > tierLimit) {
      return false;
    }
    if (modRollContext.excludedModKeys.has(modDefinition.modKey)) {
      return false;
    }
    if (modDefinition.weight <= 0) {
      return false;
    }
    if (!isModEligibleForBaseFilters(modDefinition, baseFilters)) {
      return false;
    }
    return true;
  });
};

const rollRarity = (): ItemRarityType => {
  // Simple distribution: 50% magic, 50% rare.
  const roll = getRandomIntInclusive(1, 100);
  if (roll <= 50) {
    return "magic";
  }
  return "rare";
};

const rollModCountForRarity = (rarity: ItemRarityType, modType: ModTypeType): number => {
  if (rarity === "magic") {
    if (modType === "prefix") {
      return 1;
    }
    return Math.random() < 0.5 ? 1 : 0;
  }

  // Rare
  if (modType === "prefix") {
    return getRandomIntInclusive(2, 3);
  }
  return getRandomIntInclusive(2, 3);
};

export const resolveSimulationCounts = (
  rarity: ItemRarityType,
  desiredPrefixCount: number,
  desiredSuffixCount: number
): { prefixCount: number; suffixCount: number } => {
  const prefixFloored = Math.floor(desiredPrefixCount);
  const suffixFloored = Math.floor(desiredSuffixCount);

  if (rarity === "normal") {
    return { prefixCount: 0, suffixCount: 0 };
  }

  if (rarity === "magic") {
    let prefixCount = Math.min(1, Math.max(0, prefixFloored));
    const suffixCount = Math.min(1, Math.max(0, suffixFloored));
    if (prefixCount === 0 && suffixCount === 0) {
      prefixCount = 1;
    }
    return { prefixCount, suffixCount };
  }

  let prefixCount = Math.min(3, Math.max(0, prefixFloored));
  let suffixCount = Math.min(3, Math.max(0, suffixFloored));
  if (prefixCount === 0 && suffixCount === 0) {
    prefixCount = 2;
    suffixCount = 2;
  }
  return { prefixCount, suffixCount };
};

const buildItemRoll = (
  rarity: ItemRarityType,
  prefixCount: number,
  suffixCount: number,
  baseFilters?: IModRollBaseFiltersType,
): IItemRoll => {
  const maximumPrefixCount = 3;
  const maximumSuffixCount = 3;

  const safePrefixCount = Math.min(Math.max(0, prefixCount), maximumPrefixCount);
  const safeSuffixCount = Math.min(Math.max(0, suffixCount), maximumSuffixCount);

  if (rarity === "normal") {
    if (safePrefixCount > 0 || safeSuffixCount > 0) {
      throw new Error("Normal items cannot have explicit modifiers in this simulator.");
    }
    return {
      rarity: "normal",
      prefixes: [],
      suffixes: [],
    };
  }

  const excludedModKeys = new Set<string>();

  const prefixes: IModDefinition[] = [];
  const suffixes: IModDefinition[] = [];

  for (let prefixIndex = 0; prefixIndex < safePrefixCount; prefixIndex += 1) {
    const rolledMod = rollRandomMod({
      rarity,
      modType: "prefix",
      excludedModKeys,
      ...baseFilters,
    });
    excludedModKeys.add(rolledMod.modKey);
    prefixes.push(rolledMod);
  }

  for (let suffixIndex = 0; suffixIndex < safeSuffixCount; suffixIndex += 1) {
    const rolledMod = rollRandomMod({
      rarity,
      modType: "suffix",
      excludedModKeys,
      ...baseFilters,
    });
    excludedModKeys.add(rolledMod.modKey);
    suffixes.push(rolledMod);
  }

  return {
    rarity,
    prefixes,
    suffixes,
  };
};

/** Full rare reroll with explicit prefix/suffix counts (each capped at 3). Used by Chaos Orb and benchmarks. */
export const rollRareItemRoll = (
  prefixCount: number,
  suffixCount: number,
  baseFilters?: IModRollBaseFiltersType,
): IItemRoll => {
  return buildItemRoll("rare", prefixCount, suffixCount, baseFilters);
};

/**
 * Rolls additional rare prefix/suffix slots using `rollRandomMod`, respecting `initialExcludedModKeys`.
 * Does not mutate the input set.
 */
export const rollRareModSlots = (
  prefixCount: number,
  suffixCount: number,
  initialExcludedModKeys: ReadonlySet<string>,
  baseFilters?: IModRollBaseFiltersType,
): { prefixes: IModDefinition[]; suffixes: IModDefinition[] } => {
  const maximumPrefixCount = 3;
  const maximumSuffixCount = 3;
  const safePrefixCount = Math.min(Math.max(0, prefixCount), maximumPrefixCount);
  const safeSuffixCount = Math.min(Math.max(0, suffixCount), maximumSuffixCount);

  const excludedModKeys = new Set(initialExcludedModKeys);
  const prefixes: IModDefinition[] = [];
  const suffixes: IModDefinition[] = [];

  for (let prefixIndex = 0; prefixIndex < safePrefixCount; prefixIndex += 1) {
    const rolledMod = rollRandomMod({
      rarity: "rare",
      modType: "prefix",
      excludedModKeys,
      ...baseFilters,
    });
    excludedModKeys.add(rolledMod.modKey);
    prefixes.push(rolledMod);
  }

  for (let suffixIndex = 0; suffixIndex < safeSuffixCount; suffixIndex += 1) {
    const rolledMod = rollRandomMod({
      rarity: "rare",
      modType: "suffix",
      excludedModKeys,
      ...baseFilters,
    });
    excludedModKeys.add(rolledMod.modKey);
    suffixes.push(rolledMod);
  }

  return { prefixes, suffixes };
};

export const rollSimulation = (simulationOptions: ISimulationOptionsType): IItemRoll => {
  const { prefixCount, suffixCount } = resolveSimulationCounts(
    simulationOptions.rarity,
    simulationOptions.desiredPrefixCount,
    simulationOptions.desiredSuffixCount
  );
  return buildItemRoll(simulationOptions.rarity, prefixCount, suffixCount);
};

export const rollItem = (): IItemRoll => {
  const rarity = rollRarity();

  const prefixCountCandidate = rollModCountForRarity(rarity, "prefix");
  const suffixCountCandidate = rollModCountForRarity(rarity, "suffix");

  return buildItemRoll(rarity, prefixCountCandidate, suffixCountCandidate);
};

