import type { CraftLabPreviewRowType } from "@/lib/crafting-lab/craftLabOrbPreview";

/**
 * 동일 `statRanges`면 동일 문자열이 되도록(순서 유지 — `#` 치환 순서와 일치).
 */
export const craftLabPreviewStatRangesFingerprint = (
  ranges: ReadonlyArray<{ min: number; max: number }>,
): string => {
  return JSON.stringify(
    ranges.map((r) => {
      return { min: r.min, max: r.max };
    }),
  );
};

/**
 * 가중합 병합 키: 수치 지문이 같으면 표시 티어가 달라도 한 줄로 합친다.
 * `statRanges`가 없으면 기존처럼 `modKey + 표시 티어`로만 구분.
 */
export const craftLabPreviewMergeKey = (row: CraftLabPreviewRowType): string => {
  if (row.statRanges !== undefined && row.statRanges.length > 0) {
    return `${row.modKey}::sr::${craftLabPreviewStatRangesFingerprint(row.statRanges)}`;
  }
  return `${row.modKey}::t::${String(row.tier)}`;
};

/**
 * 카오스 “제거 후 추가” 등에서 시나리오마다 같은 옵이 다른 표시 티어로 잡혀 중복 줄이 생기는 것을 막는다.
 * 병합 시 표시 티어는 더 좋은 쪽(숫자가 작을수록 상위 티어)을 남기고, 확률은 합산한다.
 */
export const mergeCraftLabPreviewRows = (
  rows: CraftLabPreviewRowType[],
): CraftLabPreviewRowType[] => {
  const map = new Map<string, CraftLabPreviewRowType>();
  for (const row of rows) {
    const key = craftLabPreviewMergeKey(row);
    const prev = map.get(key);
    if (prev === undefined) {
      map.set(key, { ...row });
    } else {
      const prevPf = prev.poolFraction;
      const rowPf = row.poolFraction;
      const mergedPoolFraction =
        prevPf === undefined && rowPf === undefined
          ? undefined
          : (prevPf ?? 0) + (rowPf ?? 0);
      map.set(key, {
        ...prev,
        probability: prev.probability + row.probability,
        tier: Math.min(prev.tier, row.tier),
        weight: Math.max(prev.weight, row.weight),
        ...(mergedPoolFraction !== undefined ? { poolFraction: mergedPoolFraction } : {}),
        statRanges: prev.statRanges ?? row.statRanges,
      });
    }
  }
  return [...map.values()].sort((a, b) => {
    return b.probability - a.probability;
  });
};
