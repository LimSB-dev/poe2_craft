import type { WikiExtractedModTierRowType } from "@/lib/poe2-item-simulator/wikiModTierTypes";
import { inferItemStatTagsFromPoe2dbTags } from "@/lib/poe2db/poe2dbStatAffinityPages";
import {
  type WikiTierSpawnContextType,
  wikiPrimarySpawnWeightColumnTag,
} from "@/lib/poe2-item-simulator/wikiTierSpawnFilter";
import { resolvePoe2DbModifiersCalcPageSlugsForWikiTierContext } from "@/lib/poe2db/poe2dbStatAffinityPages";
import { getWikiModTierMergeCandidates } from "@/lib/poe2-item-simulator/wikiModTierCandidates";

/** PoE2DB `ModsView` `normal.DropChance` — `yarn extract:poe2db-mod-drop-weights` */
import poe2dbDropWeightsPayload from "@/lib/poe2-item-simulator/data/poe2db-mod-drop-weights.json";

type Poe2DbDropWeightsFileType = {
  weightsByWikiModId?: Record<string, number>;
  /** PoE2DB 페이지(부위)별 `DropChance` — 위키 스폰 태그 키. */
  weightsByWikiModIdAndWikiSpawnTag?: Readonly<Record<string, Readonly<Record<string, number>>>>;
  /** PoE2DB `#ModifiersCalc` 페이지 슬러그(예: `Helmets`) — 해석 실패 시 `Code` 폴백으로 채워짐. */
  weightsByWikiModIdAndPoe2DbPageSlug?: Readonly<Record<string, Readonly<Record<string, number>>>>;
};

const POE2DB_DROP_BY_WIKI_MOD_ID: Readonly<Record<string, number>> =
  (poe2dbDropWeightsPayload as Poe2DbDropWeightsFileType).weightsByWikiModId ?? {};

const POE2DB_DROP_BY_WIKI_MOD_ID_AND_SPAWN_TAG: Readonly<
  Record<string, Readonly<Record<string, number>>>
> = (poe2dbDropWeightsPayload as Poe2DbDropWeightsFileType).weightsByWikiModIdAndWikiSpawnTag ?? {};

const POE2DB_DROP_BY_WIKI_MOD_ID_AND_PAGE_SLUG: Readonly<
  Record<string, Readonly<Record<string, number>>>
> = (poe2dbDropWeightsPayload as Poe2DbDropWeightsFileType).weightsByWikiModIdAndPoe2DbPageSlug ?? {};

const resolvePoe2dbDropChanceForTierRow = (
  wikiModId: string,
  slotTag: string | null,
  wikiTierContext: WikiTierSpawnContextType | undefined,
): number | undefined => {
  const effectiveStatTags =
    wikiTierContext?.itemStatTags !== undefined &&
    wikiTierContext.itemStatTags.length > 0
      ? wikiTierContext.itemStatTags
      : inferItemStatTagsFromPoe2dbTags(wikiTierContext?.poe2dbTags);

  const pageSlugs = resolvePoe2DbModifiersCalcPageSlugsForWikiTierContext(
    wikiTierContext?.baseItemSubType,
    effectiveStatTags,
  );
  let bestSlugWeight: number | undefined;
  for (const slug of pageSlugs) {
    const v = POE2DB_DROP_BY_WIKI_MOD_ID_AND_PAGE_SLUG[wikiModId]?.[slug];
    if (v !== undefined && v > 1) {
      bestSlugWeight = bestSlugWeight === undefined ? v : Math.max(bestSlugWeight, v);
    }
  }
  if (bestSlugWeight !== undefined) {
    return bestSlugWeight;
  }
  if (slotTag !== null) {
    const byTag = POE2DB_DROP_BY_WIKI_MOD_ID_AND_SPAWN_TAG[wikiModId]?.[slotTag];
    if (byTag !== undefined && byTag > 1) {
      return byTag;
    }
  }
  const fallback = POE2DB_DROP_BY_WIKI_MOD_ID[wikiModId];
  if (fallback !== undefined && fallback > 1) {
    return fallback;
  }
  return undefined;
};

/**
 * Cargo `mod_stats`는 `base_life_regeneration_rate_per_minute`(분당)로 오고, 위키 `stat text`는 초당 구간이다.
 * UI·템플릿 `#` 치환은 초당 수치와 맞춘다(예: 60–120 → 1–2, 1986–2160 → 33.1–36).
 */
export const normalizeWikiStatRangesForDisplay = (
  ranges: ReadonlyArray<{ statId: string; min: number; max: number }>,
): ReadonlyArray<{ statId: string; min: number; max: number }> => {
  return ranges.map((r) => {
    if (r.statId !== "base_life_regeneration_rate_per_minute") {
      return { statId: r.statId, min: r.min, max: r.max };
    }
    const toPerSecond = (v: number): number => {
      const s = v / 60;
      if (Number.isInteger(s)) {
        return s;
      }
      return Math.round(s * 10) / 10;
    };
    return {
      statId: r.statId,
      min: toPerSecond(r.min),
      max: toPerSecond(r.max),
    };
  });
};

/**
 * Orders wiki `mod_stats` rows so `#` placeholders in i18n templates usually match
 * (e.g. minimum damage before maximum damage).
 */
export const sortWikiStatRangesForDisplay = (
  ranges: ReadonlyArray<{ statId: string; min: number; max: number }>,
): ReadonlyArray<IModStatRangeType> => {
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
    return { min: r.min, max: r.max, statId: r.statId };
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
 * `wikiTierContext`가 있으면 `mod_spawn_weights`로 베이스 부위·능력치에 맞는 줄만 남긴다(예: flat ES 최상위 티는 몸통만).
 */
export const tryGetWikiModTiers = (
  record: IModDbRecordType,
  wikiTierContext?: WikiTierSpawnContextType,
): IModTierType[] | null => {
  const candidates = getWikiModTierMergeCandidates(record.modKey, wikiTierContext);
  if (candidates === null || candidates.length === 0) {
    return null;
  }

  const weights = buildTierWeights(record, candidates);

  const slotTag =
    wikiTierContext?.baseItemSubType !== undefined
      ? wikiPrimarySpawnWeightColumnTag(wikiTierContext.baseItemSubType)
      : null;

  const spawnWeightForTag = (
    row: WikiExtractedModTierRowType,
    tag: string,
  ): number => {
    const v = row.spawnWeights.find((w) => {
      return w.tag === tag;
    })?.value;
    return v !== undefined && v > 0 ? v : 0;
  };

  const slotRawValues =
    slotTag !== null
      ? candidates.map((row) => {
          return spawnWeightForTag(row, slotTag);
        })
      : [];
  const useRawSlotWeights =
    slotTag !== null &&
    slotRawValues.length === candidates.length &&
    slotRawValues.every((v) => {
      return v > 0;
    }) &&
    Math.max(...slotRawValues) !== Math.min(...slotRawValues);

  return candidates.map((row, index) => {
    const tierRollName =
      row.name !== null && row.name.trim().length > 0 ? row.name.trim() : undefined;
    let tierWeight = weights[index] ?? Math.max(1, Math.round(record.totalWeight / candidates.length));
    if (useRawSlotWeights && slotTag !== null) {
      tierWeight = spawnWeightForTag(row, slotTag);
    }
    let poe2dbDrop = resolvePoe2dbDropChanceForTierRow(row.wikiModId, slotTag, wikiTierContext);
    /** PoE2DB ModsView가 출혈/중독/점화 3줄 묶음에 동일 DropChance(합계)를 넣는 경우 1500→개별 500으로 보정. */
    if (
      poe2dbDrop !== undefined &&
      poe2dbDrop === 1500 &&
      /^(ReducedBleedDuration|ReducedPoisonDuration|ReducedBurnDuration)\d+$/.test(row.wikiModId)
    ) {
      poe2dbDrop = 500;
    }
    if (poe2dbDrop !== undefined && poe2dbDrop > 1) {
      tierWeight = poe2dbDrop;
    }
    const tier: IModTierType = {
      tier: index + 1,
      levelRequirement: row.requiredLevel,
      weight: tierWeight,
      statRanges: sortWikiStatRangesForDisplay(normalizeWikiStatRangesForDisplay(row.statRanges)),
      ...(tierRollName !== undefined ? { tierRollName } : {}),
      ...(row.requiredIntelligence !== undefined && row.requiredIntelligence !== null
        ? { requiredIntelligence: row.requiredIntelligence }
        : {}),
    };
    return tier;
  });
};
