/**
 * Path of Exile 2 Wiki (poe2wiki.net) inventory icon PNGs — educational / tool reference.
 * Copyright: Grinding Gear Games (see wiki file pages).
 */

import type {
  CraftLabAbyssBoneIdType,
  CraftLabAbyssOmenIdType,
} from "@/lib/poe2-item-simulator/abyss/abyssCrafting";
import type { CraftLabRitualOmenIdType } from "@/lib/poe2-item-simulator/ritual/ritualCrafting";
import type { CraftLabEssenceCurrencyIdType } from "@/lib/poe2-item-simulator/essence/essence";

/** `CRAFT_LAB_ESSENCE_DEFINITIONS`와 키 1:1 — 에센스 추가 시 여기도 필수 (위키 File API URL) */
const CRAFT_LAB_ESSENCE_ICON_URLS: Record<
  CraftLabEssenceCurrencyIdType,
  string
> = {
  essence_attack:
    "https://www.poe2wiki.net/images/f/f9/Lesser_Essence_of_Abrasion_inventory_icon.png",
  essence_alacrity:
    "https://www.poe2wiki.net/images/7/78/Lesser_Essence_of_Alacrity_inventory_icon.png",
  essence_battle:
    "https://www.poe2wiki.net/images/5/5a/Lesser_Essence_of_Battle_inventory_icon.png",
  essence_command:
    "https://www.poe2wiki.net/images/0/06/Lesser_Essence_of_Command_inventory_icon.png",
  essence_electricity:
    "https://www.poe2wiki.net/images/d/de/Lesser_Essence_of_Electricity_inventory_icon.png",
  essence_enhancement:
    "https://www.poe2wiki.net/images/c/cb/Lesser_Essence_of_Enhancement_inventory_icon.png",
  essence_flames:
    "https://www.poe2wiki.net/images/c/cb/Lesser_Essence_of_Flames_inventory_icon.png",
  essence_grounding:
    "https://www.poe2wiki.net/images/f/fe/Lesser_Essence_of_Grounding_inventory_icon.png",
  essence_haste:
    "https://www.poe2wiki.net/images/6/66/Lesser_Essence_of_Haste_inventory_icon.png",
  essence_ice:
    "https://www.poe2wiki.net/images/f/f6/Lesser_Essence_of_Ice_inventory_icon.png",
  essence_insulation:
    "https://www.poe2wiki.net/images/e/e6/Lesser_Essence_of_Insulation_inventory_icon.png",
  essence_opulence:
    "https://www.poe2wiki.net/images/3/36/Lesser_Essence_of_Opulence_inventory_icon.png",
  essence_ruin:
    "https://www.poe2wiki.net/images/7/7b/Lesser_Essence_of_Ruin_inventory_icon.png",
  essence_seeking:
    "https://www.poe2wiki.net/images/e/e8/Lesser_Essence_of_Seeking_inventory_icon.png",
  essence_sorcery:
    "https://www.poe2wiki.net/images/3/35/Lesser_Essence_of_Sorcery_inventory_icon.png",
  essence_thawing:
    "https://www.poe2wiki.net/images/3/34/Lesser_Essence_of_Thawing_inventory_icon.png",
  essence_life:
    "https://www.poe2wiki.net/images/c/cb/Lesser_Essence_of_the_Body_inventory_icon.png",
  essence_infinite:
    "https://www.poe2wiki.net/images/a/a5/Lesser_Essence_of_the_Infinite_inventory_icon.png",
  essence_mind:
    "https://www.poe2wiki.net/images/0/07/Lesser_Essence_of_the_Mind_inventory_icon.png",
};

/** 보존된 뼈·심연 징조 — 위키 File URL */
const CRAFT_LAB_ABYSS_ICON_URLS: Record<
  CraftLabAbyssBoneIdType | CraftLabAbyssOmenIdType,
  string
> = {
  bone_gnawed_collarbone:
    "https://www.poe2wiki.net/images/2/2f/Gnawed_Collarbone_inventory_icon.png",
  bone_gnawed_jawbone:
    "https://www.poe2wiki.net/images/7/75/Gnawed_Jawbone_inventory_icon.png",
  bone_gnawed_rib:
    "https://www.poe2wiki.net/images/6/61/Gnawed_Rib_inventory_icon.png",
  bone_preserved_collarbone:
    "https://www.poe2wiki.net/images/7/7a/Preserved_Collarbone_inventory_icon.png",
  bone_preserved_jawbone:
    "https://www.poe2wiki.net/images/4/47/Preserved_Jawbone_inventory_icon.png",
  bone_preserved_rib:
    "https://www.poe2wiki.net/images/e/e8/Preserved_Rib_inventory_icon.png",
  bone_preserved_cranium:
    "https://www.poe2wiki.net/images/5/50/Preserved_Cranium_inventory_icon.png",
  bone_ancient_collarbone:
    "https://www.poe2wiki.net/images/2/29/Ancient_Collarbone_inventory_icon.png",
  bone_ancient_jawbone:
    "https://www.poe2wiki.net/images/7/79/Ancient_Jawbone_inventory_icon.png",
  bone_ancient_rib:
    "https://www.poe2wiki.net/images/9/9d/Ancient_Rib_inventory_icon.png",
  omen_abyssal_echoes:
    "https://www.poe2wiki.net/images/8/8a/Omen_of_Abyssal_Echoes_inventory_icon.png",
  omen_dextral_necromancy:
    "https://www.poe2wiki.net/images/8/84/Omen_of_Dextral_Necromancy_inventory_icon.png",
  omen_sinistral_necromancy:
    "https://www.poe2wiki.net/images/2/2e/Omen_of_Sinistral_Necromancy_inventory_icon.png",
  omen_light:
    "https://www.poe2wiki.net/images/1/12/Omen_of_Light_inventory_icon.png",
  omen_putrefaction:
    "https://www.poe2wiki.net/images/b/b8/Omen_of_Putrefaction_inventory_icon.png",
  omen_blackblooded:
    "https://www.poe2wiki.net/images/6/60/Omen_of_the_Blackblooded_inventory_icon.png",
  omen_liege:
    "https://www.poe2wiki.net/images/9/96/Omen_of_the_Liege_inventory_icon.png",
  omen_sovereign:
    "https://www.poe2wiki.net/images/b/b5/Omen_of_the_Sovereign_inventory_icon.png",
};

/** 의식(Ritual) 보상 징조 — 위키 File URL */
const CRAFT_LAB_RITUAL_ICON_URLS: Record<CraftLabRitualOmenIdType, string> = {
  omen_whittling:
    "https://www.poe2wiki.net/images/8/81/Omen_of_Whittling_inventory_icon.png",
  omen_sanctification:
    "https://www.poe2wiki.net/images/5/5d/Omen_of_Sanctification_inventory_icon.png",
  omen_answered_prayers:
    "https://www.poe2wiki.net/images/1/11/Omen_of_Answered_Prayers_inventory_icon.png",
  omen_bartering:
    "https://www.poe2wiki.net/images/a/a8/Omen_of_Bartering_inventory_icon.png",
  omen_chance:
    "https://www.poe2wiki.net/images/c/ce/Omen_of_Chance_inventory_icon.png",
  omen_corruption:
    "https://www.poe2wiki.net/images/a/a2/Omen_of_Corruption_inventory_icon.png",
  omen_the_hunt:
    "https://www.poe2wiki.net/images/d/dc/Omen_of_the_Hunt_inventory_icon.png",
  omen_the_blessed:
    "https://www.poe2wiki.net/images/a/a1/Omen_of_the_Blessed_inventory_icon.png",
};

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
  orb_regal:
    "https://www.poe2wiki.net/images/3/33/Regal_Orb_inventory_icon.png",
  /** 티어별 아이콘이 위키에 분리되어 있으면 교체. */
  orb_regal_t1:
    "https://www.poe2wiki.net/images/3/33/Regal_Orb_inventory_icon.png",
  orb_regal_t2:
    "https://www.poe2wiki.net/images/3/33/Regal_Orb_inventory_icon.png",
  orb_regal_t3:
    "https://www.poe2wiki.net/images/3/33/Regal_Orb_inventory_icon.png",
  orb_alchemy:
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
  orb_divine:
    "https://www.poe2wiki.net/images/5/58/Divine_Orb_inventory_icon.png",
  orb_vaal:
    "https://www.poe2wiki.net/images/2/2c/Vaal_Orb_inventory_icon.png",
  orb_hinekoras_lock:
    "https://www.poe2wiki.net/images/5/53/Hinekora%27s_Lock_inventory_icon.png",
  orb_mirror:
    "https://www.poe2wiki.net/images/9/9c/Mirror_of_Kalandra_inventory_icon.png",
  orb_chance:
    "https://www.poe2wiki.net/images/8/86/Orb_of_Chance_inventory_icon.png",
  /** 징조 샘플 아이콘 — UI 자리 표시용 */
  omen_placeholder:
    "https://www.poe2wiki.net/images/5/5d/Omen_of_Sanctification_inventory_icon.png",
  ...CRAFT_LAB_ESSENCE_ICON_URLS,
  ...CRAFT_LAB_ABYSS_ICON_URLS,
  ...CRAFT_LAB_RITUAL_ICON_URLS,
} as const;

export type CraftingLabCurrencyIconIdType = keyof typeof CRAFTING_LAB_CURRENCY_ICON_URLS;
const CRAFTING_LAB_LOCAL_ICON_BASE_PATH: string = "/images/crafting-lab/currency";

export const getCraftingLabCurrencyIconUrl = (
  id: string,
): string | undefined => {
  if (id in CRAFTING_LAB_CURRENCY_ICON_URLS) {
    return `${CRAFTING_LAB_LOCAL_ICON_BASE_PATH}/${id}.png`;
  }
  return undefined;
};
