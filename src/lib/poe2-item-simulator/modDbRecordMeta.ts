import { MOD_WIKI_TIER_SOURCES } from "@/lib/poe2-item-simulator/modWikiTierSources";

/**
 * 레코드에 명시된 `modFamilyKey`가 없으면 `MOD_WIKI_TIER_SOURCES`의 `modGroups`를 사용한다.
 * PoE2DB Family / 위키 `mod_groups`와 동일 스케일.
 */
export const resolveModFamilyKey = (record: IModDbRecordType): string | undefined => {
  if (record.modFamilyKey !== undefined && record.modFamilyKey.length > 0) {
    return record.modFamilyKey;
  }
  const rule = MOD_WIKI_TIER_SOURCES[record.modKey];
  return rule?.modGroups;
};
