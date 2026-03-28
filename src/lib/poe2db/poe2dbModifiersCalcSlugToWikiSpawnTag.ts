import { POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE } from "@/lib/poe2db/poe2dbItemClassSlugs";
import { wikiPrimarySpawnWeightColumnTag } from "@/lib/poe2-item-simulator/wikiTierSpawnFilter";

/**
 * PoE2DB `#ModifiersCalc` 페이지 슬러그(예: `Body_Armours`) → 위키 `mod_spawn_weights` **단일 컬럼** 태그.
 * 무기·원거리 등 `wikiPrimarySpawnWeightColumnTag`가 `null`인 부위는 `null`(전역 `DropChance` max만 사용).
 *
 * @see `wikiPrimarySpawnWeightColumnTag` — 베이스 부위별로 어떤 스폰 열을 쓰는지와 동일한 축.
 */
export const POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG: Readonly<
  Record<string, string | null>
> = (() => {
  const out: Record<string, string | null> = {};
  for (const subType of Object.keys(POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE) as IBaseItemSubTypeType[]) {
    const slug = POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE[subType];
    out[slug] = wikiPrimarySpawnWeightColumnTag(subType);
  }
  return out;
})();
