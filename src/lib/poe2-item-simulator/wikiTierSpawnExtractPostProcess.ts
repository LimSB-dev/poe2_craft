import type { WikiExtractedModTierRowType } from "@/lib/poe2-item-simulator/wikiModTierTypes";

/**
 * Cargo에 없고 PoE2DB 상세에만 나오는 **지능 요구치** (mods.id → 값).
 * @see PoE2DB — `EnergyShieldRechargeRate6` 등 고티어 포커/INT 방어구 접미.
 */
const POE2DB_REQUIRED_INTELLIGENCE_BY_WIKI_MOD_ID: Readonly<Partial<Record<string, number>>> = {
  /** PoE2DB / 타 사이트 공통 — 최상위 ES 재충전 속도 % 접미. */
  EnergyShieldRechargeRate6: 900,
};

/**
 * 위키 Cargo만으로는 부위별 스폰이 PoE2DB와 어긋날 수 있다.
 * `repairEmptySpawnWeightsInWikiTierRows`로 인접 티어 스폰을 채운 **뒤**, 추출 파이프라인에서만 적용한다.
 *
 * @see PoE2DB — `ItemFoundRarityIncreasePrefix` 최상위 두 티는 반지·목걸이만, 투구에는 스폰 없음.
 */
export const applyPoe2dbWikiSpawnPostCorrections = (
  rows: WikiExtractedModTierRowType[],
): { correctionsApplied: number; intelligenceHintsApplied: number } => {
  let correctionsApplied = 0;

  for (const row of rows) {
    if (
      row.modGroups === "ItemFoundRarityIncreasePrefix" &&
      row.generationType === 1 &&
      (row.wikiModId === "ItemFoundRarityIncreasePrefix4_" ||
        row.wikiModId === "ItemFoundRarityIncreasePrefix5")
    ) {
      row.spawnWeights = row.spawnWeights.map((w) => {
        if (w.tag === "helmet") {
          return { ordinal: w.ordinal, tag: w.tag, value: 0 };
        }
        return w;
      });
      correctionsApplied += 1;
    }
  }

  let intelligenceHintsApplied = 0;
  for (const row of rows) {
    const hint = POE2DB_REQUIRED_INTELLIGENCE_BY_WIKI_MOD_ID[row.wikiModId];
    if (hint !== undefined) {
      row.requiredIntelligence = hint;
      intelligenceHintsApplied += 1;
    }
  }

  return { correctionsApplied, intelligenceHintsApplied };
};
