import { BASE_ITEMS } from "@/lib/poe2-item-simulator/baseItemDb";

export { BASE_ITEMS };

export const getBaseItemByKey = (baseItemKey: string): IBaseItemDefinition | undefined => {
  return BASE_ITEMS.find((baseItem) => baseItem.baseItemKey === baseItemKey);
};
