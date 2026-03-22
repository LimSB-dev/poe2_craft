import {
  RARE_FULL_REROLL_AFFIX_MAX,
  RARE_FULL_REROLL_AFFIX_MIN,
  type IPrefixSuffixSplitType,
} from "./chaosOrb";
import { getRandomIntInclusive } from "./random";
import { rollRareModSlots, type IModRollBaseFiltersType } from "./roller";
import type { IEssenceDefinitionType, IItemRoll, IModDefinition, ModTypeType } from "./types";

const RARE_MAX_PREFIX_SLOTS: number = 3;
const RARE_MAX_SUFFIX_SLOTS: number = 3;

/**
 * Extra prefix/suffix counts after placing one forced mod on `guaranteedModType`,
 * such that extras fill the remaining slots of a full rare (4–6 total affixes).
 */
export const getValidExtraSplitsAfterForcedMod = (
  remainingAffixCount: number,
  guaranteedModType: ModTypeType
): ReadonlyArray<IPrefixSuffixSplitType> => {
  const reservedPrefixSlots = guaranteedModType === "prefix" ? 1 : 0;
  const reservedSuffixSlots = guaranteedModType === "suffix" ? 1 : 0;
  const maxExtraPrefix = RARE_MAX_PREFIX_SLOTS - reservedPrefixSlots;
  const maxExtraSuffix = RARE_MAX_SUFFIX_SLOTS - reservedSuffixSlots;

  const splits: IPrefixSuffixSplitType[] = [];
  for (let extraPrefix = 0; extraPrefix <= maxExtraPrefix; extraPrefix += 1) {
    const extraSuffix = remainingAffixCount - extraPrefix;
    if (extraSuffix >= 0 && extraSuffix <= maxExtraSuffix) {
      splits.push({ prefixCount: extraPrefix, suffixCount: extraSuffix });
    }
  }
  return splits;
};

const pickRandomSplit = (splits: ReadonlyArray<IPrefixSuffixSplitType>): IPrefixSuffixSplitType => {
  if (splits.length === 0) {
    throw new Error("Essence: no valid prefix/suffix split.");
  }
  const index = getRandomIntInclusive(0, splits.length - 1);
  const chosen = splits[index];
  if (!chosen) {
    throw new Error("Essence: split index out of range.");
  }
  return chosen;
};

const buildForcedMod = (essence: IEssenceDefinitionType): IModDefinition => {
  const tier = getRandomIntInclusive(essence.forcedTierMin, essence.forcedTierMax);

  return {
    modKey: essence.forcedModKey,
    displayName: essence.forcedDisplayName,
    tier,
    modType: essence.guaranteedModType,
    weight: 1,
  };
};

/**
 * Converts the item to **rare**, guarantees one essence mod (tier in 1..3 by default),
 * then fills remaining affixes at random (4–6 total, same range as Chaos Orb full reroll).
 * Prior affixes on `item` are discarded (simplified PoE-style essence craft).
 */
/** 에센스는 베이스 롤을 희귀 풀리롤로 바꾸며, 희귀도·기존 옵션 제약 없이 항상 적용 가능. */
export const canApplyEssence = (item: IItemRoll): boolean => {
  void item;
  return true;
};

export const applyEssence = (
  _item: IItemRoll,
  essence: IEssenceDefinitionType,
  baseFilters?: IModRollBaseFiltersType,
): IItemRoll => {
  const forcedMod = buildForcedMod(essence);
  const totalAffixes = getRandomIntInclusive(RARE_FULL_REROLL_AFFIX_MIN, RARE_FULL_REROLL_AFFIX_MAX);
  const remainingAffixes = totalAffixes - 1;

  const splits = getValidExtraSplitsAfterForcedMod(remainingAffixes, essence.guaranteedModType);
  const { prefixCount: extraPrefixCount, suffixCount: extraSuffixCount } = pickRandomSplit(splits);

  const excludedModKeys = new Set<string>([forcedMod.modKey]);
  const rolled = rollRareModSlots(extraPrefixCount, extraSuffixCount, excludedModKeys, baseFilters);

  const prefixes: IModDefinition[] =
    essence.guaranteedModType === "prefix" ? [forcedMod, ...rolled.prefixes] : [...rolled.prefixes];

  const suffixes: IModDefinition[] =
    essence.guaranteedModType === "suffix" ? [forcedMod, ...rolled.suffixes] : [...rolled.suffixes];

  return {
    rarity: "rare",
    prefixes,
    suffixes,
  };
};

export const LIFE_ESSENCE: IEssenceDefinitionType = {
  essenceKey: "essence_life",
  displayName: "Life Essence",
  forcedModKey: "essence_forced_life",
  forcedDisplayName: "+Maximum Life (Essence)",
  guaranteedModType: "suffix",
  forcedTierMin: 1,
  forcedTierMax: 3,
};

export const ATTACK_ESSENCE: IEssenceDefinitionType = {
  essenceKey: "essence_attack",
  displayName: "Attack Essence",
  forcedModKey: "essence_forced_attack",
  forcedDisplayName: "+% Increased Physical Attack Damage (Essence)",
  guaranteedModType: "prefix",
  forcedTierMin: 1,
  forcedTierMax: 3,
};

export const EXAMPLE_ESSENCES: ReadonlyArray<IEssenceDefinitionType> = [LIFE_ESSENCE, ATTACK_ESSENCE];
