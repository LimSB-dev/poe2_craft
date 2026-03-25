/**
 * PoE2DB rows for socketable / bonded / essence items use `modifierName` HTML with
 * `href="Item_Id"` to identify the soul core, gem, or essence. Merging rows without this
 * slug collapses distinct PoE2DB modifiers into one incorrect tier ladder.
 *
 * Normal affix rows use plain-text names (no HTML); for those we return "" so tier ladders
 * still merge by stat template as on PoE2DB.
 */
export const extractPoe2DbModifierPartitionKey = (modifierName: string | null): string => {
  if (modifierName === null) {
    return "";
  }
  const trimmed = modifierName.trim();
  if (trimmed.length === 0) {
    return "";
  }
  const hrefMatch = /href="([^"]+)"/.exec(trimmed);
  if (hrefMatch !== null && hrefMatch[1] !== undefined) {
    return hrefMatch[1].trim();
  }
  if (trimmed.includes("<")) {
    return trimmed
      .replace(/<[^>]+>/g, "")
      .trim()
      .slice(0, 200);
  }
  return "";
};
