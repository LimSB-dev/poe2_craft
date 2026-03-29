import { isModKeyBlockedByPoe2dbSpellExclusionTags } from "@/lib/poe2-item-simulator/modPoe2dbSpellExclusionTags";
import type { WikiTierSpawnContextType } from "@/lib/poe2-item-simulator/wikiTierSpawnFilter";
import { tryGetWikiModTiers } from "@/lib/poe2-item-simulator/wikiModTierMerge";

/**
 * One row in the DB UI tier breakdown (either from `record.tiers` or synthesized).
 */
export type IModTierDisplayRowType = {
  tier: number;
  levelRequirement: number;
  requiredIntelligence?: number;
  weight: number;
  statRanges: ReadonlyArray<IModStatRangeType>;
  /** PoE2DB·위키 티어 롤 이름(정정한 등). */
  tierRollName?: string;
  /** True when `record.tiers` was empty and rows were derived from overview fields. */
  isSynthetic: boolean;
};

/**
 * Builds tier rows for the database accordion.
 * - If `record.tiers` is present, uses it (1 = best tier in `modDb` convention).
 * - Else if poe2wiki Cargo data maps this `modKey`, uses wiki tier ladders + stat ranges.
 * - Otherwise interpolates `tierCount` levels from 1 .. `maxLevelRequirement` (tier 1 = highest ilvl)
 *   and splits `totalWeight` evenly.
 */
const mapModTiersToDisplayRows = (source: readonly IModTierType[]): IModTierDisplayRowType[] => {
  return [...source]
    .slice()
    .sort((a, b) => a.tier - b.tier)
    .map((row) => {
      return {
        tier: row.tier,
        levelRequirement: row.levelRequirement,
        ...(row.requiredIntelligence !== undefined ? { requiredIntelligence: row.requiredIntelligence } : {}),
        weight: row.weight,
        statRanges: row.statRanges,
        tierRollName: row.tierRollName,
        isSynthetic: false,
      };
    });
};

const buildSyntheticModTierDisplayRows = (record: IModDbRecordType): IModTierDisplayRowType[] => {
  const tierCount = Math.max(1, record.tierCount);
  const maxLv = Math.max(1, record.maxLevelRequirement);
  const weightEach = Math.max(1, Math.round(record.totalWeight / tierCount));
  const rows: IModTierDisplayRowType[] = [];

  for (let tier = 1; tier <= tierCount; tier += 1) {
    const levelRequirement =
      tierCount === 1
        ? maxLv
        : Math.round(1 + ((maxLv - 1) * (tierCount - tier)) / (tierCount - 1));
    rows.push({
      tier,
      levelRequirement,
      weight: weightEach,
      statRanges: [],
      isSynthetic: true,
    });
  }

  return rows;
};

export const getModTierDisplayRows = (
  record: IModDbRecordType,
  wikiTierContext?: WikiTierSpawnContextType,
): IModTierDisplayRowType[] => {
  /**
   * PoE2DB `no_*_spell_mods` — 위키 행 값만으로는 불충분(`SpellDamageGainedAs*` 등 `no_*` 열 없음).
   * 배제 시 티어 0개(합성 티어로 떨어지지 않음).
   */
  if (
    wikiTierContext !== undefined &&
    isModKeyBlockedByPoe2dbSpellExclusionTags(record.modKey, wikiTierContext.poe2dbTags)
  ) {
    return [];
  }

  /** Slot / stat spawn filter must win over raw `record.tiers` (e.g. helmet life vs body-only tiers). */
  if (wikiTierContext !== undefined) {
    const wikiForSlot = tryGetWikiModTiers(record, wikiTierContext);
    if (wikiForSlot !== null && wikiForSlot.length > 0) {
      return mapModTiersToDisplayRows(wikiForSlot);
    }
    /**
     * `MOD_WIKI_TIER_SOURCES`는 있으나 현재 부위·스폰과 맞는 위키 행이 0개일 때(`[]`).
     * 빈 배열을 그대로 쓰면 DB·롤에서 접두/접미가 통째로 사라진다(예: 지팡이 공격 접두).
     * `tryGetWikiModTiers(undefined)`로 넘기면 비슷한 `mod_groups` 전체가 섞여 부위 오염이 난다.
     * → 슬롯별 위키가 비었을 때는 `record.tiers`도 건너뛰고 합성 티어만 사용한다.
     */
    if (wikiForSlot !== null && wikiForSlot.length === 0) {
      return buildSyntheticModTierDisplayRows(record);
    }
  }

  const tiers = record.tiers;
  if (tiers !== undefined && tiers.length > 0) {
    return mapModTiersToDisplayRows(tiers);
  }

  const wikiTiers = tryGetWikiModTiers(record, undefined);
  if (wikiTiers !== null && wikiTiers.length > 0) {
    return mapModTiersToDisplayRows(wikiTiers);
  }

  return buildSyntheticModTierDisplayRows(record);
};

export const formatStatRangesCell = (
  ranges: ReadonlyArray<{ min: number; max: number }>,
): string => {
  if (ranges.length === 0) {
    return "";
  }
  return ranges
    .map((range) => {
      if (range.min === range.max) {
        return String(range.min);
      }
      return `${String(range.min)}–${String(range.max)}`;
    })
    .join(", ");
};

/** PoE-style range inside parentheses, em dash between min–max (UI parity with in-game DB). */
export const formatStatRangeParenEmDash = (min: number, max: number): string => {
  if (min === max) {
    return `(${String(min)})`;
  }
  return `(${String(min)}—${String(max)})`;
};

/**
 * Replaces each `#` in the mod template (i18n line) with the next stat range, in order.
 * Leftover `#` stay if ranges run out.
 */
export const applyStatRangesToModTemplate = (
  template: string,
  ranges: ReadonlyArray<{ min: number; max: number }>,
): string => {
  let index = 0;
  return template.replace(/#/g, () => {
    const range = ranges[index];
    index += 1;
    if (range === undefined) {
      return "#";
    }
    return formatStatRangeParenEmDash(range.min, range.max);
  });
};

/** Splits a filled template on commas into separate stat lines (e.g. flat + % hybrid mods). */
export const modFilledTemplateToStatLines = (filled: string): string[] => {
  return filled
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
};

export type IModStatLinesResultType = {
  lines: string[];
  /** True when `#` remain or no lines could be built (synthetic tiers without stat data). */
  isPending: boolean;
};

/**
 * Builds human-readable stat lines from the locale mod template and tier stat ranges.
 */
export const buildModStatDisplayLines = (
  template: string,
  ranges: ReadonlyArray<{ min: number; max: number }>,
): IModStatLinesResultType => {
  if (ranges.length === 0) {
    return { lines: [], isPending: true };
  }
  const filled = applyStatRangesToModTemplate(template, ranges);
  const lines = modFilledTemplateToStatLines(filled);
  const isPending = filled.includes("#") || lines.length === 0;
  return { lines, isPending };
};
