import type { IModDbRecordType } from "./modDb";
import { tryGetWikiModTiers } from "./wikiModTierMerge";

/**
 * One row in the DB UI tier breakdown (either from `record.tiers` or synthesized).
 */
export type IModTierDisplayRowType = {
  tier: number;
  levelRequirement: number;
  weight: number;
  statRanges: ReadonlyArray<{ min: number; max: number }>;
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
export const getModTierDisplayRows = (record: IModDbRecordType): IModTierDisplayRowType[] => {
  const tiers = record.tiers;
  if (tiers !== undefined && tiers.length > 0) {
    return [...tiers]
      .slice()
      .sort((a, b) => a.tier - b.tier)
      .map((row) => {
        return {
          tier: row.tier,
          levelRequirement: row.levelRequirement,
          weight: row.weight,
          statRanges: row.statRanges,
          isSynthetic: false,
        };
      });
  }

  const wikiTiers = tryGetWikiModTiers(record);
  if (wikiTiers !== null && wikiTiers.length > 0) {
    return [...wikiTiers]
      .slice()
      .sort((a, b) => a.tier - b.tier)
      .map((row) => {
        return {
          tier: row.tier,
          levelRequirement: row.levelRequirement,
          weight: row.weight,
          statRanges: row.statRanges,
          isSynthetic: false,
        };
      });
  }

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
