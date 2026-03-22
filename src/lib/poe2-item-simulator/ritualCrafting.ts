/**
 * PoE2 의식(Ritual) 보상 등으로 얻는 징조 — 심연(Abyss) 징조와 구분.
 * @see https://www.poe2wiki.net/wiki/Ritual
 */

/** 위키·아이콘 키와 1:1. 대부분 Ritual 보상에 명시됨. */
export type CraftLabRitualOmenIdType =
  | "omen_whittling"
  | "omen_sanctification"
  | "omen_answered_prayers"
  | "omen_bartering"
  | "omen_chance"
  | "omen_corruption"
  | "omen_the_hunt"
  | "omen_the_blessed";

export const CRAFT_LAB_RITUAL_OMEN_IDS: readonly CraftLabRitualOmenIdType[] = [
  "omen_whittling",
  "omen_sanctification",
  "omen_answered_prayers",
  "omen_bartering",
  "omen_chance",
  "omen_corruption",
  "omen_the_hunt",
  "omen_the_blessed",
] as const;

export const isCraftLabRitualOmenId = (
  id: string,
): id is CraftLabRitualOmenIdType => {
  return (CRAFT_LAB_RITUAL_OMEN_IDS as readonly string[]).includes(id);
};
