import { MOD_DB } from "./modDb";
import type { IModDbRecordType } from "./modDb";
import type { IModDefinition } from "./types";
import type { IBaseItemSubTypeType } from "./baseItemDb";

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
): IModDefinition => {
  const tierData = record.tiers?.find((t) => t.tier === tier);
  return {
    modKey: record.modKey,
    displayName: record.nameTemplateKey,
    tier,
    modType: record.modType,
    weight: tierData?.weight ?? Math.round(record.totalWeight / record.tierCount),
  };
};

/**
 * Legacy flat pool — all mods flattened to `IModDefinition` (tier 1 representative).
 * Kept for backwards compatibility with the rolling engine.
 */
export const MOD_POOL: ReadonlyArray<IModDefinition> = MOD_DB.records.map(
  (record) => toModDefinition(record, 1),
);
