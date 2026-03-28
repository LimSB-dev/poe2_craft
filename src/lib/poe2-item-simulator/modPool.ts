import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";
import { getModTierDisplayRows } from "@/lib/poe2-item-simulator/modDbTierDisplay";
import type { WikiTierSpawnContextType } from "@/lib/poe2-item-simulator/wikiTierSpawnFilter";

/**
 * Returns all mod records applicable to the given item sub-type.
 * When no sub-type is specified, all records are returned (legacy behaviour).
 */
export const getModPool = (
  subType?: IBaseItemSubTypeType,
): ReadonlyArray<IModDbRecordType> => {
  if (subType === undefined) {
    return MOD_DB.records;
  }
  return MOD_DB.records.filter((record) =>
    record.applicableSubTypes.includes(subType),
  );
};

/**
 * Converts a `IModDbRecordType` to the legacy `IModDefinition` shape used by
 * the rolling engine. Uses the top tier (tier 1) as the representative tier.
 * When per-tier data is absent, `totalWeight` is used as a single-tier weight.
 */
export const toModDefinition = (
  record: IModDbRecordType,
  tier: number = 1,
  wikiTierContext?: WikiTierSpawnContextType,
): IModDefinition => {
  const tierData = record.tiers?.find((t) => t.tier === tier);
  const tierRows = getModTierDisplayRows(record, wikiTierContext);
  const tierRow = tierRows.find((row) => {
    return row.tier === tier;
  });
  const statRanges = tierRow?.statRanges ?? tierData?.statRanges;
  return {
    modKey: record.modKey,
    displayName: record.nameTemplateKey,
    tier,
    modType: record.modType,
    weight: tierData?.weight ?? Math.round(record.totalWeight / record.tierCount),
    ...(statRanges !== undefined && statRanges.length > 0 ? { statRanges } : {}),
  };
};

/**
 * Legacy flat pool — all mods flattened to `IModDefinition` (tier 1 representative).
 * Kept for backwards compatibility with the rolling engine.
 */
export const MOD_POOL: ReadonlyArray<IModDefinition> = MOD_DB.records.map(
  (record) => toModDefinition(record, 1),
);
