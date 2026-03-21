import type { IBaseItemDefinition } from "./types";

export const BASE_ITEMS: ReadonlyArray<IBaseItemDefinition> = [
  {
    baseItemKey: "base_iron_ring",
    displayName: "Iron Ring",
    itemClass: "Ring",
    itemClassKey: "ring",
  },
  {
    baseItemKey: "base_jade_amulet",
    displayName: "Jade Amulet",
    itemClass: "Amulet",
    itemClassKey: "amulet",
  },
  {
    baseItemKey: "base_leather_belt",
    displayName: "Leather Belt",
    itemClass: "Belt",
    itemClassKey: "belt",
  },
  {
    baseItemKey: "base_grinning_fangs",
    displayName: "Grinning Fangs",
    itemClass: "Claw",
    itemClassKey: "claw",
  },
  {
    baseItemKey: "base_maple_round_shield",
    displayName: "Maple Round Shield",
    itemClass: "Shield",
    itemClassKey: "shield",
  },
  {
    baseItemKey: "base_silk_robe",
    displayName: "Silk Robe",
    itemClass: "Body Armour",
    itemClassKey: "bodyArmour",
  },
];

export const getBaseItemByKey = (baseItemKey: string): IBaseItemDefinition | undefined => {
  return BASE_ITEMS.find((baseItem) => baseItem.baseItemKey === baseItemKey);
};
