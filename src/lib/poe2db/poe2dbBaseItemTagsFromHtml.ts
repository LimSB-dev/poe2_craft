/**
 * PoE2DB 베이스 상세 HTML의 `Tags` 표 행 — `str_armour, helmet, armour` 등.
 * @see `scripts/extract-poe2db-base-items.ts` — `tab-pane` 활성 탭 HTML 조각에 대해 호출.
 */
export const extractPoe2dbBaseItemTagsFromDetailHtml = (htmlChunk: string): string[] => {
  const m = htmlChunk.match(/<tr><td>Tags<\/td><td>([^<]*)<\/td><\/tr>/i);
  if (m === null) {
    return [];
  }
  const raw = m[1]?.trim() ?? "";
  if (raw.length === 0) {
    return [];
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};
