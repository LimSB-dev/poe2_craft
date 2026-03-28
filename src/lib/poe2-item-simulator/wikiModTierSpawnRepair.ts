import type { WikiExtractedModTierRowType } from "@/lib/poe2-item-simulator/wikiModTierTypes";

/**
 * `IncreasedLife13` → `IncreasedLife`, `LocalIncreasedEnergyShieldPercent7_` → `LocalIncreasedEnergyShieldPercent`.
 * 동일 사다리(티어 줄)를 묶어 빈 스폰 보정에 사용한다.
 */
export const wikiModIdStatFamilyPrefix = (wikiModId: string): string => {
  return wikiModId.replace(/\d+_?$/, "");
};

/**
 * 요구 레벨 순으로 정렬된 한 사다리에서 `spawnWeights`가 비어 있는 줄에 인접 틀의 스폰을 복사한다.
 */
const rowHasPositiveSpawnWeight = (row: WikiExtractedModTierRowType): boolean => {
  return row.spawnWeights.some((w) => {
    return w.value > 0;
  });
};

/** Cargo가 행을 비우거나, 태그는 있으나 전부 `value: 0`만 넣는 경우가 있어 스폰 복구 대상으로 본다. */
const rowNeedsSpawnWeightRepair = (row: WikiExtractedModTierRowType): boolean => {
  return !rowHasPositiveSpawnWeight(row);
};

const repairEmptySpawnsInSortedLadder = (
  subList: WikiExtractedModTierRowType[],
): number => {
  if (subList.length <= 1) {
    return 0;
  }
  subList.sort((a, b) => {
    if (a.requiredLevel !== b.requiredLevel) {
      return a.requiredLevel - b.requiredLevel;
    }
    return a.wikiModId.localeCompare(b.wikiModId);
  });
  let repairedCount = 0;
  for (let i = 0; i < subList.length; i += 1) {
    const row = subList[i];
    if (row === undefined || !rowNeedsSpawnWeightRepair(row)) {
      continue;
    }
    const prev = subList
      .slice(0, i)
      .reverse()
      .find((r) => {
        return rowHasPositiveSpawnWeight(r);
      });
    const next = subList.slice(i + 1).find((r) => {
      return rowHasPositiveSpawnWeight(r);
    });
    const donor = prev ?? next;
    if (donor !== undefined && rowHasPositiveSpawnWeight(donor)) {
      row.spawnWeights = donor.spawnWeights.map((w) => {
        return { ordinal: w.ordinal, tag: w.tag, value: w.value };
      });
      repairedCount += 1;
    }
  }
  return repairedCount;
};

/**
 * Cargo가 특정 `mods.id`에 대해 `mod_spawn_weights`를 비워 두는 경우가 있어 `wikiSpawnRowMatchesBaseItem`이
 * 해당 티어를 전부 제외한다(예: `DefencesPercent`의 `LocalIncreasedEnergyShieldPercent7_`, `LifeRegeneration8_`).
 * 같은 `(mod_groups, generation_type)`·같은 `wikiModIdStatFamilyPrefix` 묶음에서 **요구 레벨 순**으로
 * 인접 티어의 스폰을 복사해 채운다.
 *
 * **`LifeRegeneration`**: `NearbyAlliesLifeRegeneration*`(셉터 등)는 제외하고 플레이어 접미 사다리만 보정한다.
 * **`ItemFoundRarityIncreasePrefix`**: `ItemFoundRarityIncreasePrefix4_` 등 상위 티에서 Cargo가 스폰 행을 비우는 경우가 있어 인접 티에서 복사한다.
 *   투구 전용 상한(`Prefix4_`/`Prefix5` → `helmet: 0`)은 **`applyPoe2dbWikiSpawnPostCorrections`**(추출 스크립트)에서만 적용한다.
 * **`ItemFoundRarityIncrease` (접미)**: `ItemFoundRarityIncrease4`·`5`가 전부 `value: 0`만 오는 경우가 있어 인접 티에서 복사한다.
 * **`EnergyShieldRegeneration` (접미, `EnergyShieldRechargeRate*`)**: `EnergyShieldRechargeRate5______` 등 Cargo 빈 스폰 행 복구.
 * 빈 스폰이 의도적인 다른 `mod_groups`는 건드리지 않는다.
 */
export const repairEmptySpawnWeightsInWikiTierRows = (
  rows: WikiExtractedModTierRowType[],
): { repairedCount: number } => {
  let repairedCount = 0;
  const byGroup = new Map<string, WikiExtractedModTierRowType[]>();
  for (const row of rows) {
    if (row.modGroups !== "DefencesPercent") {
      continue;
    }
    const key = `${row.modGroups}::${String(row.generationType)}`;
    const list = byGroup.get(key) ?? [];
    list.push(row);
    byGroup.set(key, list);
  }

  for (const [, list] of byGroup) {
    const byPrefix = new Map<string, WikiExtractedModTierRowType[]>();
    for (const row of list) {
      const prefix = wikiModIdStatFamilyPrefix(row.wikiModId);
      const sub = byPrefix.get(prefix) ?? [];
      sub.push(row);
      byPrefix.set(prefix, sub);
    }
    for (const [, subList] of byPrefix) {
      if (subList.length <= 1) {
        continue;
      }
      repairedCount += repairEmptySpawnsInSortedLadder(subList);
    }
  }

  const lifeRegenPlayer = rows.filter((row) => {
    return (
      row.modGroups === "LifeRegeneration" &&
      row.generationType === 2 &&
      !row.wikiModId.startsWith("NearbyAllies")
    );
  });
  if (lifeRegenPlayer.length > 1) {
    repairedCount += repairEmptySpawnsInSortedLadder(lifeRegenPlayer);
  }

  const itemRarityPrefix = rows.filter((row) => {
    return row.modGroups === "ItemFoundRarityIncreasePrefix" && row.generationType === 1;
  });
  if (itemRarityPrefix.length > 1) {
    repairedCount += repairEmptySpawnsInSortedLadder(itemRarityPrefix);
  }

  const itemRaritySuffix = rows.filter((row) => {
    return row.modGroups === "ItemFoundRarityIncrease" && row.generationType === 2;
  });
  if (itemRaritySuffix.length > 1) {
    repairedCount += repairEmptySpawnsInSortedLadder(itemRaritySuffix);
  }

  const energyShieldRechargeSuffix = rows.filter((row) => {
    return row.modGroups === "EnergyShieldRegeneration" && row.generationType === 2;
  });
  if (energyShieldRechargeSuffix.length > 1) {
    repairedCount += repairEmptySpawnsInSortedLadder(energyShieldRechargeSuffix);
  }

  return { repairedCount };
};
