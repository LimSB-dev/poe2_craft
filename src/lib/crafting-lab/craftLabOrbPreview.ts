import type { CraftingOrbFamilyIdType } from "@/lib/crafting-lab/craftingLabCurrencyIds";
import {
  canApplyChaosOrb,
  canApplyExaltedOrb,
  canApplyFracturingOrb,
  canApplyOrbOfAlchemy,
  canApplyOrbOfAnnulment,
  canApplyOrbOfAugmentation,
  canApplyOrbOfTransmutation,
  canApplyRegalOrb,
} from "@/lib/poe2-item-simulator/currency";
import { mergeCraftLabPreviewRows } from "@/lib/crafting-lab/craftLabPreviewMerge";
import {
  listModRollCandidates,
  resolveStatRangesForModDefinition,
  type IModRollBaseFiltersType,
} from "@/lib/poe2-item-simulator/roller";

export type CraftLabPreviewRowType = {
  modKey: string;
  nameTemplateKey: string;
  tier: number;
  /** 0~1, 모든 섹션·행 합이 대략 1이 되도록(알림 섹션 제외) */
  probability: number;
  weight: number;
  /**
   * 해당 접두 또는 접미 풀 안에서의 상대 비중 `weight / sum(풀)`.
   * 최종 확률은 `probability ≈ affixTypeMass × poolFraction`(예: 접두·접미 동시 공개 시 각 50%).
   * 가중치 열과 비율을 맞출 때는 이 열과 비교한다.
   */
  poolFraction?: number;
  /** UI `#` 치환. 없으면 템플릿만 표시. */
  statRanges?: ReadonlyArray<{ min: number; max: number }>;
};

export type CraftLabPreviewSectionType = {
  /** `simulator.craftLab.{headingKey}` */
  headingKey: string;
  rows: CraftLabPreviewRowType[];
};

export type CraftLabOrbPreviewResultType =
  | { status: "unavailable" }
  | {
      status: "ok";
      sections: CraftLabPreviewSectionType[];
      /** `simulator.craftLab.{key}` */
      noteKeys?: string[];
    };

const cloneRoll = (item: IItemRoll): IItemRoll => {
  const base: IItemRoll = {
    rarity: item.rarity,
    prefixes: [...item.prefixes],
    suffixes: [...item.suffixes],
  };
  if (item.hinekoraLockActive === true) {
    base.hinekoraLockActive = true;
  }
  if (item.isCorrupted === true) {
    base.isCorrupted = true;
  }
  return base;
};

const totalAffixCount = (item: IItemRoll): number => {
  return item.prefixes.length + item.suffixes.length;
};

const isFracturedMod = (mod: IModDefinition): boolean => {
  return mod.isFractured === true;
};

const countRemovableAffixes = (item: IItemRoll): number => {
  return [...item.prefixes, ...item.suffixes].filter((m) => {
    return !isFracturedMod(m);
  }).length;
};

const sumWeights = (mods: readonly IModDefinition[]): number => {
  return mods.reduce((sum, m) => {
    return sum + m.weight;
  }, 0);
};

const toRows = (
  mods: readonly IModDefinition[],
  probabilityMass: number,
): CraftLabPreviewRowType[] => {
  const total = sumWeights(mods);
  if (total <= 0 || probabilityMass <= 0) {
    return [];
  }
  return mods.map((m) => {
    const ranges = resolveStatRangesForModDefinition(m);
    const poolFraction = m.weight / total;
    return {
      modKey: m.modKey,
      nameTemplateKey: m.displayName,
      tier: m.tier,
      probability: probabilityMass * poolFraction,
      weight: m.weight,
      poolFraction,
      ...(ranges.length > 0 ? { statRanges: ranges } : {}),
    };
  });
};

/** 제왕·엑잘·카오스(추가 단계) 등: 희귀 한 줄 추가 시 접두/접미 선택 분포. */
const rareAddOneModTypeMass = (
  item: IItemRoll,
): { prefixMass: number; suffixMass: number } => {
  const canPrefix = item.prefixes.length < 3;
  const canSuffix = item.suffixes.length < 3;
  if (canPrefix && canSuffix) {
    return { prefixMass: 0.5, suffixMass: 0.5 };
  }
  if (canPrefix) {
    return { prefixMass: 1, suffixMass: 0 };
  }
  if (canSuffix) {
    return { prefixMass: 0, suffixMass: 1 };
  }
  return { prefixMass: 0, suffixMass: 0 };
};

const rareAddOneRows = (
  item: IItemRoll,
  baseFilters?: IModRollBaseFiltersType,
): CraftLabPreviewRowType[] => {
  const excludedModKeys = new Set<string>([
    ...item.prefixes.map((m) => {
      return m.modKey;
    }),
    ...item.suffixes.map((m) => {
      return m.modKey;
    }),
  ]);
  const { prefixMass, suffixMass } = rareAddOneModTypeMass(item);
  const pref = listModRollCandidates({
    rarity: "rare",
    modType: "prefix",
    excludedModKeys,
    ...baseFilters,
  });
  const suff = listModRollCandidates({
    rarity: "rare",
    modType: "suffix",
    excludedModKeys,
    ...baseFilters,
  });
  return mergeCraftLabPreviewRows([...toRows(pref, prefixMass), ...toRows(suff, suffixMass)]);
};

/** 확장의 오브: 매직 한 줄 추가 시 접두/접미 (코드는 basicCurrencyOrbs.pickRandomModTypeForMagicFill 과 동일). */
const magicAugmentModTypeMass = (
  item: IItemRoll,
): { prefixMass: number; suffixMass: number } => {
  const pLen = item.prefixes.length;
  const sLen = item.suffixes.length;
  if (pLen > 0 && sLen === 0) {
    return { prefixMass: 0, suffixMass: 1 };
  }
  if (sLen > 0 && pLen === 0) {
    return { prefixMass: 1, suffixMass: 0 };
  }
  if (pLen === 0 && sLen === 0) {
    return { prefixMass: 0.5, suffixMass: 0.5 };
  }
  return { prefixMass: 0, suffixMass: 0 };
};

const magicAugmentRows = (
  item: IItemRoll,
  baseFilters?: IModRollBaseFiltersType,
): CraftLabPreviewRowType[] => {
  const excludedModKeys = new Set<string>([
    ...item.prefixes.map((m) => {
      return m.modKey;
    }),
    ...item.suffixes.map((m) => {
      return m.modKey;
    }),
  ]);
  const { prefixMass, suffixMass } = magicAugmentModTypeMass(item);
  const pref = listModRollCandidates({
    rarity: "magic",
    modType: "prefix",
    excludedModKeys,
    ...baseFilters,
  });
  const suff = listModRollCandidates({
    rarity: "magic",
    modType: "suffix",
    excludedModKeys,
    ...baseFilters,
  });
  return mergeCraftLabPreviewRows([...toRows(pref, prefixMass), ...toRows(suff, suffixMass)]);
};

const excludedModKeysForChaosRerollSlot = (
  item: IItemRoll,
  kind: "prefix" | "suffix",
  slotIndex: number,
): Set<string> => {
  const s = new Set<string>();
  item.prefixes.forEach((m, j) => {
    if (kind === "prefix" && j === slotIndex) {
      return;
    }
    s.add(m.modKey);
  });
  item.suffixes.forEach((m, j) => {
    if (kind === "suffix" && j === slotIndex) {
      return;
    }
    s.add(m.modKey);
  });
  return s;
};

/** 카오스: 재굴림 대상 슬롯(균등)마다 그 슬롯에 올 수 있는 새 옵션 풀을 가중 합산. */
const chaosRerollCombinedRows = (
  item: IItemRoll,
  baseFilters?: IModRollBaseFiltersType,
): CraftLabPreviewRowType[] => {
  let n = 0;
  for (let i = 0; i < item.prefixes.length; i += 1) {
    if (!isFracturedMod(item.prefixes[i]!)) {
      n += 1;
    }
  }
  for (let i = 0; i < item.suffixes.length; i += 1) {
    if (!isFracturedMod(item.suffixes[i]!)) {
      n += 1;
    }
  }
  if (n === 0) {
    return [];
  }
  const pScenario = 1 / n;
  const combined: CraftLabPreviewRowType[] = [];
  for (let i = 0; i < item.prefixes.length; i += 1) {
    if (isFracturedMod(item.prefixes[i]!)) {
      continue;
    }
    const excluded = excludedModKeysForChaosRerollSlot(item, "prefix", i);
    const pref = listModRollCandidates({
      rarity: "rare",
      modType: "prefix",
      excludedModKeys: excluded,
      ...baseFilters,
    });
    const rows = mergeCraftLabPreviewRows(toRows(pref, 1));
    for (const row of rows) {
      combined.push({
        ...row,
        probability: row.probability * pScenario,
      });
    }
  }
  for (let i = 0; i < item.suffixes.length; i += 1) {
    if (isFracturedMod(item.suffixes[i]!)) {
      continue;
    }
    const excluded = excludedModKeysForChaosRerollSlot(item, "suffix", i);
    const suff = listModRollCandidates({
      rarity: "rare",
      modType: "suffix",
      excludedModKeys: excluded,
      ...baseFilters,
    });
    const rows = mergeCraftLabPreviewRows(toRows(suff, 1));
    for (const row of rows) {
      combined.push({
        ...row,
        probability: row.probability * pScenario,
      });
    }
  }
  return mergeCraftLabPreviewRows(combined);
};

const transmutationSections = (
  baseFilters?: IModRollBaseFiltersType,
): CraftLabPreviewSectionType[] => {
  const empty = new Set<string>();
  const pref = listModRollCandidates({
    rarity: "magic",
    modType: "prefix",
    excludedModKeys: empty,
    ...baseFilters,
  });
  const suff = listModRollCandidates({
    rarity: "magic",
    modType: "suffix",
    excludedModKeys: empty,
    ...baseFilters,
  });
  return [
    {
      headingKey: "previewSectionPrefix50",
      rows: mergeCraftLabPreviewRows(toRows(pref, 0.5)),
    },
    {
      headingKey: "previewSectionSuffix50",
      rows: mergeCraftLabPreviewRows(toRows(suff, 0.5)),
    },
  ];
};

const fractureOrAnnulRows = (
  item: IItemRoll,
  useRemovableOnly: boolean,
): CraftLabPreviewRowType[] => {
  const rows: CraftLabPreviewRowType[] = [];
  const n = useRemovableOnly ? countRemovableAffixes(item) : totalAffixCount(item);
  if (n === 0) {
    return [];
  }
  const p = 1 / n;
  for (const mod of item.prefixes) {
    if (useRemovableOnly && isFracturedMod(mod)) {
      continue;
    }
    const ranges = resolveStatRangesForModDefinition(mod);
    rows.push({
      modKey: mod.modKey,
      nameTemplateKey: mod.displayName,
      tier: mod.tier,
      probability: p,
      weight: 0,
      ...(ranges.length > 0 ? { statRanges: ranges } : {}),
    });
  }
  for (const mod of item.suffixes) {
    if (useRemovableOnly && isFracturedMod(mod)) {
      continue;
    }
    const ranges = resolveStatRangesForModDefinition(mod);
    rows.push({
      modKey: mod.modKey,
      nameTemplateKey: mod.displayName,
      tier: mod.tier,
      probability: p,
      weight: 0,
      ...(ranges.length > 0 ? { statRanges: ranges } : {}),
    });
  }
  return rows;
};

/**
 * 시뮬레이션 모드: 선택한 오브 패밀리에 대해, 현재 아이템 상태에서의 **모델 기준** 확률 요약.
 * (실제 게임과 다를 수 있음 — 시뮬레이터 MOD_DB·티어 사다리·ilvl 필터 기준.)
 */
export const buildCraftLabOrbPreview = (
  family: CraftingOrbFamilyIdType,
  item: IItemRoll,
  baseFilters?: IModRollBaseFiltersType,
): CraftLabOrbPreviewResultType => {
  switch (family) {
    case "orb_transmutation": {
      if (!canApplyOrbOfTransmutation(item)) {
        return { status: "unavailable" };
      }
      return {
        status: "ok",
        sections: transmutationSections(baseFilters),
      };
    }
    case "orb_augmentation": {
      if (!canApplyOrbOfAugmentation(item)) {
        return { status: "unavailable" };
      }
      return {
        status: "ok",
        sections: [
          {
            headingKey: "previewAugmentOneLine",
            rows: magicAugmentRows(item, baseFilters),
          },
        ],
      };
    }
    case "orb_regal": {
      if (!canApplyRegalOrb(item)) {
        return { status: "unavailable" };
      }
      const asRare: IItemRoll = {
        rarity: "rare",
        prefixes: [...item.prefixes],
        suffixes: [...item.suffixes],
      };
      return {
        status: "ok",
        sections: [
          {
            headingKey: "previewRegalAddRare",
            rows: rareAddOneRows(asRare, baseFilters),
          },
        ],
      };
    }
    case "orb_alchemy": {
      if (!canApplyOrbOfAlchemy(item)) {
        return { status: "unavailable" };
      }
      const empty = new Set<string>();
      const pref = listModRollCandidates({
        rarity: "rare",
        modType: "prefix",
        excludedModKeys: empty,
        ...baseFilters,
      });
      const suff = listModRollCandidates({
        rarity: "rare",
        modType: "suffix",
        excludedModKeys: empty,
        ...baseFilters,
      });
      return {
        status: "ok",
        noteKeys: ["previewAlchemyNote"],
        sections: [
          {
            headingKey: "previewAlchemyPrefixPool",
            rows: mergeCraftLabPreviewRows(toRows(pref, 1)),
          },
          {
            headingKey: "previewAlchemySuffixPool",
            rows: mergeCraftLabPreviewRows(toRows(suff, 1)),
          },
        ],
      };
    }
    case "orb_exalted": {
      if (!canApplyExaltedOrb(item)) {
        return { status: "unavailable" };
      }
      return {
        status: "ok",
        sections: [
          {
            headingKey: "previewExaltAddRare",
            rows: rareAddOneRows(item, baseFilters),
          },
        ],
      };
    }
    case "orb_fracturing": {
      if (!canApplyFracturingOrb(item)) {
        return { status: "unavailable" };
      }
      return {
        status: "ok",
        sections: [
          {
            headingKey: "previewFracturePick",
            rows: fractureOrAnnulRows(item, false),
          },
        ],
      };
    }
    case "orb_chaos": {
      if (!canApplyChaosOrb(item)) {
        return { status: "unavailable" };
      }
      return {
        status: "ok",
        sections: [
          {
            headingKey: "previewChaosRerollOneLine",
            rows: chaosRerollCombinedRows(item, baseFilters),
          },
        ],
      };
    }
    case "orb_annulment": {
      if (!canApplyOrbOfAnnulment(item)) {
        return { status: "unavailable" };
      }
      return {
        status: "ok",
        sections: [
          {
            headingKey: "previewAnnulRemove",
            rows: fractureOrAnnulRows(item, true),
          },
        ],
      };
    }
    default: {
      return { status: "unavailable" };
    }
  }
};
