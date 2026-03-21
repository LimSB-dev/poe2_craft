import type { IBaseItemDefinition } from "./types";

export const BASE_ITEMS: ReadonlyArray<IBaseItemDefinition> = [
  { baseItemKey: "base_iron_ring", displayName: "Iron Ring", itemClass: "Ring" },
  { baseItemKey: "base_jade_amulet", displayName: "Jade Amulet", itemClass: "Amulet" },
  { baseItemKey: "base_leather_belt", displayName: "Leather Belt", itemClass: "Belt" },
  { baseItemKey: "base_grinning_fangs", displayName: "Grinning Fangs", itemClass: "Claw" },
  { baseItemKey: "base_maple_round_shield", displayName: "Maple Round Shield", itemClass: "Shield" },
  { baseItemKey: "base_silk_robe", displayName: "Silk Robe", itemClass: "Body Armour" },
];

export const getBaseItemByKey = (baseItemKey: string): IBaseItemDefinition | undefined => {
  return BASE_ITEMS.find((baseItem) => baseItem.baseItemKey === baseItemKey);
};
