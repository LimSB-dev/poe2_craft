import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";
import { getModTierDisplayRows } from "@/lib/poe2-item-simulator/modDbTierDisplay";
import {
  listEligibleModTierRowsForRecord,
  mapLadderTierToSimDisplayTier,
  type IModRollBaseFiltersType,
} from "@/lib/poe2-item-simulator/roller";
import { wikiTierSpawnContextFromBaseFilters } from "@/lib/poe2-item-simulator/wikiTierSpawnFilter";

/**
 * 변경 후 아이템 레벨에서도, 현재 붙어 있는 명시 옵션의 **표시 티어**가
 * 여전히 롤 풀에 존재하는지 검사한다 (`levelRequirement`·티어 상한 반영).
 * 미공개 타락 줄 등 DB에 없는 키는 검증 불가 → false.
 */
export const areExplicitModsStillValidAtItemLevel = (
  itemRoll: IItemRoll,
  newItemLevel: number,
  baseFilters: IModRollBaseFiltersType,
): boolean => {
  const mods = [...itemRoll.prefixes, ...itemRoll.suffixes];
  const filtersAtNew: IModRollBaseFiltersType = {
    ...baseFilters,
    itemLevel: newItemLevel,
  };

  for (const mod of mods) {
    if (mod.isDesecrated === true && mod.isDesecratedRevealed === false) {
      return false;
    }
    const record = MOD_DB.records.find((row) => {
      return row.modKey === mod.modKey;
    });
    if (record === undefined) {
      return false;
    }
    const wikiCtx = wikiTierSpawnContextFromBaseFilters(filtersAtNew);
    const fullRows = getModTierDisplayRows(record, wikiCtx);
    const eligible = listEligibleModTierRowsForRecord(record, filtersAtNew);
    const eligibleDisplayTiers = new Set(
      eligible.map((row) => {
        return mapLadderTierToSimDisplayTier(record, row.tier, fullRows);
      }),
    );
    if (!eligibleDisplayTiers.has(mod.tier)) {
      return false;
    }
  }
  return true;
};

/**
 * 아이템 레벨 변경 시 확인 대화상자가 필요한지.
 * - 영혼의 우물 후보가 열려 있으면 항상 true (티어 검증 불가·UX).
 * - 명시 옵션이 없으면 false.
 * - 베이스 필터 없이 옵션이 있으면 true (안전 쪽).
 */
export const needsCraftLabItemLevelChangeConfirmation = (
  itemRoll: IItemRoll,
  soulWellRevealOpen: boolean,
  newItemLevel: number,
  baseFilters: IModRollBaseFiltersType | undefined,
): boolean => {
  if (soulWellRevealOpen) {
    return true;
  }
  const mods = [...itemRoll.prefixes, ...itemRoll.suffixes];
  if (mods.length === 0) {
    return false;
  }
  if (baseFilters === undefined) {
    return true;
  }
  return !areExplicitModsStillValidAtItemLevel(itemRoll, newItemLevel, baseFilters);
};
