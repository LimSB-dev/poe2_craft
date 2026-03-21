/**
 * PoE2 basic currency orbs (see https://www.poe2wiki.net/wiki/Crafting ).
 * Korean client names (요청 목록): 진화·확장·제왕·연금술·엑잘티드·카오스·소멸·디바인.
 *
 * Simulator limits: no flasks/charms/relics/corruption. Divine Orb is stubbed until mod numeric rolls exist.
 */
import { getRandomIntInclusive } from "./random";
import { rollRandomMod, rollRareItemRoll } from "./roller";
import type { IItemRoll, ModTypeType } from "./types";

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

const removeOneRandomAffix = (item: IItemRoll): IItemRoll => {
  const next = cloneRoll(item);
  const pCount = next.prefixes.length;
  const sCount = next.suffixes.length;
  const total = pCount + sCount;
  if (total === 0) {
    throw new Error("Cannot remove a modifier: item has no explicit modifiers.");
  }
  const pick = getRandomIntInclusive(0, total - 1);
  if (pick < pCount) {
    next.prefixes.splice(pick, 1);
  } else {
    next.suffixes.splice(pick - pCount, 1);
  }
  return next;
};

const pickRandomModTypeForMagicFill = (item: IItemRoll): ModTypeType => {
  const canPrefix = item.prefixes.length < MAGIC_MAX_PREFIX_SLOTS;
  const canSuffix = item.suffixes.length < MAGIC_MAX_SUFFIX_SLOTS;
  if (canPrefix && canSuffix) {
    return Math.random() < 0.5 ? "prefix" : "suffix";
  }
  if (canPrefix) {
    return "prefix";
  }
  if (canSuffix) {
    return "suffix";
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

const addOneRandomMod = (item: IItemRoll, rarityForRoll: "magic" | "rare"): IItemRoll => {
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
  });
  if (modType === "prefix") {
    next.prefixes.push(rolled);
  } else {
    next.suffixes.push(rolled);
  }
  return next;
};

/** 진화의 오브 — Orb of Transmutation: normal → magic with one random explicit. */
export const applyOrbOfTransmutation = (item: IItemRoll): IItemRoll => {
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
  });
  if (modType === "prefix") {
    return { rarity: "magic", prefixes: [rolled], suffixes: [] };
  }
  return { rarity: "magic", prefixes: [], suffixes: [rolled] };
};

/** 확장의 오브 — Orb of Augmentation: adds one random explicit to a magic item (up to 1 prefix + 1 suffix). */
export const applyOrbOfAugmentation = (item: IItemRoll): IItemRoll => {
  if (item.rarity !== "magic") {
    throw new Error("Orb of Augmentation can only be used on magic items.");
  }
  if (totalAffixCount(item) >= MAGIC_MAX_PREFIX_SLOTS + MAGIC_MAX_SUFFIX_SLOTS) {
    throw new Error("Orb of Augmentation: magic item already has two modifiers.");
  }
  return addOneRandomMod(item, "magic");
};

/** 제왕의 오브 — Regal Orb: magic → rare, keeps current mods, adds one random explicit. */
export const applyRegalOrb = (item: IItemRoll): IItemRoll => {
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
  return addOneRandomMod(asRare, "rare");
};

/**
 * 연금술 오브 — Orb of Alchemy: normal or magic → rare with **2 prefixes + 2 suffixes** (four random explicits).
 * Prior explicit modifiers are not kept.
 */
export const applyOrbOfAlchemy = (item: IItemRoll): IItemRoll => {
  if (item.rarity !== "normal" && item.rarity !== "magic") {
    throw new Error("Orb of Alchemy can only be used on normal or magic items.");
  }
  if (item.rarity === "normal" && totalAffixCount(item) !== 0) {
    throw new Error("Orb of Alchemy requires a normal item with no explicit modifiers.");
  }
  return rollRareItemRoll(ALCHEMY_PREFIX_COUNT, ALCHEMY_SUFFIX_COUNT);
};

/** 엑잘티드 오브 — Exalted Orb: adds one random explicit to a rare item (up to 6 total, 3/3 cap). */
export const applyExaltedOrb = (item: IItemRoll): IItemRoll => {
  if (item.rarity !== "rare") {
    throw new Error("Exalted Orb can only be used on rare items.");
  }
  if (totalAffixCount(item) >= RARE_MAX_TOTAL_AFFIXES) {
    throw new Error("Exalted Orb: rare item already has six modifiers.");
  }
  return addOneRandomMod(item, "rare");
};

/**
 * 카오스 오브 — Chaos Orb (PoE2): removes one random explicit, then adds one random explicit; rarity unchanged.
 * Usable on magic or rare (wiki).
 */
export const applyChaosOrb = (item: IItemRoll): IItemRoll => {
  if (item.rarity !== "magic" && item.rarity !== "rare") {
    throw new Error("Chaos Orb can only be used on magic or rare items.");
  }
  if (totalAffixCount(item) === 0) {
    throw new Error("Chaos Orb requires at least one explicit modifier to remove.");
  }
  const without = removeOneRandomAffix(item);
  if (without.rarity === "magic") {
    return addOneRandomMod(without, "magic");
  }
  if (totalAffixCount(without) >= RARE_MAX_TOTAL_AFFIXES) {
    throw new Error("Chaos Orb: internal state has no room for a new modifier.");
  }
  return addOneRandomMod(without, "rare");
};

/** 소멸의 오브 — Orb of Annulment: removes one random explicit (magic or rare). */
export const applyOrbOfAnnulment = (item: IItemRoll): IItemRoll => {
  if (item.rarity !== "magic" && item.rarity !== "rare") {
    throw new Error("Orb of Annulment can only be used on magic or rare items.");
  }
  if (totalAffixCount(item) === 0) {
    throw new Error("Orb of Annulment requires at least one explicit modifier.");
  }
  const next = removeOneRandomAffix(item);
  if (totalAffixCount(next) === 0) {
    return { rarity: "normal", prefixes: [], suffixes: [] };
  }
  return next;
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
