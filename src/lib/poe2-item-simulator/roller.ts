import {
  BASE_ITEM_ITEM_LEVEL_DEFAULT,
  clampBaseItemItemLevel,
} from "@/lib/poe2-item-simulator/baseItemItemLevel";
import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";
import {
  getModTierDisplayRows,
  type IModTierDisplayRowType,
} from "@/lib/poe2-item-simulator/modDbTierDisplay";
import { toModDefinition } from "@/lib/poe2-item-simulator/modPool";
import { getRandomIntInclusive, pickWeightedRandom } from "@/lib/poe2-item-simulator/random";

/**
 * 베이스가 알려질 때만 적용(크래프트 랩 등).
 * `itemLevel`이 없으면 `BASE_ITEM_ITEM_LEVEL_DEFAULT`로 클램프(레거시·벤치와의 호환).
 */
export type IModRollBaseFiltersType = {
  baseItemSubType?: IBaseItemSubTypeType;
  itemStatTags?: ReadonlyArray<IBaseItemStatTagType>;
  /** 장비 아이템 레벨(ilvl). 티어 후보는 `levelRequirement <= itemLevel`만 허용. */
  itemLevel?: number;
  /**
   * Greater/Perfect 오브·상위 에센스 등: 롤되는 티어 행의 `levelRequirement`가 이 값 **이상**인 것만.
   * (위키 Minimum Modifier Level과 동일한 숫자를 크래프트 랩에서 `craftLabOrbTierItemLevel`에 두고 합성.)
   */
  minModifierLevelFloor?: number;
};

export type IModRollContextInputType = IModRollContext & IModRollBaseFiltersType;

const MOD_KEY_TO_RECORD: ReadonlyMap<string, IModDbRecordType> = new Map(
  MOD_DB.records.map((record) => {
    return [record.modKey, record] as const;
  }),
);

export const isRecordEligibleForBaseFilters = (
  record: IModDbRecordType,
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

const resolveModRollItemLevel = (filters: IModRollBaseFiltersType | undefined): number => {
  return clampBaseItemItemLevel(filters?.itemLevel ?? BASE_ITEM_ITEM_LEVEL_DEFAULT);
};

/**
 * 위키 병합 등으로 사다리 `tier`가 수십까지 갈 수 있음. UI·절사·“좋은 옵” 판정은 `record.tierCount`(예: 9) 스케일을 쓴다.
 * 내부 롤은 `getModTierDisplayRows`의 `tier`를 그대로 두고, 여기서만 1…`tierCount`로 선형 매핑한다.
 */
export const mapLadderTierToSimDisplayTier = (
  record: IModDbRecordType,
  ladderTier: number,
  allDisplayRows: ReadonlyArray<IModTierDisplayRowType>,
): number => {
  const cap = Math.max(1, record.tierCount);
  if (allDisplayRows.length === 0) {
    return Math.min(cap, Math.max(1, ladderTier));
  }
  const maxTier = Math.max(...allDisplayRows.map((row) => row.tier));
  if (maxTier <= 1) {
    return 1;
  }
  const clamped = Math.min(Math.max(ladderTier, 1), maxTier);
  const mapped = 1 + Math.round(((clamped - 1) * (cap - 1)) / (maxTier - 1));
  return Math.min(cap, Math.max(1, mapped));
};

/**
 * 실제 롤에 쓸 티어 번호 상한. (1 = 최상위)
 * `record.tierCount`만 쓰면 위키 병합으로 `getModTierDisplayRows`가 36줄인데 DB에는 9로 남은 경우
 * 뒤쪽(저 ilvl) 티어가 전부 잘려 후보 0개가 된다 → **해결된 행의 최대 tier**를 기본 상한으로 쓴다.
 * `maxTierBySubType`이 있으면 해당 베이스 한도로만 추가로 좁힌다.
 */
const resolveTierCeilingForRoll = (
  record: IModDbRecordType,
  rows: ReadonlyArray<IModTierDisplayRowType>,
  filters: IModRollBaseFiltersType | undefined,
): number => {
  const maxTierInRows =
    rows.length === 0 ? 0 : Math.max(...rows.map((row) => row.tier));

  let ceiling = maxTierInRows > 0 ? maxTierInRows : record.tierCount;
  ceiling = Math.max(1, ceiling);

  const sub = filters?.baseItemSubType;
  const subtypeCap = sub !== undefined ? record.maxTierBySubType?.[sub] : undefined;
  if (subtypeCap !== undefined) {
    ceiling = Math.min(ceiling, subtypeCap);
  }

  return ceiling;
};

const listEligibleTierRowsForRecord = (
  record: IModDbRecordType,
  itemLevel: number,
  filters: IModRollBaseFiltersType | undefined,
): IModTierDisplayRowType[] => {
  const rows = getModTierDisplayRows(record);
  const tierCeiling = resolveTierCeilingForRoll(record, rows, filters);
  const floor = Math.max(1, filters?.minModifierLevelFloor ?? 1);
  return rows.filter((row) => {
    return (
      row.tier <= tierCeiling &&
      row.levelRequirement <= itemLevel &&
      row.levelRequirement >= floor &&
      row.weight > 0
    );
  });
};

/** 에센스 보장 옵 등: DB 레코드·베이스 서브타입 티어 상한·ilvl을 통과한 티어 행만. */
export const listEligibleModTierRowsForRecord = (
  record: IModDbRecordType,
  baseFilters?: IModRollBaseFiltersType,
): IModTierDisplayRowType[] => {
  const itemLevel = resolveModRollItemLevel(baseFilters);
  return listEligibleTierRowsForRecord(record, itemLevel, baseFilters);
};

type IModRollGroupType = {
  record: IModDbRecordType;
  tiers: IModTierDisplayRowType[];
};

const buildModRollGroups = (
  modRollContext: IModRollContextInputType,
): IModRollGroupType[] => {
  const baseFilters: IModRollBaseFiltersType | undefined =
    modRollContext.baseItemSubType !== undefined ||
    modRollContext.itemStatTags !== undefined ||
    modRollContext.itemLevel !== undefined ||
    modRollContext.minModifierLevelFloor !== undefined
      ? {
          baseItemSubType: modRollContext.baseItemSubType,
          itemStatTags: modRollContext.itemStatTags,
          itemLevel: modRollContext.itemLevel,
          minModifierLevelFloor: modRollContext.minModifierLevelFloor,
        }
      : undefined;

  const itemLevel = resolveModRollItemLevel(baseFilters);
  const groups: IModRollGroupType[] = [];

  for (const record of MOD_DB.records) {
    if (record.modType !== modRollContext.modType) {
      continue;
    }
    if (modRollContext.excludedModKeys.has(record.modKey)) {
      continue;
    }
    if (!isRecordEligibleForBaseFilters(record, baseFilters)) {
      continue;
    }
    const tiers = listEligibleTierRowsForRecord(record, itemLevel, baseFilters);
    if (tiers.length === 0) {
      continue;
    }
    groups.push({ record, tiers });
  }

  return groups;
};

const rollModFromGroups = (groups: IModRollGroupType[]): IModDefinition => {
  if (groups.length === 0) {
    throw new Error("No mod roll groups available.");
  }

  const groupWeights = groups.map((group) => {
    const sum = group.tiers.reduce((acc, row) => {
      return acc + row.weight;
    }, 0);
    return { candidate: group, weight: sum };
  });

  const pickedGroup = pickWeightedRandom(groupWeights);
  const tierPick = pickWeightedRandom(
    pickedGroup.tiers.map((row) => {
      return { candidate: row, weight: row.weight };
    }),
  );

  const fullRows = getModTierDisplayRows(pickedGroup.record);
  const displayTier = mapLadderTierToSimDisplayTier(
    pickedGroup.record,
    tierPick.tier,
    fullRows,
  );
  const base = toModDefinition(pickedGroup.record, tierPick.tier);
  return { ...base, tier: displayTier, weight: tierPick.weight };
};

export const rollRandomMod = (modRollContext: IModRollContextInputType): IModDefinition => {
  const baseFilters: IModRollBaseFiltersType | undefined =
    modRollContext.baseItemSubType !== undefined ||
    modRollContext.itemStatTags !== undefined ||
    modRollContext.itemLevel !== undefined ||
    modRollContext.minModifierLevelFloor !== undefined
      ? {
          baseItemSubType: modRollContext.baseItemSubType,
          itemStatTags: modRollContext.itemStatTags,
          itemLevel: modRollContext.itemLevel,
          minModifierLevelFloor: modRollContext.minModifierLevelFloor,
        }
      : undefined;

  const groups = buildModRollGroups(modRollContext);

  if (groups.length === 0) {
    const sub = modRollContext.baseItemSubType;
    const tags = modRollContext.itemStatTags;
    const ilvl = resolveModRollItemLevel(baseFilters);
    const baseHint =
      sub !== undefined || tags !== undefined
        ? ` baseSubType=${sub ?? "n/a"} statTags=[${tags?.join(",") ?? ""}]`
        : "";
    throw new Error(
      `No candidates available for mod roll. rarity=${modRollContext.rarity} modType=${modRollContext.modType} itemLevel=${ilvl}.${baseHint}`,
    );
  }

  return rollModFromGroups(groups);
};

/**
 * `rollRandomMod`와 동일한 필터로 후보 목록만 반환 (크래프트 랩 시뮬 확률 UI용).
 * 동일 `modKey`에 여러 티어가 있으면 행이 여러 개 반환된다.
 */
export const listModRollCandidates = (modRollContext: IModRollContextInputType): IModDefinition[] => {
  const groups = buildModRollGroups(modRollContext);
  const out: IModDefinition[] = [];
  for (const { record, tiers } of groups) {
    const fullRows = getModTierDisplayRows(record);
    for (const row of tiers) {
      const base = toModDefinition(record, row.tier);
      const displayTier = mapLadderTierToSimDisplayTier(record, row.tier, fullRows);
      out.push({ ...base, tier: displayTier, weight: row.weight });
    }
  }
  return out;
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

