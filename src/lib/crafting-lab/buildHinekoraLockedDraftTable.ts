import {
  CRAFT_LAB_ORB_SLOT_IDS,
  orbSlotIdToFamilyKind,
  type CraftingCurrencyIdType,
  type CraftingOrbFamilyIdType,
} from "@/lib/crafting-lab/craftingLabCurrencyIds";
import {
  applyChaosOrb,
  applyExaltedOrb,
  applyFracturingOrb,
  applyOrbOfAlchemy,
  applyOrbOfAnnulment,
  applyOrbOfAugmentation,
  applyOrbOfTransmutation,
  applyRegalOrb,
} from "@/lib/poe2-item-simulator/currency";
import {
  applyEssence,
  canApplyEssence,
  CRAFT_LAB_ESSENCE_DEFINITIONS,
} from "@/lib/poe2-item-simulator/essence/essence";
import type { IModRollBaseFiltersType } from "@/lib/poe2-item-simulator/roller";
import type { IItemRoll } from "@/lib/poe2-item-simulator/types";

import { isCraftLabOrbSlotApplicable } from "./isCraftLabOrbFamilyApplicable";

const CRAFT_LAB_ORB_APPLY: Record<
  CraftingOrbFamilyIdType,
  (roll: IItemRoll, filters: IModRollBaseFiltersType | undefined) => IItemRoll
> = {
  orb_transmutation: (roll, filters) => applyOrbOfTransmutation(roll, filters),
  orb_augmentation: (roll, filters) => applyOrbOfAugmentation(roll, filters),
  orb_regal: (roll, filters) => applyRegalOrb(roll, filters),
  orb_alchemy: (roll, filters) => applyOrbOfAlchemy(roll, filters),
  orb_exalted: (roll, filters) => applyExaltedOrb(roll, filters),
  orb_fracturing: (roll) => applyFracturingOrb(roll),
  orb_chaos: (roll, filters) => applyChaosOrb(roll, filters),
  orb_annulment: (roll) => applyOrbOfAnnulment(roll),
};

export type CloneItemRollFnType = (roll: IItemRoll) => IItemRoll;

/**
 * 히네코라 자물쇠가 걸린 순간의 베이스(`strippedBase`)에 대해,
 * 창고에 노출된 오브·에센스별로 **한 번씩만** 적용 결과를 계산해 고정한다.
 * 각 화폐는 동일 베이스 클론에 대해 독립적으로 시뮬되며, 호버/클릭 시 이 맵만 참조한다.
 */
export const buildHinekoraLockedDraftTable = (
  strippedBase: IItemRoll,
  rollForApplicability: IItemRoll,
  filters: IModRollBaseFiltersType | undefined,
  cloneItemRoll: CloneItemRollFnType,
): Partial<Record<CraftingCurrencyIdType, IItemRoll>> => {
  const out: Partial<Record<CraftingCurrencyIdType, IItemRoll>> = {};
  for (const id of CRAFT_LAB_ORB_SLOT_IDS) {
    if (!isCraftLabOrbSlotApplicable(id, rollForApplicability)) {
      continue;
    }
    try {
      const family = orbSlotIdToFamilyKind(id);
      const applyOrb = CRAFT_LAB_ORB_APPLY[family];
      out[id] = applyOrb(cloneItemRoll(strippedBase), filters);
    } catch {
      // 적용 불가/내부 오류는 해당 슬롯만 생략
    }
  }
  for (const essenceDef of CRAFT_LAB_ESSENCE_DEFINITIONS) {
    if (!canApplyEssence(rollForApplicability, essenceDef, filters)) {
      continue;
    }
    try {
      out[essenceDef.essenceKey] = applyEssence(
        cloneItemRoll(strippedBase),
        essenceDef,
        filters,
      );
    } catch {
      // omit
    }
  }
  return out;
};

type HinekoraDraftCacheEntryType = {
  key: string;
  table: Partial<Record<CraftingCurrencyIdType, IItemRoll>>;
};

let hinekoraLockedDraftTableCache: HinekoraDraftCacheEntryType | null = null;

/**
 * 동일 잠금 세션 키에 대해 표를 한 번만 계산해 재사용한다(Strict Mode 이중 마운트 포함).
 */
export const getCachedHinekoraLockedDraftTable = (
  sessionKey: string | null,
  filters: IModRollBaseFiltersType | undefined,
  buildTable: () => Partial<Record<CraftingCurrencyIdType, IItemRoll>>,
): Partial<Record<CraftingCurrencyIdType, IItemRoll>> | null => {
  if (sessionKey === null || filters === undefined) {
    hinekoraLockedDraftTableCache = null;
    return null;
  }
  if (hinekoraLockedDraftTableCache?.key === sessionKey) {
    return hinekoraLockedDraftTableCache.table;
  }
  const table = buildTable();
  hinekoraLockedDraftTableCache = { key: sessionKey, table };
  return table;
};
