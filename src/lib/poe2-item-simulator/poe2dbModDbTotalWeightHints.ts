import { MOD_WIKI_TIER_SOURCES } from "@/lib/poe2-item-simulator/modWikiTierSources";
import { getWikiModTierMergeCandidates } from "@/lib/poe2-item-simulator/wikiModTierCandidates";

export type ModDbTotalWeightHintEntryType = {
  /** `DropChance` 합(해당 modKey의 위키 티어 후보 wikiModId별 가중치 합). */
  suggestedTotalWeight: number;
  /** PoE2DB에서 가중치를 못 찾은 wiki 모드 id */
  missingWikiModIds: readonly string[];
  /** 가중치가 채워진 티어 수 */
  tiersWithPoe2dbWeight: number;
};

/** 위키 티어 후보 전체 개수(`missingWikiModIds.length + tiersWithPoe2dbWeight`). JSON에 중복 저장하지 않는다. */
export const modDbTotalWeightHintTierCount = (hint: ModDbTotalWeightHintEntryType): number => {
  return hint.missingWikiModIds.length + hint.tiersWithPoe2dbWeight;
};

/**
 * `weightsByWikiModId`(PoE2DB `ModsView` `DropChance`)로 `modDb.totalWeight` 교정 시 참고할 합계를 만든다.
 * 일부 티어가 누락되면 `missingWikiModIds`를 보고 추론/추출을 보강한 뒤 다시 실행한다.
 */
export const computeModDbTotalWeightHintsFromWeightsByWikiModId = (
  weightsByWikiModId: Readonly<Record<string, number>>,
): Record<string, ModDbTotalWeightHintEntryType> => {
  const out: Record<string, ModDbTotalWeightHintEntryType> = {};

  for (const modKey of Object.keys(MOD_WIKI_TIER_SOURCES)) {
    const candidates = getWikiModTierMergeCandidates(modKey, undefined);
    if (candidates === null || candidates.length === 0) {
      continue;
    }

    const missing: string[] = [];
    let sum = 0;
    let tiersWithPoe2dbWeight = 0;

    for (const row of candidates) {
      const w = weightsByWikiModId[row.wikiModId];
      if (w === undefined || w <= 1) {
        missing.push(row.wikiModId);
      } else {
        sum += w;
        tiersWithPoe2dbWeight += 1;
      }
    }

    out[modKey] = {
      suggestedTotalWeight: sum,
      missingWikiModIds: missing,
      tiersWithPoe2dbWeight,
    };
  }

  return out;
};
