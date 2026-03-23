# Base Item Images

Store base item icons with this hierarchy:

- `public/images/items/{equipmentType}/{subType}/{item-english-name-slug}.webp`

Examples:

- `public/images/items/armour/gloves/stocky-mitts.webp`
- `public/images/items/armour/bodyArmour/fur-plate.webp`

Rules:

- Use lowercase English item names (slug), matching `toBaseItemImageFileSlug` in code.
- Replace spaces/special characters with `-`.
- File extension is **`.webp`** (PoE2DB CDN와 동일 포맷).

PoE2DB에서 아이콘·영문 베이스명을 맞추려면:

```bash
yarn tsx scripts/download-poe2db-base-item-images.ts
```

생성물:

- `data/generated/base-item-image-meta.json` — `baseItemKey` → 영문 표기·슬러그
- `public/images/items/_download_report.tsv` — 실패/스킵 사유

The app path builder is in `src/lib/poe2-item-simulator/baseItemImagePaths.ts`.
