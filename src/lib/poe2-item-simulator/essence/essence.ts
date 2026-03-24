import {
  RARE_FULL_REROLL_AFFIX_MAX,
  RARE_FULL_REROLL_AFFIX_MIN,
  type IPrefixSuffixSplitType,
} from "../currency/chaosOrb";
import type { IBaseItemSubTypeType } from "../baseItemDb";
import {
  assertRollNotCorruptedForStandardCrafting,
  isCorruptedRoll,
} from "../itemCorruptionCraftingGuard";
import craftLabEssenceWikiTiers from "../data/craftLabEssenceWikiTiers.json";
import { getRandomIntInclusive } from "../random";
import { rollRareModSlots, type IModRollBaseFiltersType } from "../roller";
import type {
  EssenceApplicationRarityRequirementType,
  IEssenceDefinitionType,
  IItemRoll,
  IModDefinition,
  ModTypeType,
} from "../types";

const RARE_MAX_PREFIX_SLOTS: number = 3;
const RARE_MAX_SUFFIX_SLOTS: number = 3;

/**
 * PoE2 (wiki: Essence) — 요약
 * - Lesser / normal / greater: **매직** 아이템을 **희귀**로 승격시키고 보장 옵션 1개를 붙인 뒤 나머지를 채운다.
 * - Perfect / 일부 corrupted: **희귀**에서 무작위 옵션 1개를 제거하고 새 보장 옵션을 붙인다 — 이 시뮬에는 미구현.
 * - 보장 옵션 수치·종류는 에센스 종류와 **장비 슬롯(방어구/무기/주얼 등)** 에 따라 다르다.
 * @see https://www.poe2wiki.net/wiki/Essence
 */

/**
 * Lesser Essence of Abrasion — 위키 기준 적용 가능한 무기·원거리 슬롯 (물리 추가 피해).
 * wand / staff / focus 등 주문 무기는 제외.
 */
export const LESSER_ABRASION_APPLICABLE_SUB_TYPES: readonly string[] = [
  "dagger",
  "oneHandSword",
  "oneHandAxe",
  "oneHandMace",
  "claw",
  "spear",
  "flail",
  "bow",
  "twoHandSword",
  "twoHandAxe",
  "twoHandMace",
  "quarterstaff",
  "crossbow",
] as const;

/**
 * Lesser Essence of the Body — 위키: Armour or Belt / Jewellery(아뮬렛·링) 등 구간별 수치.
 */
export const LESSER_BODY_APPLICABLE_SUB_TYPES: readonly string[] = [
  "bodyArmour",
  "belt",
  "amulet",
  "ring",
] as const;

/** 화염·냉기·번개 무기 에센스 — Abrasion과 동일 슬롯. */
export const LESSER_ELEMENTAL_WEAPON_SUB_TYPES: readonly string[] = [
  ...LESSER_ABRASION_APPLICABLE_SUB_TYPES,
];

/** 방어구·벨트·주얼: 화염·냉기·번개·카오스 저항 (Insulation, Thawing, Grounding, Ruin). */
export const LESSER_ARMOUR_BELT_JEWELLERY_RES_SUB_TYPES: readonly IBaseItemSubTypeType[] = [
  "helmet",
  "bodyArmour",
  "gloves",
  "boots",
  "shield",
  "buckler",
  "belt",
  "amulet",
  "ring",
];

/** Lesser Enhancement — 방어구(Armour equipment)만. */
export const LESSER_ENHANCEMENT_SUB_TYPES: readonly IBaseItemSubTypeType[] = [
  "helmet",
  "bodyArmour",
  "gloves",
  "boots",
  "shield",
  "buckler",
];

/** Lesser Mind — 벨트·부츠·장갑·투구·주얼(벨트·몸통 제외). */
export const LESSER_MIND_SUB_TYPES: readonly IBaseItemSubTypeType[] = [
  "belt",
  "boots",
  "gloves",
  "helmet",
  "amulet",
  "ring",
];

/** Lesser Opulence — 부츠·장갑·투구·주얼. */
export const LESSER_OPULENCE_SUB_TYPES: readonly IBaseItemSubTypeType[] = [
  "boots",
  "gloves",
  "helmet",
  "amulet",
  "ring",
];

/** Alacrity / Sorcery — Focus, Wand, Staff. */
export const LESSER_SPELL_WEAPON_SUB_TYPES: readonly IBaseItemSubTypeType[] = [
  "focus",
  "wand",
  "staff",
];

/** Lesser Haste — 근접 무기 또는 보우/석궁. */
export const LESSER_HASTE_WEAPON_SUB_TYPES: readonly IBaseItemSubTypeType[] = [
  "dagger",
  "oneHandSword",
  "oneHandAxe",
  "oneHandMace",
  "claw",
  "spear",
  "flail",
  "twoHandSword",
  "twoHandAxe",
  "twoHandMace",
  "quarterstaff",
  "bow",
  "crossbow",
];

/** Lesser Seeking — 무기(마샬) + 완드·스태프·포커스 (위키 구간 단순화). */
export const LESSER_SEEKING_SUB_TYPES: readonly string[] = [
  ...LESSER_ABRASION_APPLICABLE_SUB_TYPES,
  "wand",
  "staff",
  "focus",
];

/**
 * Extra prefix/suffix counts after placing one forced mod on `guaranteedModType`,
 * such that extras fill the remaining slots of a full rare (4–6 total affixes).
 */
export const getValidExtraSplitsAfterForcedMod = (
  remainingAffixCount: number,
  guaranteedModType: ModTypeType,
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

type CraftLabEssenceWikiTierRowType = (typeof craftLabEssenceWikiTiers)[number];

type CraftLabEssenceFamilyKeyType = CraftLabEssenceWikiTierRowType["familyKey"];

type IEssenceFamilyCraftRulesType = {
  forcedModKey: string;
  forcedDisplayName: string;
  guaranteedModType: ModTypeType;
  requiresItemRarity: EssenceApplicationRarityRequirementType;
  allowedSubTypes?: ReadonlyArray<string>;
};

/**
 * 위키에 명시된 스폰 가중치가 없을 때, `drop_level`이 낮을수록·상위 티어일수록 드롭이 흔하다는 가정의 참고 가중치.
 */
export const computeEssenceReferenceSpawnWeight = (
  wikiDropLevel: number,
  essenceTierGrade: 1 | 2 | 3,
): number => {
  const tierMultiplier = essenceTierGrade === 1 ? 100 : essenceTierGrade === 2 ? 55 : 30;
  const clampedDrop = Math.min(Math.max(wikiDropLevel, 1), 80);
  const depthCurve = 120 - clampedDrop;
  return Math.max(1, Math.round((depthCurve * tierMultiplier) / 100));
};

const getForcedTierRangeForEssenceTier = (
  essenceTierGrade: 1 | 2 | 3,
): { forcedTierMin: number; forcedTierMax: number } => {
  if (essenceTierGrade === 1) {
    return { forcedTierMin: 1, forcedTierMax: 2 };
  }
  if (essenceTierGrade === 2) {
    return { forcedTierMin: 2, forcedTierMax: 3 };
  }
  return { forcedTierMin: 3, forcedTierMax: 3 };
};

const CRAFT_LAB_ESSENCE_FAMILY_CRAFT_RULES: Record<
  CraftLabEssenceFamilyKeyType,
  IEssenceFamilyCraftRulesType
> = {
  attack: {
    forcedModKey: "essence_forced_attack",
    forcedDisplayName: "Adds Physical Damage (Essence)",
    guaranteedModType: "prefix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_ABRASION_APPLICABLE_SUB_TYPES],
  },
  alacrity: {
    forcedModKey: "essence_forced_alacrity",
    forcedDisplayName: "Increased Cast Speed (Essence)",
    guaranteedModType: "prefix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_SPELL_WEAPON_SUB_TYPES],
  },
  battle: {
    forcedModKey: "essence_forced_battle",
    forcedDisplayName: "Added Accuracy Rating (Essence)",
    guaranteedModType: "prefix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_ABRASION_APPLICABLE_SUB_TYPES],
  },
  command: {
    forcedModKey: "essence_forced_command",
    forcedDisplayName: "Allies in Presence deal increased Damage (Essence)",
    guaranteedModType: "prefix",
    requiresItemRarity: "magic",
    allowedSubTypes: ["sceptre"],
  },
  electricity: {
    forcedModKey: "essence_forced_electricity",
    forcedDisplayName: "Adds Lightning Damage (Essence)",
    guaranteedModType: "prefix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_ELEMENTAL_WEAPON_SUB_TYPES],
  },
  enhancement: {
    forcedModKey: "essence_forced_enhancement",
    forcedDisplayName: "Increased Armour, Evasion or Energy Shield (Essence)",
    guaranteedModType: "prefix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_ENHANCEMENT_SUB_TYPES],
  },
  flames: {
    forcedModKey: "essence_forced_flames",
    forcedDisplayName: "Adds Fire Damage (Essence)",
    guaranteedModType: "prefix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_ELEMENTAL_WEAPON_SUB_TYPES],
  },
  grounding: {
    forcedModKey: "essence_forced_grounding",
    forcedDisplayName: "+Lightning Resistance (Essence)",
    guaranteedModType: "suffix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_ARMOUR_BELT_JEWELLERY_RES_SUB_TYPES],
  },
  haste: {
    forcedModKey: "essence_forced_haste",
    forcedDisplayName: "Increased Attack Speed (Essence)",
    guaranteedModType: "prefix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_HASTE_WEAPON_SUB_TYPES],
  },
  ice: {
    forcedModKey: "essence_forced_ice",
    forcedDisplayName: "Adds Cold Damage (Essence)",
    guaranteedModType: "prefix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_ELEMENTAL_WEAPON_SUB_TYPES],
  },
  insulation: {
    forcedModKey: "essence_forced_insulation",
    forcedDisplayName: "+Fire Resistance (Essence)",
    guaranteedModType: "suffix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_ARMOUR_BELT_JEWELLERY_RES_SUB_TYPES],
  },
  opulence: {
    forcedModKey: "essence_forced_opulence",
    forcedDisplayName: "Increased Rarity of Items found (Essence)",
    guaranteedModType: "prefix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_OPULENCE_SUB_TYPES],
  },
  ruin: {
    forcedModKey: "essence_forced_ruin",
    forcedDisplayName: "+Chaos Resistance (Essence)",
    guaranteedModType: "suffix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_ARMOUR_BELT_JEWELLERY_RES_SUB_TYPES],
  },
  seeking: {
    forcedModKey: "essence_forced_seeking",
    forcedDisplayName: "Critical / Spell Critical (Essence)",
    guaranteedModType: "prefix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_SEEKING_SUB_TYPES],
  },
  sorcery: {
    forcedModKey: "essence_forced_sorcery",
    forcedDisplayName: "Increased Spell Damage (Essence)",
    guaranteedModType: "prefix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_SPELL_WEAPON_SUB_TYPES],
  },
  thawing: {
    forcedModKey: "essence_forced_thawing",
    forcedDisplayName: "+Cold Resistance (Essence)",
    guaranteedModType: "suffix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_ARMOUR_BELT_JEWELLERY_RES_SUB_TYPES],
  },
  life: {
    forcedModKey: "essence_forced_life",
    forcedDisplayName: "+Maximum Life (Essence)",
    guaranteedModType: "suffix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_BODY_APPLICABLE_SUB_TYPES],
  },
  infinite: {
    forcedModKey: "essence_forced_infinite",
    forcedDisplayName: "+Attributes (Essence)",
    guaranteedModType: "suffix",
    requiresItemRarity: "magic",
  },
  mind: {
    forcedModKey: "essence_forced_mind",
    forcedDisplayName: "+Maximum Mana (Essence)",
    guaranteedModType: "suffix",
    requiresItemRarity: "magic",
    allowedSubTypes: [...LESSER_MIND_SUB_TYPES],
  },
};

const buildCraftLabEssenceDefinitions = (): IEssenceDefinitionType[] => {
  const rows: CraftLabEssenceWikiTierRowType[] = craftLabEssenceWikiTiers;
  return rows.map((row) => {
    const rules = CRAFT_LAB_ESSENCE_FAMILY_CRAFT_RULES[row.familyKey];
    if (rules === undefined) {
      throw new Error(`craftLabEssenceWikiTiers: missing family "${row.familyKey}" in CRAFT_LAB_ESSENCE_FAMILY_CRAFT_RULES.`);
    }
    const essenceTierGrade = row.tierGrade as 1 | 2 | 3;
    const { forcedTierMin, forcedTierMax } = getForcedTierRangeForEssenceTier(essenceTierGrade);
    const essenceFamilyKey = `essence_${row.familyKey}`;
    return {
      essenceKey: `${essenceFamilyKey}_t${essenceTierGrade}`,
      essenceFamilyKey,
      essenceTierGrade,
      wikiDropLevel: row.wikiDropLevel,
      referenceSpawnWeight: computeEssenceReferenceSpawnWeight(row.wikiDropLevel, essenceTierGrade),
      displayName: row.displayName,
      forcedModKey: rules.forcedModKey,
      forcedDisplayName: rules.forcedDisplayName,
      guaranteedModType: rules.guaranteedModType,
      forcedTierMin,
      forcedTierMax,
      requiresItemRarity: rules.requiresItemRarity,
      allowedSubTypes: rules.allowedSubTypes,
    };
  });
};

/**
 * 벤치·전략 비교 등 베이스를 고르지 않은 채 `applyEssence`만 호출할 때 쓰는 대표 필터.
 * 키는 {@link IEssenceDefinitionType.essenceFamilyKey} (티어 접미 없음).
 */
const ESSENCE_BENCH_BASE_SUBTYPE: Readonly<
  Record<string, IBaseItemSubTypeType>
> = {
  essence_attack: "oneHandSword",
  essence_alacrity: "wand",
  essence_battle: "oneHandSword",
  essence_command: "sceptre",
  essence_electricity: "oneHandSword",
  essence_enhancement: "bodyArmour",
  essence_flames: "oneHandSword",
  essence_grounding: "bodyArmour",
  essence_haste: "oneHandSword",
  essence_ice: "oneHandSword",
  essence_insulation: "bodyArmour",
  essence_infinite: "ring",
  essence_life: "bodyArmour",
  essence_mind: "helmet",
  essence_opulence: "boots",
  essence_ruin: "bodyArmour",
  essence_seeking: "oneHandSword",
  essence_sorcery: "wand",
  essence_thawing: "bodyArmour",
};

export const getBenchModFiltersForEssence = (
  essence: IEssenceDefinitionType,
): IModRollBaseFiltersType => {
  const sub = ESSENCE_BENCH_BASE_SUBTYPE[essence.essenceFamilyKey];
  if (sub !== undefined) {
    return { baseItemSubType: sub };
  }
  return {};
};

/**
 * Lesser (craft-lab) essences — applicability.
 *
 * - Item must not be corrupted (standard crafting).
 * - `essence.requiresItemRarity`: magic-only essences in this DB require `rarity === "magic"`;
 *   rare-only rules would require `rarity === "rare"` (reserved for future tiers).
 * - When `essence.allowedSubTypes` is non-empty, `baseFilters.baseItemSubType` must be present
 *   and included in that list (bench/base must be known).
 */
export const canApplyEssence = (
  item: IItemRoll,
  essence: IEssenceDefinitionType,
  baseFilters?: IModRollBaseFiltersType,
): boolean => {
  if (isCorruptedRoll(item)) {
    return false;
  }
  if (essence.requiresItemRarity === "magic" && item.rarity !== "magic") {
    return false;
  }
  if (essence.requiresItemRarity === "rare" && item.rarity !== "rare") {
    return false;
  }
  const allowed = essence.allowedSubTypes;
  if (allowed !== undefined && allowed.length > 0) {
    const sub = baseFilters?.baseItemSubType;
    if (sub === undefined) {
      return false;
    }
    return allowed.includes(sub);
  }
  return true;
};

/**
 * 크래프트 랩 에센스 슬롯 호버: 적용 시 **보장되는** 접두/접미 1줄만 반영한 미리보기 롤.
 * 등급은 `forcedTierMin`~`forcedTierMax`의 중간(내림)으로 고정한다(실제 적용은 해당 구간 무작위).
 */
export const buildEssenceGuaranteedModPreviewRoll = (
  item: IItemRoll,
  essence: IEssenceDefinitionType,
  baseFilters?: IModRollBaseFiltersType,
): IItemRoll | null => {
  if (!canApplyEssence(item, essence, baseFilters)) {
    return null;
  }
  const tier = Math.floor((essence.forcedTierMin + essence.forcedTierMax) / 2);
  const forcedMod: IModDefinition = {
    modKey: essence.forcedModKey,
    displayName: essence.forcedDisplayName,
    tier,
    modType: essence.guaranteedModType,
    weight: 1,
  };
  const prefixes: IModDefinition[] =
    essence.guaranteedModType === "prefix" ? [forcedMod] : [];
  const suffixes: IModDefinition[] =
    essence.guaranteedModType === "suffix" ? [forcedMod] : [];
  return {
    rarity: "rare",
    prefixes,
    suffixes,
  };
};

/**
 * 매직 → 희귀 승격 + 보장 1옵 + 나머지 랜덤(카오스 풀리롤과 동일한 총 접두·접미 수 범위).
 * 기존 접두·접미는 버린다(위키의 “승격”에 맞춘 단순화).
 */
export const applyEssence = (
  _item: IItemRoll,
  essence: IEssenceDefinitionType,
  baseFilters?: IModRollBaseFiltersType,
): IItemRoll => {
  assertRollNotCorruptedForStandardCrafting(_item);
  if (!canApplyEssence(_item, essence, baseFilters)) {
    throw new Error("Essence: item rarity or base equipment does not match this essence.");
  }
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

/**
 * 크래프트 랩 창고·히네코라 고정표에 노출하는 에센스 전부.
 * `essenceKey`는 `essence_{family}_t{1|2|3}` — 통화 id·`currency.{key}` 번역.
 * 위키 `drop_level`·표시명은 `craftLabEssenceWikiTiers.json`; 아이콘 파일은 패밀리 키(`essence_attack.png`)를 공유.
 */
export const CRAFT_LAB_ESSENCE_DEFINITIONS: readonly IEssenceDefinitionType[] = Object.freeze(
  buildCraftLabEssenceDefinitions(),
);

export type CraftLabEssenceCurrencyIdType = `essence_${CraftLabEssenceFamilyKeyType}_t${1 | 2 | 3}`;

const CRAFT_LAB_ESSENCE_BY_KEY: ReadonlyMap<string, IEssenceDefinitionType> = new Map(
  CRAFT_LAB_ESSENCE_DEFINITIONS.map((definition) => {
    return [definition.essenceKey, definition];
  }),
);

export const getCraftLabEssenceByKey = (essenceKey: string): IEssenceDefinitionType | undefined => {
  return CRAFT_LAB_ESSENCE_BY_KEY.get(essenceKey);
};

const requireCraftLabEssenceByKey = (
  essenceKey: CraftLabEssenceCurrencyIdType,
): IEssenceDefinitionType => {
  const found = getCraftLabEssenceByKey(essenceKey);
  if (found === undefined) {
    throw new Error(`Unknown craft lab essence: ${essenceKey}`);
  }
  return found;
};

/** 벤치·비교용 — Lesser(티어 1) 대표. */
export const ATTACK_ESSENCE: IEssenceDefinitionType = requireCraftLabEssenceByKey("essence_attack_t1");

/** 벤치·비교용 — Lesser(티어 1) 대표. */
export const LIFE_ESSENCE: IEssenceDefinitionType = requireCraftLabEssenceByKey("essence_life_t1");

export const EXAMPLE_ESSENCES: ReadonlyArray<IEssenceDefinitionType> =
  CRAFT_LAB_ESSENCE_DEFINITIONS;
