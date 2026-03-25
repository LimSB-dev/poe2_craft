/**
 * Strategy comparison (UI + API + engine) shared constants.
 *
 * Keep these in one place so the client controls and the route handler stay aligned.
 */

export const STRATEGY_COMPARISON_MAX_TRIALS: number = 50000;
export const STRATEGY_COMPARISON_DEFAULT_TRIALS: number = 10000;

/** UI fetch query default (kept explicit for stability). */
export const STRATEGY_COMPARISON_TRIALS_QUERY: number = 10000;

export const STRATEGY_COMPARISON_DEFAULT_BUDGET_MAX_CHAOS: number = 80;
export const STRATEGY_COMPARISON_BUDGET_MIN: number = 1;
export const STRATEGY_COMPARISON_BUDGET_MAX: number = 200;

export const STRATEGY_COMPARISON_DEFAULT_MIN_GOOD_MODS: number = 3;
export const STRATEGY_COMPARISON_MIN_GOOD_MODS_MIN: number = 1;
export const STRATEGY_COMPARISON_MIN_GOOD_MODS_MAX: number = 6;

export const STRATEGY_COMPARISON_DEFAULT_MIN_TOTAL_AFFIXES: number = 4;
export const STRATEGY_COMPARISON_MIN_TOTAL_AFFIXES_MIN: number = 1;
export const STRATEGY_COMPARISON_MIN_TOTAL_AFFIXES_MAX: number = 6;

export const STRATEGY_COMPARISON_GOOD_TIER_MIN: number = 1;
export const STRATEGY_COMPARISON_GOOD_TIER_MAX: number = 5;

