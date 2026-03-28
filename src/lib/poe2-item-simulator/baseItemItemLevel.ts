/** Simulator item level (ilvl) bounds; matches filter Lv cap headroom. */
export const BASE_ITEM_ITEM_LEVEL_MIN: number = 1;
export const BASE_ITEM_ITEM_LEVEL_MAX: number = 100;

/** Default ilvl when opening the workbench (endgame-oriented). */
export const BASE_ITEM_ITEM_LEVEL_DEFAULT: number = 86;

export const clampBaseItemItemLevel = (raw: number): number => {
  if (!Number.isFinite(raw)) {
    return BASE_ITEM_ITEM_LEVEL_DEFAULT;
  }
  const rounded = Math.round(raw);
  return Math.max(
    BASE_ITEM_ITEM_LEVEL_MIN,
    Math.min(BASE_ITEM_ITEM_LEVEL_MAX, rounded),
  );
};
