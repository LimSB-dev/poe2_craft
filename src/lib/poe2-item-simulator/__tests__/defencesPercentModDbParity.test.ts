import poe2dbModDropWeights from "@/lib/poe2-item-simulator/data/poe2db-mod-drop-weights.json";
import { modDbTotalWeightHintTierCount } from "@/lib/poe2-item-simulator/poe2dbModDbTotalWeightHints";
import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";

/**
 * PoE2DB UI의 DefencesPercent(및 인접 로컬 방어 %) 계열은 위키·시뮬에서 modKey별로 쪼개져 있다.
 * `poe2db-mod-drop-weights.json`의 `modDbTotalWeightHintsByModKey`는 추출 시점 PoE2DB 가중치 합을 담는다.
 * 티어 개수는 `modDbTotalWeightHintTierCount`(= missing + 가중치 있는 티어 수)와 `modDb.tierCount`를 맞춘다.
 */
const DEFENCES_FAMILY_MOD_KEYS = [
  "prefix_inc_es",
  "prefix_max_armour",
  "prefix_inc_armour",
  "prefix_max_evasion",
  "prefix_inc_evasion",
  "prefix_armour_evasion_flat",
  "prefix_inc_armour_evasion",
  "prefix_armour_es_flat",
  "prefix_inc_armour_es",
  "prefix_evasion_es_flat",
  "prefix_inc_evasion_es",
] as const;

describe("modDb vs PoE2DB total-weight hints (DefencesPercent-related families)", () => {
  const hints = poe2dbModDropWeights.modDbTotalWeightHintsByModKey;
  const byKey = new Map(MOD_DB.records.map((r) => [r.modKey, r]));

  test.each([...DEFENCES_FAMILY_MOD_KEYS])("%s: tierCount/totalWeight match hints when PoE2DB weights are complete", (modKey) => {
    const hint = hints[modKey as keyof typeof hints];
    expect(hint).toBeDefined();
    if (!hint) {
      return;
    }
    expect(hint.missingWikiModIds).toEqual([]);
    const rec = byKey.get(modKey);
    expect(rec).toBeDefined();
    expect(rec!.tierCount).toBe(modDbTotalWeightHintTierCount(hint));
    expect(rec!.totalWeight).toBe(hint.suggestedTotalWeight);
  });
});
