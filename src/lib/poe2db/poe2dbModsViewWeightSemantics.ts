/**
 * PoE2DB `#ModifiersCalc` / embedded `ModsView` JSON — **가중치 숫자의 의미** (UI vs 추출).
 *
 * ## What this repo extracts
 * `scripts/extract-poe2db-mod-drop-weights.ts` parses `new ModsView(...)` from each base page HTML and reads
 * **`normal[]` row field `DropChance` only** (see `parseDropChance`).
 * - **`weightsByWikiModId`**: same `wikiModId` across pages → **max** (`DropChance`) — used for `modDbTotalWeightHints` sums / legacy single number.
 * - **`weightsByWikiModIdAndWikiSpawnTag`**: wiki spawn tag (`helmet`, `body_armour`, …) → **max per tag**.
 * - **`weightsByWikiModIdAndPoe2DbPageSlug`**: PoE2DB item-class page slug (`Helmets`, `Body_Armours`, …) → **max per slug** — 우선 사용; 투구 등에서 `wikiModId` 해석만으로는 태그 맵이 비는 경우를 `Code` 폴백 추출로 보강.
 * - `tryGetWikiModTiers`: 부위(`baseItemSubType`) → `POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE` 슬러그로 페이지별 가중치 조회 후, 없으면 스폰 태그, 마지막으로 전역 max.
 *
 * ## Relationship to the web UI (red “weight” badge, e.g. 900)
 * The number shown next to a tier in the PoE2DB UI **must not be assumed equal** to `DropChance` on the same row.
 * Example reported mismatch: `LocalAttributeRequirements` / `ReducedLocalAttributeRequirements*` — UI **900** vs embedded
 * **`DropChance` 1000** on the `ModsView` row.
 *
 * Plausible reasons (hypotheses):
 * - Display scaling / rounding (e.g. UI shows a different unit or normalized value).
 * - The table renders another column or computed field; the JSON still carries raw `DropChance`.
 * - Client-side bundle transforms values before paint.
 *
 * ## How to reverse-map UI → JSON (manual)
 * 1. Open the relevant base page with `#ModifiersCalc` in a browser (e.g. body armours).
 * 2. DevTools → pick the DOM node for the red badge / row; check `data-*`, sibling text, or Vue/React component state if exposed.
 * 3. In **Sources**, search for `ModsView` payload or set a breakpoint where `normal` rows are rendered; inspect the **full row object** and list **all numeric keys** besides `DropChance`.
 * 4. If a second field matches the UI (900), document it here and optionally extend the extract script to record it separately (e.g. `displayWeight` vs `dropChanceRaw`).
 *
 * ## Single source of truth **in this codebase**
 * - **Simulator / modDb hint parity**: trust **`DropChance`** from `ModsView.normal[]` as produced by the extractor.
 * - **Screenshot / tooltip numbers**: treat as **reference only** until mapped to a concrete JSON field via the steps above.
 */
export const POE2DB_MODSVIEW_NORMAL_ROW_WEIGHT_FIELD_USED_BY_EXTRACT = "DropChance" as const;
