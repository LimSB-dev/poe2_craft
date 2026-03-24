import type { IModDbRecordType, IModTierType } from "./modDb";
import { MOD_WIKI_TIER_SOURCES } from "./modWikiTierSources";
import type { WikiExtractedModTierRowType, WikiItemModTiersFileType } from "./wikiModTierTypes";

import wikiModTierPayload from "./data/poe2wiki-item-mod-tiers.json";

const wikiFile = wikiModTierPayload as WikiItemModTiersFileType;

/**
 * Orders wiki `mod_stats` rows so `#` placeholders in i18n templates usually match
 * (e.g. minimum damage before maximum damage).
 */
export const sortWikiStatRangesForDisplay = (
  ranges: ReadonlyArray<{ statId: string; min: number; max: number }>,
): ReadonlyArray<{ min: number; max: number }> => {
  const copy = [...ranges];
  copy.sort((a, b) => {
    const rank = (id: string): number => {
      if (id.includes("minimum")) {
        return 0;
      }
      if (id.includes("maximum")) {
        return 1;
      }
      return 2;
    };
    const diff = rank(a.statId) - rank(b.statId);
    if (diff !== 0) {
      return diff;
    }
    return a.statId.localeCompare(b.statId);
  });
  return copy.map((r) => {
    return { min: r.min, max: r.max };
  });
};

const spawnWeightSum = (row: WikiExtractedModTierRowType): number => {
  return row.spawnWeights.reduce((acc, w) => {
    return acc + Math.max(0, w.value);
  }, 0);
};

const buildTierWeights = (
  record: IModDbRecordType,
  sortedRows: WikiExtractedModTierRowType[],
): number[] => {
  const n = sortedRows.length;
  if (n === 0) {
    return [];
  }
  const sums = sortedRows.map((r) => {
    return spawnWeightSum(r);
  });
  const totalSpawn = sums.reduce((a, b) => {
    return a + b;
  }, 0);
  const equal = Math.max(1, Math.round(record.totalWeight / n));
  if (totalSpawn <= 0 || sums.every((s) => s === sums[0])) {
    return sums.map(() => {
      return equal;
    });
  }
  const raw = sums.map((s) => {
    return (record.totalWeight * s) / totalSpawn;
  });
  const rounded = raw.map((w) => {
    return Math.max(1, Math.round(w));
  });
  const drift = record.totalWeight - rounded.reduce((a, b) => a + b, 0);
  if (drift !== 0 && rounded.length > 0) {
    const last = rounded[rounded.length - 1];
    if (last !== undefined) {
      rounded[rounded.length - 1] = Math.max(1, last + drift);
    }
  }
  return rounded;
};

/**
 * Returns wiki-derived tiers for a `modDb` record when a Cargo mapping exists and rows match.
 */
export const tryGetWikiModTiers = (record: IModDbRecordType): IModTierType[] | null => {
  const rule = MOD_WIKI_TIER_SOURCES[record.modKey];
  if (rule === undefined) {
    return null;
  }

  const candidates = wikiFile.rows.filter((row) => {
    if (row.modGroups !== rule.modGroups || row.generationType !== rule.generationType) {
      return false;
    }
    if (rule.rowMatches !== undefined && !rule.rowMatches(row)) {
      return false;
    }
    return row.statRanges.length > 0;
  });

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => {
    if (b.requiredLevel !== a.requiredLevel) {
      return b.requiredLevel - a.requiredLevel;
    }
    return a.wikiModId.localeCompare(b.wikiModId);
  });

  const weights = buildTierWeights(record, candidates);

  return candidates.map((row, index) => {
    const tier: IModTierType = {
      tier: index + 1,
      levelRequirement: row.requiredLevel,
      weight: weights[index] ?? Math.max(1, Math.round(record.totalWeight / candidates.length)),
      statRanges: sortWikiStatRangesForDisplay(row.statRanges),
    };
    return tier;
  });
};
