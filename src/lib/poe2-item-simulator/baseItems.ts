import { BASE_ITEMS } from "./baseItemDb";
import type { IBaseItemDefinition } from "./types";

export { BASE_ITEMS };

export const getBaseItemByKey = (baseItemKey: string): IBaseItemDefinition | undefined => {
  return BASE_ITEMS.find((baseItem) => baseItem.baseItemKey === baseItemKey);
};
