/**
 * Subset of `scripts/extract-poe2wiki-item-mod-tiers.ts` output used at runtime.
 */

export type WikiModStatRangeRowType = {
  statId: string;
  min: number;
  max: number;
};

export type WikiModSpawnWeightRowType = {
  ordinal: number;
  tag: string;
  value: number;
};

export type WikiExtractedModTierRowType = {
  wikiModId: string;
  modGroups: string;
  generationType: 1 | 2;
  requiredLevel: number;
  tierText: string | null;
  statText: string | null;
  name: string | null;
  statRanges: WikiModStatRangeRowType[];
  spawnWeights: WikiModSpawnWeightRowType[];
  simulatorTierWithinGroup: number;
};

export type WikiItemModTiersFileType = {
  source: string;
  fetchedAtIso: string;
  rowCount: number;
  rows: WikiExtractedModTierRowType[];
};
