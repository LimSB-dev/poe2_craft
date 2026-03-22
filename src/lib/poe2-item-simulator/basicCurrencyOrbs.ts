/**
 * PoE2 basic currency orbs (see https://www.poe2wiki.net/wiki/Crafting ).
 * Korean client names (요청 목록): 진화·확장·제왕·연금술·엑잘티드·분열·카오스·소멸·디바인.
 *
 * Simulator limits: no flasks/charms/relics/corruption. Divine Orb is stubbed until mod numeric rolls exist.
 */
import { getRandomIntInclusive } from "./random";
import { rollRandomMod, rollRareItemRoll, type IModRollBaseFiltersType } from "./roller";
import type { IItemRoll, IModDefinition, ModTypeType } from "./types";

const MAGIC_MAX_PREFIX_SLOTS: number = 1;
const MAGIC_MAX_SUFFIX_SLOTS: number = 1;
const RARE_MAX_PREFIX_SLOTS: number = 3;
const RARE_MAX_SUFFIX_SLOTS: number = 3;
const RARE_MAX_TOTAL_AFFIXES: number = 6;

const ALCHEMY_PREFIX_COUNT: number = 2;
const ALCHEMY_SUFFIX_COUNT: number = 2;

const cloneRoll = (item: IItemRoll): IItemRoll => ({
  rarity: item.rarity,
  prefixes: [...item.prefixes],
  suffixes: [...item.suffixes],
});

const totalAffixCount = (item: IItemRoll): number => {
  return item.prefixes.length + item.suffixes.length;
};

const isFracturedMod = (mod: IModDefinition): boolean => {
  return mod.isFractured === true;
};

const hasFracturedMod = (item: IItemRoll): boolean => {
  return [...item.prefixes, ...item.suffixes].some(isFracturedMod);
};

const countRemovableAffixes = (item: IItemRoll): number => {
  return [...item.prefixes, ...item.suffixes].filter((m) => {
    return !isFracturedMod(m);
  }).length;
};

/** `applyOrbOfTransmutation`이 예외 없이 적용 가능한지(노말·명시 옵션 없음). */
export const canApplyOrbOfTransmutation = (item: IItemRoll): boolean => {
  return item.rarity === "normal" && totalAffixCount(item) === 0;
};

/** `applyOrbOfAugmentation` 적용 가능 여부(매직·슬롯 여유). */
export const canApplyOrbOfAugmentation = (item: IItemRoll): boolean => {
  return (
    item.rarity === "magic" &&
    totalAffixCount(item) < MAGIC_MAX_PREFIX_SLOTS + MAGIC_MAX_SUFFIX_SLOTS
  );
};

/** `applyRegalOrb` 적용 가능 여부. */
export const canApplyRegalOrb = (item: IItemRoll): boolean => {
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

/** `applyOrbOfAlchemy` 적용 가능 여부(노말 빈 아이템 또는 매직). */
export const canApplyOrbOfAlchemy = (item: IItemRoll): boolean => {
  if (item.rarity === "normal") {
    return totalAffixCount(item) === 0;
  }
  if (item.rarity === "magic") {
    return true;
  }
  return false;
};

/** `applyExaltedOrb` 적용 가능 여부. */
export const canApplyExaltedOrb = (item: IItemRoll): boolean => {
  return item.rarity === "rare" && totalAffixCount(item) < RARE_MAX_TOTAL_AFFIXES;
};

/** `applyChaosOrb` 적용 가능 여부 (레어만, PoE2). 분열 옵션만 있으면 제거할 수 없음. */
export const canApplyChaosOrb = (item: IItemRoll): boolean => {
  return (
    item.rarity === "rare" &&
    totalAffixCount(item) > 0 &&
    countRemovableAffixes(item) > 0
  );
};

/** 분열의 오브(Fracturing Orb): 레어·옵션 4개 이상·아직 분열 없음. */
export const canApplyFracturingOrb = (item: IItemRoll): boolean => {
  if (item.rarity !== "rare") {
    return false;
  }
  if (hasFracturedMod(item)) {
    return false;
  }
  return totalAffixCount(item) >= 4;
};

/** `applyOrbOfAnnulment` 적용 가능 여부. 분열 옵션은 제거 대상에서 제외. */
export const canApplyOrbOfAnnulment = (item: IItemRoll): boolean => {
  if (item.rarity !== "magic" && item.rarity !== "rare") {
    return false;
  }
  return countRemovableAffixes(item) > 0;
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

const addOneRandomMod = (
  item: IItemRoll,
  rarityForRoll: "magic" | "rare",
  baseFilters?: IModRollBaseFiltersType,
): IItemRoll => {
  const next = cloneRoll(item);
  const modType =
    rarityForRoll === "magic" ? pickRandomModTypeForMagicFill(next) : pickRandomModTypeForRareFill(next);
  const excludedModKeys = new Set<string>([
    ...next.prefixes.map((m) => m.modKey),
    ...next.suffixes.map((m) => m.modKey),
  ]);
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
  if (item.rarity !== "normal") {
    throw new Error("Orb of Transmutation can only be used on normal items.");
  }
  if (totalAffixCount(item) !== 0) {
    throw new Error("Orb of Transmutation requires a normal item with no explicit modifiers.");
  }
  const modType: ModTypeType = Math.random() < 0.5 ? "prefix" : "suffix";
  const rolled = rollRandomMod({
    rarity: "magic",
    modType,
    excludedModKeys: new Set(),
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
  if (!canApplyFracturingOrb(item)) {
    throw new Error(
      "Fracturing Orb can only be used on a rare item with at least four modifiers that is not already fractured.",
    );
  }
  const next = cloneRoll(item);
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
  return next;
};

/**
 * 카오스 오브 — Chaos Orb (PoE2): 레어 전용. 무작위 명시 옵션 하나 제거 후 하나 추가, 희귀도 유지.
 */
export const applyChaosOrb = (item: IItemRoll, baseFilters?: IModRollBaseFiltersType): IItemRoll => {
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

/** 소멸의 오브 — Orb of Annulment: 무작위 명시 하나 제거. 일반/매직/레어 등급은 유지(옵션 0개여도). */
export const applyOrbOfAnnulment = (item: IItemRoll): IItemRoll => {
  if (item.rarity !== "magic" && item.rarity !== "rare") {
    throw new Error("Orb of Annulment can only be used on magic or rare items.");
  }
  if (totalAffixCount(item) === 0) {
    throw new Error("Orb of Annulment requires at least one explicit modifier.");
  }
  return removeOneRandomAffix(item);
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
