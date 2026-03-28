import poe2dbModDropWeights from "@/lib/poe2-item-simulator/data/poe2db-mod-drop-weights.json";
import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";
import { MOD_WIKI_TIER_SOURCES } from "@/lib/poe2-item-simulator/modWikiTierSources";
import { modDbTotalWeightHintTierCount } from "@/lib/poe2-item-simulator/poe2dbModDbTotalWeightHints";

/**
 * `modDb.tierCount` / `totalWeight`는 PoE2DB `DropChance` 합(`modDbTotalWeightHintsByModKey`)과 맞춘다.
 * 예외: `prefix_max_mana`는 위키 전체 사다리 13티어인데 시뮬은 장갑·장화·투구만(9티어)이라 힌트 합·티어 수가 의도적으로 다름.
 */
const MOD_KEYS_EXCLUDED_FROM_POE2DB_HINT_PARITY: ReadonlySet<string> = new Set(["prefix_max_mana"]);

describe("modDb vs PoE2DB total-weight hints (all MOD_WIKI_TIER_SOURCES with complete weights)", () => {
  const hints = poe2dbModDropWeights.modDbTotalWeightHintsByModKey;
  const byKey = new Map(MOD_DB.records.map((r) => [r.modKey, r]));

  const modKeys = Object.keys(MOD_WIKI_TIER_SOURCES).filter((k) => {
    return !MOD_KEYS_EXCLUDED_FROM_POE2DB_HINT_PARITY.has(k);
  });

  test.each(modKeys)("%s", (modKey) => {
    const hint = hints[modKey as keyof typeof hints];
    expect(hint).toBeDefined();
    if (!hint || hint.missingWikiModIds.length > 0) {
      return;
    }
    const rec = byKey.get(modKey);
    expect(rec).toBeDefined();
    expect(rec!.tierCount).toBe(modDbTotalWeightHintTierCount(hint));
    expect(rec!.totalWeight).toBe(hint.suggestedTotalWeight);
  });
});
