/**
 * Path of Exile 2 Wiki (poe2wiki.net) inventory icon PNGs — educational / tool reference.
 * Copyright: Grinding Gear Games (see wiki file pages).
 */

export const CRAFTING_LAB_CURRENCY_ICON_URLS = {
  orb_transmutation:
    "https://www.poe2wiki.net/images/6/67/Orb_of_Transmutation_inventory_icon.png",
  /** 티어별 아이콘이 위키에 분리되어 있으면 교체. 현재는 동일 아이콘. */
  orb_transmutation_t1:
    "https://www.poe2wiki.net/images/6/67/Orb_of_Transmutation_inventory_icon.png",
  orb_transmutation_t2:
    "https://www.poe2wiki.net/images/6/67/Orb_of_Transmutation_inventory_icon.png",
  orb_transmutation_t3:
    "https://www.poe2wiki.net/images/6/67/Orb_of_Transmutation_inventory_icon.png",
  orb_augmentation:
    "https://www.poe2wiki.net/images/c/cb/Orb_of_Augmentation_inventory_icon.png",
  orb_augmentation_t1:
    "https://www.poe2wiki.net/images/c/cb/Orb_of_Augmentation_inventory_icon.png",
  orb_augmentation_t2:
    "https://www.poe2wiki.net/images/c/cb/Orb_of_Augmentation_inventory_icon.png",
  orb_augmentation_t3:
    "https://www.poe2wiki.net/images/c/cb/Orb_of_Augmentation_inventory_icon.png",
  orb_regal: "https://www.poe2wiki.net/images/3/33/Regal_Orb_inventory_icon.png",
  orb_alchemy:
    "https://www.poe2wiki.net/images/9/9f/Orb_of_Alchemy_inventory_icon.png",
  orb_alchemy_t1:
    "https://www.poe2wiki.net/images/9/9f/Orb_of_Alchemy_inventory_icon.png",
  orb_alchemy_t2:
    "https://www.poe2wiki.net/images/9/9f/Orb_of_Alchemy_inventory_icon.png",
  orb_alchemy_t3:
    "https://www.poe2wiki.net/images/9/9f/Orb_of_Alchemy_inventory_icon.png",
  orb_exalted:
    "https://www.poe2wiki.net/images/2/26/Exalted_Orb_inventory_icon.png",
  orb_exalted_t1:
    "https://www.poe2wiki.net/images/2/26/Exalted_Orb_inventory_icon.png",
  orb_exalted_t2:
    "https://www.poe2wiki.net/images/2/26/Exalted_Orb_inventory_icon.png",
  orb_exalted_t3:
    "https://www.poe2wiki.net/images/2/26/Exalted_Orb_inventory_icon.png",
  orb_fracturing:
    "https://www.poe2wiki.net/images/7/70/Fracturing_Orb_inventory_icon.png",
  orb_chaos: "https://www.poe2wiki.net/images/9/9c/Chaos_Orb_inventory_icon.png",
  orb_chaos_t1:
    "https://www.poe2wiki.net/images/9/9c/Chaos_Orb_inventory_icon.png",
  orb_chaos_t2:
    "https://www.poe2wiki.net/images/9/9c/Chaos_Orb_inventory_icon.png",
  orb_chaos_t3:
    "https://www.poe2wiki.net/images/9/9c/Chaos_Orb_inventory_icon.png",
  orb_annulment:
    "https://www.poe2wiki.net/images/4/4c/Orb_of_Annulment_inventory_icon.png",
  /** LIFE_ESSENCE — 시각: Lesser Essence of the Body */
  essence_life:
    "https://www.poe2wiki.net/images/c/cb/Lesser_Essence_of_the_Body_inventory_icon.png",
  /** ATTACK_ESSENCE — 시각: Lesser Essence of Abrasion (물리) */
  essence_attack:
    "https://www.poe2wiki.net/images/f/f9/Lesser_Essence_of_Abrasion_inventory_icon.png",
} as const;

export type CraftingLabCurrencyIconIdType = keyof typeof CRAFTING_LAB_CURRENCY_ICON_URLS;

export const getCraftingLabCurrencyIconUrl = (
  id: string,
): string | undefined => {
  if (id in CRAFTING_LAB_CURRENCY_ICON_URLS) {
    return CRAFTING_LAB_CURRENCY_ICON_URLS[id as CraftingLabCurrencyIconIdType];
  }
  return undefined;
};
