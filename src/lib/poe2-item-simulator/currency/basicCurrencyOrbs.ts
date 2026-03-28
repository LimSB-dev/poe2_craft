/**
 * PoE2 basic currency orbs (see https://www.poe2wiki.net/wiki/Crafting ).
 * Korean client names (요청 목록): 진화·확장·제왕·연금술·엑잘티드·분열·카오스·소멸·디바인.
 *
 * Simulator limits: no flasks/charms/relics/corruption. Divine Orb is stubbed until mod numeric rolls exist.
 */
import {
  assertRollNotCorruptedForStandardCrafting,
  isCorruptedRoll,
} from "../itemCorruptionCraftingGuard";
import { getRandomIntInclusive } from "../random";
import {
  listModRollCandidates,
  rollRandomMod,
  rollRareItemRoll,
  type IModRollBaseFiltersType,
} from "../roller";

const MAGIC_MAX_PREFIX_SLOTS: number = 1;
const MAGIC_MAX_SUFFIX_SLOTS: number = 1;
const RARE_MAX_PREFIX_SLOTS: number = 3;
const RARE_MAX_SUFFIX_SLOTS: number = 3;
const RARE_MAX_TOTAL_AFFIXES: number = 6;

const ALCHEMY_PREFIX_COUNT: number = 2;
const ALCHEMY_SUFFIX_COUNT: number = 2;

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

const isDesecratedMod = (mod: IModDefinition): boolean => {
  return mod.isDesecrated === true;
};

const hasFracturedMod = (item: IItemRoll): boolean => {
  return [...item.prefixes, ...item.suffixes].some(isFracturedMod);
};

/**
 * PoE2 규칙: 아이템에 **훼손(분열) 옵션은 최대 1개**.
 * 비정상 상태(복수 isFractured)가 들어오면 접두 순·접미 순으로 첫 줄만 유지한다.
 */
export const enforceAtMostOneFracturedMod = (item: IItemRoll): IItemRoll => {
  let fractureKept = false;
  const mapMod = (mod: IModDefinition): IModDefinition => {
    if (mod.isFractured !== true) {
      return mod;
    }
    if (!fractureKept) {
      fractureKept = true;
      return mod;
    }
    const withoutFracture: IModDefinition = { ...mod };
    delete withoutFracture.isFractured;
    return withoutFracture;
  };
  const base: IItemRoll = {
    rarity: item.rarity,
    prefixes: item.prefixes.map(mapMod),
    suffixes: item.suffixes.map(mapMod),
  };
  if (item.hinekoraLockActive === true) {
    base.hinekoraLockActive = true;
  }
  if (item.isCorrupted === true) {
    base.isCorrupted = true;
  }
  return base;
};

const countRemovableAffixes = (item: IItemRoll): number => {
  return [...item.prefixes, ...item.suffixes].filter((m) => {
    return !isFracturedMod(m);
  }).length;
};

/**
 * Orb of Transmutation — applicability.
 *
 * - `rarity === "normal"`.
 * - No explicit modifiers (prefix + suffix count === 0).
 * - Not corrupted (`isCorrupted` unset/false); matches simulator rule for standard currency.
 */
export const canApplyOrbOfTransmutation = (item: IItemRoll): boolean => {
  if (isCorruptedRoll(item)) {
    return false;
  }
  return item.rarity === "normal" && totalAffixCount(item) === 0;
};

/**
 * Orb of Augmentation — applicability.
 *
 * - `rarity === "magic"`.
 * - Fewer than two explicit mods (magic cap: 1 prefix + 1 suffix in this sim).
 * - Not corrupted.
 */
export const canApplyOrbOfAugmentation = (item: IItemRoll): boolean => {
  if (isCorruptedRoll(item)) {
    return false;
  }
  return (
    item.rarity === "magic" &&
    totalAffixCount(item) < MAGIC_MAX_PREFIX_SLOTS + MAGIC_MAX_SUFFIX_SLOTS
  );
};

/**
 * Regal Orb — applicability.
 *
 * - `rarity === "magic"`.
 * - At least one explicit mod (Regal needs something to “carry” into rare).
 * - After promoting to rare mentally, total affixes must stay below 6 (room for the extra roll).
 * - Not corrupted.
 */
export const canApplyRegalOrb = (item: IItemRoll): boolean => {
  if (isCorruptedRoll(item)) {
    return false;
  }
  if (item.rarity !== "magic" || totalAffixCount(item) === 0) {
    return false;
  }
  const asRare: IItemRoll = {
    rarity: "rare",
    prefixes: [...item.prefixes],
    suffixes: [...item.suffixes],
  };
  if (totalAffixCount(asRare) >= RARE_MAX_TOTAL_AFFIXES) {
    return false;
  }
  return true;
};

/**
 * Orb of Alchemy — applicability.
 *
 * - Either: normal with **no** explicit mods, or any magic item (existing mods discarded on use).
 * - Not rare / not corrupted.
 */
export const canApplyOrbOfAlchemy = (item: IItemRoll): boolean => {
  if (isCorruptedRoll(item)) {
    return false;
  }
  if (item.rarity === "normal") {
    return totalAffixCount(item) === 0;
  }
  if (item.rarity === "magic") {
    return true;
  }
  return false;
};

/**
 * Exalted Orb — applicability.
 *
 * - `rarity === "rare"`.
 * - Total explicit affixes &lt; 6 (3 prefix / 3 suffix caps enforced when adding).
 * - Not corrupted.
 */
export const canApplyExaltedOrb = (item: IItemRoll): boolean => {
  if (isCorruptedRoll(item)) {
    return false;
  }
  return item.rarity === "rare" && totalAffixCount(item) < RARE_MAX_TOTAL_AFFIXES;
};

/**
 * Chaos Orb (PoE2-style in this sim) — applicability.
 *
 * - `rarity === "rare"`.
 * - At least one explicit mod.
 * - At least one **non-fractured** mod (fractured mods cannot be removed, so chaos would stall).
 * - Not corrupted.
 */
export const canApplyChaosOrb = (item: IItemRoll): boolean => {
  if (isCorruptedRoll(item)) {
    return false;
  }
  return (
    item.rarity === "rare" &&
    totalAffixCount(item) > 0 &&
    countRemovableAffixes(item) > 0
  );
};

/**
 * Fracturing Orb — applicability.
 *
 * - `rarity === "rare"`.
 * - At least four explicit mods.
 * - No mod already marked `isFractured` (at most one fracture in this sim).
 * - Not corrupted.
 */
export const canApplyFracturingOrb = (item: IItemRoll): boolean => {
  if (isCorruptedRoll(item)) {
    return false;
  }
  if (item.rarity !== "rare") {
    return false;
  }
  if (hasFracturedMod(item)) {
    return false;
  }
  return totalAffixCount(item) >= 4;
};

/**
 * Orb of Annulment — applicability.
 *
 * - `rarity` is magic or rare.
 * - At least one removable explicit (non-fractured) mod.
 * - Not corrupted.
 */
export const canApplyOrbOfAnnulment = (item: IItemRoll): boolean => {
  if (isCorruptedRoll(item)) {
    return false;
  }
  if (item.rarity !== "magic" && item.rarity !== "rare") {
    return false;
  }
  return countRemovableAffixes(item) > 0;
};

/**
 * Omen of Light — annul **desecrated** lines only — applicability.
 *
 * - `rarity` is magic or rare.
 * - At least one explicit that is `isDesecrated` and not fractured (fractured still protected).
 * - **Allowed on corrupted items** (Putrefaction / abyss paths); do not gate on `isCorrupted`.
 */
export const canApplyOrbOfAnnulmentDesecratedOnly = (item: IItemRoll): boolean => {
  if (item.rarity !== "magic" && item.rarity !== "rare") {
    return false;
  }
  return [...item.prefixes, ...item.suffixes].some((m) => {
    return !isFracturedMod(m) && isDesecratedMod(m);
  });
};

const removeOneRandomAffix = (item: IItemRoll): IItemRoll => {
  const next = cloneRoll(item);
  const removablePrefixIndices: number[] = [];
  next.prefixes.forEach((mod, index) => {
    if (!isFracturedMod(mod)) {
      removablePrefixIndices.push(index);
    }
  });
  const removableSuffixIndices: number[] = [];
  next.suffixes.forEach((mod, index) => {
    if (!isFracturedMod(mod)) {
      removableSuffixIndices.push(index);
    }
  });
  const totalRemovable = removablePrefixIndices.length + removableSuffixIndices.length;
  if (totalRemovable === 0) {
    throw new Error(
      "Cannot remove a modifier: no removable modifiers (fractured mods cannot be removed).",
    );
  }
  const pick = getRandomIntInclusive(0, totalRemovable - 1);
  if (pick < removablePrefixIndices.length) {
    const idx = removablePrefixIndices[pick];
    if (idx === undefined) {
      throw new Error("Internal error: removable prefix index missing.");
    }
    next.prefixes.splice(idx, 1);
  } else {
    const idx = removableSuffixIndices[pick - removablePrefixIndices.length];
    if (idx === undefined) {
      throw new Error("Internal error: removable suffix index missing.");
    }
    next.suffixes.splice(idx, 1);
  }
  return next;
};

const removeOneRandomDesecratedAffix = (item: IItemRoll): IItemRoll => {
  const next = cloneRoll(item);
  const removablePrefixIndices: number[] = [];
  next.prefixes.forEach((mod, index) => {
    if (!isFracturedMod(mod) && isDesecratedMod(mod)) {
      removablePrefixIndices.push(index);
    }
  });
  const removableSuffixIndices: number[] = [];
  next.suffixes.forEach((mod, index) => {
    if (!isFracturedMod(mod) && isDesecratedMod(mod)) {
      removableSuffixIndices.push(index);
    }
  });
  const totalRemovable = removablePrefixIndices.length + removableSuffixIndices.length;
  if (totalRemovable === 0) {
    throw new Error(
      "Cannot remove a modifier: no removable desecrated modifiers (fractured mods cannot be removed).",
    );
  }
  const pick = getRandomIntInclusive(0, totalRemovable - 1);
  if (pick < removablePrefixIndices.length) {
    const idx = removablePrefixIndices[pick];
    if (idx === undefined) {
      throw new Error("Internal error: removable desecrated prefix index missing.");
    }
    next.prefixes.splice(idx, 1);
  } else {
    const idx = removableSuffixIndices[pick - removablePrefixIndices.length];
    if (idx === undefined) {
      throw new Error("Internal error: removable desecrated suffix index missing.");
    }
    next.suffixes.splice(idx, 1);
  }
  return next;
};

const pickRandomModTypeForMagicFill = (item: IItemRoll): ModTypeType => {
  const pLen = item.prefixes.length;
  const sLen = item.suffixes.length;
  if (pLen >= MAGIC_MAX_PREFIX_SLOTS && sLen >= MAGIC_MAX_SUFFIX_SLOTS) {
    throw new Error("Magic item already has the maximum number of modifiers.");
  }
  // 확장의 오브: 한 줄만 있으면 반대쪽(접두↔접미)에만 추가.
  if (pLen > 0 && sLen === 0) {
    return "suffix";
  }
  if (sLen > 0 && pLen === 0) {
    return "prefix";
  }
  if (pLen === 0 && sLen === 0) {
    return Math.random() < 0.5 ? "prefix" : "suffix";
  }
  throw new Error("Magic item already has the maximum number of modifiers.");
};

const pickRandomModTypeForRareFill = (item: IItemRoll): ModTypeType => {
  const canPrefix = item.prefixes.length < RARE_MAX_PREFIX_SLOTS;
  const canSuffix = item.suffixes.length < RARE_MAX_SUFFIX_SLOTS;
  if (canPrefix && canSuffix) {
    return Math.random() < 0.5 ? "prefix" : "suffix";
  }
  if (canPrefix) {
    return "prefix";
  }
  if (canSuffix) {
    return "suffix";
  }
  throw new Error("Rare item already has the maximum number of modifiers.");
};

/**
 * When the preferred prefix/suffix pool is empty (incomplete MOD_DB for a base), use the other
 * side if it has room and non-empty candidates so Transmutation/Augmentation/Exalt do not hard-fail.
 */
const resolveModTypeWithNonEmptyPool = (
  preferred: ModTypeType,
  item: IItemRoll,
  rarityForRoll: "magic" | "rare",
  excludedModKeys: ReadonlySet<string>,
  baseFilters?: IModRollBaseFiltersType,
): ModTypeType => {
  const rollCtx = (modType: ModTypeType) => {
    return {
      rarity: rarityForRoll,
      modType,
      excludedModKeys,
      ...baseFilters,
    };
  };
  if (listModRollCandidates(rollCtx(preferred)).length > 0) {
    return preferred;
  }
  const other: ModTypeType = preferred === "prefix" ? "suffix" : "prefix";
  const canUseOther =
    rarityForRoll === "magic"
      ? other === "prefix"
        ? item.prefixes.length < MAGIC_MAX_PREFIX_SLOTS
        : item.suffixes.length < MAGIC_MAX_SUFFIX_SLOTS
      : other === "prefix"
        ? item.prefixes.length < RARE_MAX_PREFIX_SLOTS
        : item.suffixes.length < RARE_MAX_SUFFIX_SLOTS;
  if (canUseOther && listModRollCandidates(rollCtx(other)).length > 0) {
    return other;
  }
  return preferred;
};

const addOneRandomMod = (
  item: IItemRoll,
  rarityForRoll: "magic" | "rare",
  baseFilters?: IModRollBaseFiltersType,
): IItemRoll => {
  const next = cloneRoll(item);
  const preferredModType =
    rarityForRoll === "magic" ? pickRandomModTypeForMagicFill(next) : pickRandomModTypeForRareFill(next);
  const excludedModKeys = new Set<string>([
    ...next.prefixes.map((m) => m.modKey),
    ...next.suffixes.map((m) => m.modKey),
  ]);
  const modType = resolveModTypeWithNonEmptyPool(
    preferredModType,
    next,
    rarityForRoll,
    excludedModKeys,
    baseFilters,
  );
  const rolled = rollRandomMod({
    rarity: rarityForRoll,
    modType,
    excludedModKeys,
    ...baseFilters,
  });
  if (modType === "prefix") {
    next.prefixes.push(rolled);
  } else {
    next.suffixes.push(rolled);
  }
  return next;
};

/** 진화의 오브 — Orb of Transmutation: normal → magic with one random explicit. */
export const applyOrbOfTransmutation = (
  item: IItemRoll,
  baseFilters?: IModRollBaseFiltersType,
): IItemRoll => {
  assertRollNotCorruptedForStandardCrafting(item);
  if (item.rarity !== "normal") {
    throw new Error("Orb of Transmutation can only be used on normal items.");
  }
  if (totalAffixCount(item) !== 0) {
    throw new Error("Orb of Transmutation requires a normal item with no explicit modifiers.");
  }
  const emptyExcluded = new Set<string>();
  const prefixCount = listModRollCandidates({
    rarity: "magic",
    modType: "prefix",
    excludedModKeys: emptyExcluded,
    ...baseFilters,
  }).length;
  const suffixCount = listModRollCandidates({
    rarity: "magic",
    modType: "suffix",
    excludedModKeys: emptyExcluded,
    ...baseFilters,
  }).length;
  if (prefixCount === 0 && suffixCount === 0) {
    const sub = baseFilters?.baseItemSubType;
    throw new Error(
      sub !== undefined
        ? `No modifier candidates for this base (subType=${sub}). The simulator MOD_DB may not cover this equipment type yet.`
        : "No modifier candidates for this roll (empty prefix and suffix pools).",
    );
  }
  let modType: ModTypeType;
  if (prefixCount === 0) {
    modType = "suffix";
  } else if (suffixCount === 0) {
    modType = "prefix";
  } else {
    modType = Math.random() < 0.5 ? "prefix" : "suffix";
  }
  const rolled = rollRandomMod({
    rarity: "magic",
    modType,
    excludedModKeys: emptyExcluded,
    ...baseFilters,
  });
  if (modType === "prefix") {
    return { rarity: "magic", prefixes: [rolled], suffixes: [] };
  }
  return { rarity: "magic", prefixes: [], suffixes: [rolled] };
};

/** 확장의 오브 — Orb of Augmentation: adds one random explicit to a magic item (up to 1 prefix + 1 suffix). */
export const applyOrbOfAugmentation = (
  item: IItemRoll,
  baseFilters?: IModRollBaseFiltersType,
): IItemRoll => {
  assertRollNotCorruptedForStandardCrafting(item);
  if (item.rarity !== "magic") {
    throw new Error("Orb of Augmentation can only be used on magic items.");
  }
  if (totalAffixCount(item) >= MAGIC_MAX_PREFIX_SLOTS + MAGIC_MAX_SUFFIX_SLOTS) {
    throw new Error("Orb of Augmentation: magic item already has two modifiers.");
  }
  return addOneRandomMod(item, "magic", baseFilters);
};

/** 제왕의 오브 — Regal Orb: magic → rare, keeps current mods, adds one random explicit. */
export const applyRegalOrb = (item: IItemRoll, baseFilters?: IModRollBaseFiltersType): IItemRoll => {
  assertRollNotCorruptedForStandardCrafting(item);
  if (item.rarity !== "magic") {
    throw new Error("Regal Orb can only be used on magic items.");
  }
  if (totalAffixCount(item) === 0) {
    throw new Error("Regal Orb requires a magic item with at least one modifier.");
  }
  const asRare: IItemRoll = {
    rarity: "rare",
    prefixes: [...item.prefixes],
    suffixes: [...item.suffixes],
  };
  if (totalAffixCount(asRare) >= RARE_MAX_TOTAL_AFFIXES) {
    throw new Error("Regal Orb: cannot add a modifier (already at rare cap).");
  }
  return addOneRandomMod(asRare, "rare", baseFilters);
};

/**
 * 연금술 오브 — Orb of Alchemy: normal or magic → rare with **2 prefixes + 2 suffixes** (four random explicits).
 * Prior explicit modifiers are not kept.
 */
export const applyOrbOfAlchemy = (
  item: IItemRoll,
  baseFilters?: IModRollBaseFiltersType,
): IItemRoll => {
  assertRollNotCorruptedForStandardCrafting(item);
  if (item.rarity !== "normal" && item.rarity !== "magic") {
    throw new Error("Orb of Alchemy can only be used on normal or magic items.");
  }
  if (item.rarity === "normal" && totalAffixCount(item) !== 0) {
    throw new Error("Orb of Alchemy requires a normal item with no explicit modifiers.");
  }
  return rollRareItemRoll(ALCHEMY_PREFIX_COUNT, ALCHEMY_SUFFIX_COUNT, baseFilters);
};

/** 엑잘티드 오브 — Exalted Orb: adds one random explicit to a rare item (up to 6 total, 3/3 cap). */
export const applyExaltedOrb = (item: IItemRoll, baseFilters?: IModRollBaseFiltersType): IItemRoll => {
  assertRollNotCorruptedForStandardCrafting(item);
  if (item.rarity !== "rare") {
    throw new Error("Exalted Orb can only be used on rare items.");
  }
  if (totalAffixCount(item) >= RARE_MAX_TOTAL_AFFIXES) {
    throw new Error("Exalted Orb: rare item already has six modifiers.");
  }
  return addOneRandomMod(item, "rare", baseFilters);
};

/**
 * 분열의 오브 — Fracturing Orb: 레어에 옵션 4개 이상일 때 무작위 옵션 하나를 분열(고정)시킴. 이미 분열된 아이템에는 사용 불가.
 */
export const applyFracturingOrb = (item: IItemRoll): IItemRoll => {
  assertRollNotCorruptedForStandardCrafting(item);
  const normalized = enforceAtMostOneFracturedMod(item);
  if (!canApplyFracturingOrb(normalized)) {
    throw new Error(
      "Fracturing Orb can only be used on a rare item with at least four modifiers that is not already fractured.",
    );
  }
  const next = cloneRoll(normalized);
  const pCount = next.prefixes.length;
  const sCount = next.suffixes.length;
  const total = pCount + sCount;
  const pick = getRandomIntInclusive(0, total - 1);
  if (pick < pCount) {
    const mod = next.prefixes[pick];
    if (mod === undefined) {
      throw new Error("Fracturing Orb: prefix index out of range.");
    }
    next.prefixes[pick] = { ...mod, isFractured: true };
  } else {
    const sIdx = pick - pCount;
    const mod = next.suffixes[sIdx];
    if (mod === undefined) {
      throw new Error("Fracturing Orb: suffix index out of range.");
    }
    next.suffixes[sIdx] = { ...mod, isFractured: true };
  }
  return enforceAtMostOneFracturedMod(next);
};

/**
 * 카오스 오브 — Chaos Orb (PoE2): 레어 전용. 무작위 명시 옵션 하나 제거 후 하나 추가, 희귀도 유지.
 */
export const applyChaosOrb = (item: IItemRoll, baseFilters?: IModRollBaseFiltersType): IItemRoll => {
  assertRollNotCorruptedForStandardCrafting(item);
  if (item.rarity !== "rare") {
    throw new Error("Chaos Orb can only be used on rare items.");
  }
  if (totalAffixCount(item) === 0) {
    throw new Error("Chaos Orb requires at least one explicit modifier to remove.");
  }
  const without = removeOneRandomAffix(item);
  if (totalAffixCount(without) >= RARE_MAX_TOTAL_AFFIXES) {
    throw new Error("Chaos Orb: internal state has no room for a new modifier.");
  }
  return addOneRandomMod(without, "rare", baseFilters);
};

/**
 * 절사의 징조(Omen of Whittling) — 카오스: **가장 높은 tier 숫자(가장 약한 롤)** 옵션을 제거한 뒤 1줄 추가.
 * 게임은 아이템 레벨 요구가 가장 낮은 옵션 — 시뮬에서는 `tier` 최댓값으로 근사.
 */
const removeWeakestAffixByTier = (item: IItemRoll): IItemRoll => {
  const next = cloneRoll(item);
  type CandidateType = {
    kind: "prefix" | "suffix";
    index: number;
    tier: number;
  };
  const candidates: CandidateType[] = [];
  next.prefixes.forEach((mod, index) => {
    if (!isFracturedMod(mod)) {
      candidates.push({
        kind: "prefix",
        index,
        tier: mod.tier,
      });
    }
  });
  next.suffixes.forEach((mod, index) => {
    if (!isFracturedMod(mod)) {
      candidates.push({
        kind: "suffix",
        index,
        tier: mod.tier,
      });
    }
  });
  if (candidates.length === 0) {
    throw new Error(
      "Cannot remove a modifier: no removable modifiers (fractured mods cannot be removed).",
    );
  }
  const maxTier = Math.max(
    ...candidates.map((c) => {
      return c.tier;
    }),
  );
  const weakest = candidates.filter((c) => {
    return c.tier === maxTier;
  });
  const pick = weakest[getRandomIntInclusive(0, weakest.length - 1)];
  if (pick === undefined) {
    throw new Error("Internal error: Whittling pick missing.");
  }
  if (pick.kind === "prefix") {
    next.prefixes.splice(pick.index, 1);
  } else {
    next.suffixes.splice(pick.index, 1);
  }
  return next;
};

export const applyChaosOrbWithWhittling = (
  item: IItemRoll,
  baseFilters?: IModRollBaseFiltersType,
): IItemRoll => {
  assertRollNotCorruptedForStandardCrafting(item);
  if (item.rarity !== "rare") {
    throw new Error("Chaos Orb can only be used on rare items.");
  }
  if (totalAffixCount(item) === 0) {
    throw new Error("Chaos Orb requires at least one explicit modifier to remove.");
  }
  const without = removeWeakestAffixByTier(item);
  if (totalAffixCount(without) >= RARE_MAX_TOTAL_AFFIXES) {
    throw new Error("Chaos Orb: internal state has no room for a new modifier.");
  }
  return addOneRandomMod(without, "rare", baseFilters);
};

/** 소멸의 오브 — Orb of Annulment: 무작위 명시 하나 제거. 일반/매직/레어 등급은 유지(옵션 0개여도). */
export const applyOrbOfAnnulment = (item: IItemRoll): IItemRoll => {
  assertRollNotCorruptedForStandardCrafting(item);
  if (item.rarity !== "magic" && item.rarity !== "rare") {
    throw new Error("Orb of Annulment can only be used on magic or rare items.");
  }
  if (totalAffixCount(item) === 0) {
    throw new Error("Orb of Annulment requires at least one explicit modifier.");
  }
  return removeOneRandomAffix(item);
};

/**
 * 징조: 빛 — 타락(Desecrated) 옵션만 무작위 제거.
 */
export const applyOrbOfAnnulmentDesecratedOnly = (item: IItemRoll): IItemRoll => {
  if (item.rarity !== "magic" && item.rarity !== "rare") {
    throw new Error("Orb of Annulment can only be used on magic or rare items.");
  }
  if (!canApplyOrbOfAnnulmentDesecratedOnly(item)) {
    throw new Error("Orb of Annulment: no removable desecrated modifiers.");
  }
  return removeOneRandomDesecratedAffix(item);
};

/**
 * 디바인 오브 — Divine Orb: in-game, randomises numeric values of implicits and explicits.
 * This app does not model numeric rolls on mods, so behaviour is **not implemented** yet (do not wire into UI).
 */
export const applyDivineOrb = (item: IItemRoll): IItemRoll => {
  void item;
  throw new Error(
    "Divine Orb is not implemented: modifiers have no numeric roll data in this simulator."
  );
};
