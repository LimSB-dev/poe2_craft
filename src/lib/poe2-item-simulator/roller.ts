import { MOD_POOL } from "./modPool";
import type { IItemRoll, IModDefinition, IModRollContext, ItemRarityType, ModTypeType } from "./types";
import { getRandomIntInclusive, pickWeightedRandom } from "./random";

const MAGIC_MAX_TIER: number = 3;
const RARE_MAX_TIER: number = 5;

const getTierLimit = (rarity: ItemRarityType): number => {
  if (rarity === "magic") {
    return MAGIC_MAX_TIER;
  }
  return RARE_MAX_TIER;
};

export const rollRandomMod = (modRollContext: IModRollContext): IModDefinition => {
  const tierLimit = getTierLimit(modRollContext.rarity);

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

export const rollItem = (): IItemRoll => {
  const rarity = rollRarity();

  const maximumPrefixCount = 3;
  const maximumSuffixCount = 3;

  const prefixCountCandidate = rollModCountForRarity(rarity, "prefix");
  const suffixCountCandidate = rollModCountForRarity(rarity, "suffix");

  const prefixCount = Math.min(prefixCountCandidate, maximumPrefixCount);
  const suffixCount = Math.min(suffixCountCandidate, maximumSuffixCount);

  const excludedModKeys = new Set<string>();

  const prefixes: IModDefinition[] = [];
  const suffixes: IModDefinition[] = [];

  for (let prefixIndex = 0; prefixIndex < prefixCount; prefixIndex += 1) {
    const rolledMod = rollRandomMod({
      rarity,
      modType: "prefix",
      excludedModKeys,
    });
    excludedModKeys.add(rolledMod.modKey);
    prefixes.push(rolledMod);
  }

  for (let suffixIndex = 0; suffixIndex < suffixCount; suffixIndex += 1) {
    const rolledMod = rollRandomMod({
      rarity,
      modType: "suffix",
      excludedModKeys,
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

