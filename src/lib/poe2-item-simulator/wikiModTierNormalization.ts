import type { WikiModStatRangeRowType } from "@/lib/poe2-item-simulator/wikiModTierTypes";

/**
 * PoE2DB / 게임 DB 관례: `local energy shield` 등은 내부 stat id 가 `local_` 접두로 온다.
 * 위키 Cargo `mod_stats`에는 별도 플래그가 없을 수 있어 id 로만 추론한다.
 */
export const inferIsLocalFromStatId = (statId: string | undefined | null): boolean => {
  if (statId === undefined || statId === null || statId === "") {
    return false;
  }
  return statId.startsWith("local_") || statId.includes("_local_");
};

export const enrichWikiModStatRangesWithLocalFlag = (
  ranges: ReadonlyArray<{ statId: string; min: number; max: number }>,
): WikiModStatRangeRowType[] => {
  return ranges.map((r) => {
    return {
      statId: r.statId,
      min: r.min,
      max: r.max,
      isLocal: inferIsLocalFromStatId(r.statId),
    };
  });
};
