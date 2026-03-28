import type {
  WikiExtractedModTierRowType,
  WikiItemModTiersFileType,
  WikiModSpawnWeightRowType,
  WikiModStatRangeRowType,
} from "@/lib/poe2-item-simulator/wikiModTierTypes";

/**
 * PoE2DB 모디파이어 상세 화면과 동일한 정보 밀도를 갖춘 **티어 1행** 스냅샷 타입 별칭.
 * `scripts/extract-poe2wiki-item-mod-tiers.ts` 가 `rows[]`에 채운다.
 */
export type Poe2DbStyleModTierRecordType = WikiExtractedModTierRowType;

/** 저장 JSON 루트 — `WikiItemModTiersFileType` 과 동일. */
export type Poe2DbStyleModTierFileMetaType = WikiItemModTiersFileType;

/** UI·문서용: 스폰 태그를 PoE2DB 스타일 문자열로 표기. */
export const formatSpawnWeightsPoe2DbStyle = (
  weights: ReadonlyArray<WikiModSpawnWeightRowType>,
): string => {
  return weights.map((w) => `${w.tag}: ${String(w.value)}`).join(", ");
};

/** UI·문서용: 스탯 한 줄 요약. */
export const formatStatRangesPoe2DbStyle = (
  ranges: ReadonlyArray<WikiModStatRangeRowType>,
): string => {
  return ranges
    .map((r) => {
      const local = r.isLocal === true ? " (local)" : "";
      return `${r.statId}: ${String(r.min)}–${String(r.max)}${local}`;
    })
    .join("; ");
};
