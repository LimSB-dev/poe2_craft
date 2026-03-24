# Src Architecture (Target)

## Target hierarchy

- `app/`: Next.js routes
- `features/`: domain-first modules
  - `crafting/`
  - `optimizer/`
- `components/`: shared atomic UI only
  - `atoms/`
  - `molecules/`
  - `organisms/`
- `containers/`: optional global containers
- `shared/`: global shared hooks/utils/constants/types
- `lib/`: pure business logic engine
- `api/`: API client layer

## Current migration status

1. Added `features/crafting` and `features/optimizer` skeleton.
2. Updated route entry imports to use `features/*/components`.
3. Kept existing `components/*` feature implementations via re-export bridge for safe incremental migration.

## Next migration steps

1. Move feature-specific UI from `components/*` into `features/*/components`.
2. Keep only truly shared primitives in `components/atoms|molecules|organisms`.
3. Move orchestration logic into `features/*/containers` and `features/*/hooks`.
