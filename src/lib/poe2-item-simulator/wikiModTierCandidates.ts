import wikiModTierPayload from "@/lib/poe2-item-simulator/data/poe2wiki-item-mod-tiers.json";
import { MOD_WIKI_TIER_SOURCES } from "@/lib/poe2-item-simulator/modWikiTierSources";
import type { WikiExtractedModTierRowType, WikiItemModTiersFileType } from "@/lib/poe2-item-simulator/wikiModTierTypes";
import {
  type WikiTierSpawnContextType,
  wikiSpawnRowMatchesBaseItem,
} from "@/lib/poe2-item-simulator/wikiTierSpawnFilter";

const wikiFile = wikiModTierPayload as WikiItemModTiersFileType;

/** Tie-break when several wiki rows share `required_level`: prefer the stronger roll (higher tier in-game). */
export const wikiRowStatPower = (row: WikiExtractedModTierRowType): number => {
  return row.statRanges.reduce((acc, s) => {
    return acc + Math.max(s.min, s.max);
  }, 0);
};

/**
 * `tryGetWikiModTiers`와 동일한 후보·정렬(부위 스폰 필터 포함).
 * 추출 스크립트·가중치 힌트 계산에서 재사용한다.
 */
export const getWikiModTierMergeCandidates = (
  modKey: string,
  wikiTierContext?: WikiTierSpawnContextType,
): WikiExtractedModTierRowType[] | null => {
  const rule = MOD_WIKI_TIER_SOURCES[modKey];
  if (rule === undefined) {
    return null;
  }

  let candidates = wikiFile.rows.filter((row) => {
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

  if (wikiTierContext !== undefined) {
    const spawnFiltered = candidates.filter((row) => {
      return wikiSpawnRowMatchesBaseItem(row, wikiTierContext);
    });
    if (spawnFiltered.length > 0) {
      candidates = spawnFiltered;
    }
  }

  candidates.sort((a, b) => {
    if (b.requiredLevel !== a.requiredLevel) {
      return b.requiredLevel - a.requiredLevel;
    }
    const powerDiff = wikiRowStatPower(b) - wikiRowStatPower(a);
    if (powerDiff !== 0) {
      return powerDiff;
    }
    return a.wikiModId.localeCompare(b.wikiModId);
  });

  return candidates;
};
