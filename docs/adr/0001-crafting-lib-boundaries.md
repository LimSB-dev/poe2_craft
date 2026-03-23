# ADR 0001: Crafting library boundaries

- Status: accepted
- Date: 2026-03-24

## Context

The project currently has crafting logic split across:

- `src/lib/poe2-item-simulator/*` (domain rules, roll logic, data tables)
- `src/lib/crafting-lab/*` (Crafting Lab page orchestration and UI-adjacent helpers)

As more pages/features reuse crafting logic, imports can become unclear if feature-specific files are treated like shared domain modules.

## Decision

Define and keep explicit boundaries:

1. Shared domain logic lives in `src/lib/crafting-core/*`.
2. Crafting Lab feature logic remains in `src/lib/crafting-lab/*`.
3. Page/components should import domain rules from `crafting-core`, not from feature-specific files.
4. `crafting-lab` can depend on `crafting-core`, but `crafting-core` must not depend on `crafting-lab`.

This ADR introduces `src/lib/crafting-core/index.ts` as the first shared entry point without changing runtime behavior.

## Classification (current files)

### Shared domain (use/re-export via `crafting-core`)

- `basicCurrencyOrbs.ts`
- `chaosOrb.ts`
- `essence.ts`
- `abyssCrafting.ts`
- `ritualCrafting.ts`
- `hinekorasLock.ts`
- `roller.ts`
- `types.ts`
- `random.ts`
- `craftingDecision.ts`
- `craftingDecisionSimulation.ts`
- `strategyComparisonEngine.ts`

### Crafting Lab feature-specific (keep in `crafting-lab`)

- `craftingLabCurrencyIds.ts`
- `craftingLabCurrencyIconUrls.ts`
- `craftingLabUsageStorage.ts`
- `craftLabOrbPreview.ts`
- `buildHinekoraLockedDraftTable.ts`
- `hinekoraHoverPreviewDiff.ts`

### Transitional / naming candidate

- `craftLabStagedOmen.ts` is currently under `poe2-item-simulator`, but semantically tied to Crafting Lab staged omen UX. Keep as-is for now, and relocate only when reused patterns become clear.

## Consequences

- Positive:
  - Lower coupling between page features
  - Cleaner import decisions for new pages
  - Safer incremental refactor path
- Trade-off:
  - Existing files are not moved immediately; migration is gradual.

## Migration plan

1. Add `crafting-core` entry exports (done).
2. New pages import shared rules from `crafting-core`.
3. Incrementally update existing imports when touching related files.
4. If `craftLabStagedOmen` becomes cross-feature, move/rename to a neutral module.
