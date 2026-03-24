import type { IBaseItemStatTagType, IBaseItemSubTypeType } from "./baseItemDb";
import type { ModTypeType } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IModTierType {
  /** 1 = best tier. */
  tier: number;
  levelRequirement: number;
  weight: number;
  /** Value ranges for each stat placeholder (#) in the mod template. */
  statRanges: ReadonlyArray<{ min: number; max: number }>;
}

export interface IModDbRecordType {
  /** Stable unique key used in code and i18n lookups. */
  modKey: string;
  modType: ModTypeType;
  /** Item sub-types this mod can appear on. */
  applicableSubTypes: ReadonlyArray<IBaseItemSubTypeType>;
  /**
   * Stat tags the item must have (ALL of these must be present) for this mod to be applicable.
   * Empty array means no stat restriction — mod appears on all items of applicable sub-types.
   * Example: ["str"] → only STR/STR+DEX/STR+INT items; ["str","dex"] → only STR+DEX hybrids.
   */
  requiredItemTags: ReadonlyArray<IBaseItemStatTagType>;
  /** Mod property tags shown in PoE2DB brackets, e.g. ["생명력", "방어막"]. */
  modTags: ReadonlyArray<string>;
  /**
   * Total number of tiers available for this mod.
   * Derived from `tiers.length` when tiers are populated; stored explicitly
   * when tier detail data is not yet available.
   */
  tierCount: number;
  /** Highest level requirement across all tiers. */
  maxLevelRequirement: number;
  /** Total spawn weight (sum of all tier weights, or overview weight from PoE2DB). */
  totalWeight: number;
  /** Display line key → `simulator.mods.{nameTemplateKey}` in i18n */
  nameTemplateKey: string;
  /**
   * Per-tier detail — populated incrementally.
   * When absent, `tierCount` / `maxLevelRequirement` / `totalWeight` serve as
   * the overview-level data.
   */
  tiers?: ReadonlyArray<IModTierType>;
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

export interface IModDatabaseType {
  readonly version: string;
  readonly records: ReadonlyArray<IModDbRecordType>;
}

export const MOD_DB: IModDatabaseType = {
  version: "0.1.0",
  records: [

    // =========================================================================
    // Body Armour — Prefixes
    // =========================================================================

    {
      modKey: "prefix_max_life",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: [],
      modTags: ["생명력"],
      tierCount: 13,
      maxLevelRequirement: 80,
      totalWeight: 13000,
      nameTemplateKey: "prefix_max_life",
    },
    {
      modKey: "prefix_max_es",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet", "focus"],
      requiredItemTags: ["int"],
      modTags: ["방어막"],
      tierCount: 11,
      maxLevelRequirement: 79,
      totalWeight: 11000,
      nameTemplateKey: "prefix_max_es",
    },
    {
      modKey: "prefix_inc_es",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet", "focus"],
      requiredItemTags: ["int"],
      modTags: ["방어막"],
      tierCount: 8,
      maxLevelRequirement: 75,
      totalWeight: 8000,
      nameTemplateKey: "prefix_inc_es",
    },
    {
      modKey: "prefix_inc_es_max_life",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["int"],
      modTags: ["생명력", "방어막"],
      tierCount: 6,
      maxLevelRequirement: 78,
      totalWeight: 6000,
      nameTemplateKey: "prefix_inc_es_max_life",
    },
    {
      modKey: "prefix_max_es_inc_es",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet", "focus"],
      requiredItemTags: ["int"],
      modTags: ["방어막"],
      tierCount: 6,
      maxLevelRequirement: 78,
      totalWeight: 6000,
      nameTemplateKey: "prefix_max_es_inc_es",
    },
    {
      modKey: "prefix_phys_thorns",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: [],
      modTags: ["근접", "물리"],
      tierCount: 7,
      maxLevelRequirement: 74,
      totalWeight: 7000,
      nameTemplateKey: "prefix_phys_thorns",
    },
    {
      modKey: "prefix_spirit",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour"],
      requiredItemTags: [],
      modTags: [],
      tierCount: 8,
      maxLevelRequirement: 78,
      totalWeight: 3000,
      nameTemplateKey: "prefix_spirit",
    },

    // =========================================================================
    // Body Armour — Suffixes
    // =========================================================================

    {
      modKey: "suffix_intelligence",
      modType: "suffix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet", "focus", "ring", "amulet", "belt"],
      requiredItemTags: ["int"],
      modTags: ["능력치"],
      tierCount: 8,
      maxLevelRequirement: 74,
      totalWeight: 8000,
      nameTemplateKey: "suffix_intelligence",
    },
    {
      modKey: "suffix_fire_res",
      modType: "suffix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet", "ring", "amulet", "belt"],
      requiredItemTags: [],
      modTags: ["원소", "화염", "저항"],
      tierCount: 8,
      maxLevelRequirement: 82,
      totalWeight: 8000,
      nameTemplateKey: "suffix_fire_res",
    },
    {
      modKey: "suffix_cold_res",
      modType: "suffix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet", "ring", "amulet", "belt"],
      requiredItemTags: [],
      modTags: ["원소", "냉기", "저항"],
      tierCount: 8,
      maxLevelRequirement: 82,
      totalWeight: 8000,
      nameTemplateKey: "suffix_cold_res",
    },
    {
      modKey: "suffix_lightning_res",
      modType: "suffix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet", "ring", "amulet", "belt"],
      requiredItemTags: [],
      modTags: ["원소", "번개", "저항"],
      tierCount: 8,
      maxLevelRequirement: 82,
      totalWeight: 8000,
      nameTemplateKey: "suffix_lightning_res",
    },
    {
      modKey: "suffix_chaos_res",
      modType: "suffix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet", "ring", "amulet", "belt"],
      requiredItemTags: [],
      modTags: ["카오스", "저항"],
      tierCount: 6,
      maxLevelRequirement: 81,
      totalWeight: 1500,
      nameTemplateKey: "suffix_chaos_res",
    },
    {
      modKey: "suffix_reduced_attr_req",
      modType: "suffix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: [],
      modTags: [],
      tierCount: 5,
      maxLevelRequirement: 60,
      totalWeight: 4500,
      nameTemplateKey: "suffix_reduced_attr_req",
    },
    {
      modKey: "suffix_stun_threshold",
      modType: "suffix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: [],
      modTags: [],
      tierCount: 10,
      maxLevelRequirement: 72,
      totalWeight: 5000,
      nameTemplateKey: "suffix_stun_threshold",
    },
    {
      modKey: "suffix_life_regen",
      modType: "suffix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet", "belt"],
      requiredItemTags: [],
      modTags: ["생명력"],
      tierCount: 11,
      maxLevelRequirement: 81,
      totalWeight: 11000,
      nameTemplateKey: "suffix_life_regen",
    },
    {
      modKey: "suffix_reduced_bleed_duration",
      modType: "suffix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: [],
      modTags: ["물리", "상태 이상"],
      tierCount: 15,
      maxLevelRequirement: 76,
      totalWeight: 7500,
      nameTemplateKey: "suffix_reduced_bleed_duration",
    },
    {
      modKey: "suffix_reduced_poison_duration",
      modType: "suffix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: [],
      modTags: ["카오스", "상태 이상"],
      tierCount: 15,
      maxLevelRequirement: 76,
      totalWeight: 7500,
      nameTemplateKey: "suffix_reduced_poison_duration",
    },
    {
      modKey: "suffix_reduced_ignite_duration",
      modType: "suffix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: [],
      modTags: ["원소", "화염", "상태 이상"],
      tierCount: 15,
      maxLevelRequirement: 76,
      totalWeight: 7500,
      nameTemplateKey: "suffix_reduced_ignite_duration",
    },
    {
      modKey: "suffix_es_recharge_rate",
      modType: "suffix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet", "focus"],
      requiredItemTags: ["int"],
      modTags: ["방어막"],
      tierCount: 6,
      maxLevelRequirement: 81,
      totalWeight: 6000,
      nameTemplateKey: "suffix_es_recharge_rate",
    },

    // =========================================================================
    // Gloves — Prefixes: Max Mana (common)
    // =========================================================================

    {
      modKey: "prefix_max_mana",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: [],
      modTags: ["마나"],
      tierCount: 9,
      maxLevelRequirement: 60,
      totalWeight: 9000,
      nameTemplateKey: "prefix_max_mana",
    },

    // =========================================================================
    // Gloves — Prefixes: Armour (STR only)
    // =========================================================================

    {
      modKey: "prefix_max_armour",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["str"],
      modTags: ["방어막"],
      tierCount: 7,
      maxLevelRequirement: 54,
      totalWeight: 7000,
      nameTemplateKey: "prefix_max_armour",
    },
    {
      modKey: "prefix_inc_armour",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["str"],
      modTags: ["방어막"],
      tierCount: 7,
      maxLevelRequirement: 65,
      totalWeight: 7000,
      nameTemplateKey: "prefix_inc_armour",
    },
    {
      modKey: "prefix_inc_armour_max_life",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["str"],
      modTags: ["생명력", "방어막"],
      tierCount: 6,
      maxLevelRequirement: 78,
      totalWeight: 6000,
      nameTemplateKey: "prefix_inc_armour_max_life",
    },

    // =========================================================================
    // Gloves — Prefixes: Evasion (DEX only)
    // =========================================================================

    {
      modKey: "prefix_max_evasion",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["dex"],
      modTags: ["방어막"],
      tierCount: 7,
      maxLevelRequirement: 54,
      totalWeight: 7000,
      nameTemplateKey: "prefix_max_evasion",
    },
    {
      modKey: "prefix_inc_evasion",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["dex"],
      modTags: ["방어막"],
      tierCount: 7,
      maxLevelRequirement: 65,
      totalWeight: 7000,
      nameTemplateKey: "prefix_inc_evasion",
    },
    {
      modKey: "prefix_inc_evasion_max_life",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["dex"],
      modTags: ["생명력", "방어막"],
      tierCount: 6,
      maxLevelRequirement: 78,
      totalWeight: 6000,
      nameTemplateKey: "prefix_inc_evasion_max_life",
    },

    // =========================================================================
    // Gloves — Prefixes: Armour + Evasion (STR+DEX hybrid)
    // =========================================================================

    {
      modKey: "prefix_armour_evasion_flat",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["str", "dex"],
      modTags: ["방어막"],
      tierCount: 4,
      maxLevelRequirement: 46,
      totalWeight: 4000,
      nameTemplateKey: "prefix_armour_evasion_flat",
    },
    {
      modKey: "prefix_inc_armour_evasion",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["str", "dex"],
      modTags: ["방어막"],
      tierCount: 7,
      maxLevelRequirement: 65,
      totalWeight: 7000,
      nameTemplateKey: "prefix_inc_armour_evasion",
    },
    {
      modKey: "prefix_inc_armour_evasion_max_life",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["str", "dex"],
      modTags: ["생명력", "방어막"],
      tierCount: 6,
      maxLevelRequirement: 78,
      totalWeight: 6000,
      nameTemplateKey: "prefix_inc_armour_evasion_max_life",
    },

    // =========================================================================
    // Gloves — Prefixes: Armour + Energy Shield (STR+INT hybrid)
    // =========================================================================

    {
      modKey: "prefix_armour_es_flat",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["str", "int"],
      modTags: ["방어막"],
      tierCount: 4,
      maxLevelRequirement: 49,
      totalWeight: 4000,
      nameTemplateKey: "prefix_armour_es_flat",
    },
    {
      modKey: "prefix_inc_armour_es",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["str", "int"],
      modTags: ["방어막"],
      tierCount: 7,
      maxLevelRequirement: 65,
      totalWeight: 7000,
      nameTemplateKey: "prefix_inc_armour_es",
    },
    {
      modKey: "prefix_inc_armour_es_max_life",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["str", "int"],
      modTags: ["생명력", "방어막"],
      tierCount: 6,
      maxLevelRequirement: 78,
      totalWeight: 6000,
      nameTemplateKey: "prefix_inc_armour_es_max_life",
    },

    // =========================================================================
    // Gloves — Prefixes: Evasion + Energy Shield (DEX+INT hybrid)
    // =========================================================================

    {
      modKey: "prefix_evasion_es_flat",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["dex", "int"],
      modTags: ["방어막"],
      tierCount: 4,
      maxLevelRequirement: 46,
      totalWeight: 4000,
      nameTemplateKey: "prefix_evasion_es_flat",
    },
    {
      modKey: "prefix_inc_evasion_es",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["dex", "int"],
      modTags: ["방어막"],
      tierCount: 7,
      maxLevelRequirement: 65,
      totalWeight: 7000,
      nameTemplateKey: "prefix_inc_evasion_es",
    },
    {
      modKey: "prefix_inc_evasion_es_max_life",
      modType: "prefix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["dex", "int"],
      modTags: ["생명력", "방어막"],
      tierCount: 6,
      maxLevelRequirement: 78,
      totalWeight: 6000,
      nameTemplateKey: "prefix_inc_evasion_es_max_life",
    },

    // =========================================================================
    // Gloves — Prefixes: Attack Damage (all types)
    // =========================================================================

    {
      modKey: "prefix_added_phys_damage_attack",
      modType: "prefix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["근접", "물리", "공격"],
      tierCount: 9,
      maxLevelRequirement: 75,
      totalWeight: 7500,
      nameTemplateKey: "prefix_added_phys_damage_attack",
    },
    {
      modKey: "prefix_added_fire_damage_attack",
      modType: "prefix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["원소", "화염", "공격"],
      tierCount: 9,
      maxLevelRequirement: 75,
      totalWeight: 3900,
      nameTemplateKey: "prefix_added_fire_damage_attack",
    },
    {
      modKey: "prefix_added_cold_damage_attack",
      modType: "prefix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["원소", "냉기", "공격"],
      tierCount: 9,
      maxLevelRequirement: 75,
      totalWeight: 3900,
      nameTemplateKey: "prefix_added_cold_damage_attack",
    },
    {
      modKey: "prefix_added_lightning_damage_attack",
      modType: "prefix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["원소", "번개", "공격"],
      tierCount: 9,
      maxLevelRequirement: 75,
      totalWeight: 3900,
      nameTemplateKey: "prefix_added_lightning_damage_attack",
    },
    {
      modKey: "prefix_accuracy",
      modType: "prefix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["공격"],
      tierCount: 9,
      maxLevelRequirement: 76,
      totalWeight: 6200,
      nameTemplateKey: "prefix_accuracy",
    },

    // =========================================================================
    // Gloves — Suffixes: Stat Attributes
    // =========================================================================

    {
      modKey: "suffix_strength",
      modType: "suffix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet", "ring", "amulet", "belt"],
      requiredItemTags: ["str"],
      modTags: ["능력치"],
      tierCount: 8,
      maxLevelRequirement: 74,
      totalWeight: 8000,
      nameTemplateKey: "suffix_strength",
    },
    {
      modKey: "suffix_dexterity",
      modType: "suffix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet", "ring", "amulet", "belt"],
      requiredItemTags: ["dex"],
      modTags: ["능력치"],
      tierCount: 9,
      maxLevelRequirement: 83,
      totalWeight: 9000,
      nameTemplateKey: "suffix_dexterity",
    },

    // =========================================================================
    // Gloves — Suffixes: Attack & Utility (all types)
    // =========================================================================

    {
      modKey: "suffix_melee_skill_levels",
      modType: "suffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["공격"],
      tierCount: 2,
      maxLevelRequirement: 41,
      totalWeight: 750,
      nameTemplateKey: "suffix_melee_skill_levels",
    },
    {
      modKey: "suffix_life_leech_from_phys",
      modType: "suffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["생명력", "물리", "공격"],
      tierCount: 5,
      maxLevelRequirement: 83,
      totalWeight: 5000,
      nameTemplateKey: "suffix_life_leech_from_phys",
    },
    {
      modKey: "suffix_mana_leech_from_phys",
      modType: "suffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["마나", "물리", "공격"],
      tierCount: 5,
      maxLevelRequirement: 81,
      totalWeight: 5000,
      nameTemplateKey: "suffix_mana_leech_from_phys",
    },
    {
      modKey: "suffix_life_on_kill",
      modType: "suffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["생명력"],
      tierCount: 8,
      maxLevelRequirement: 77,
      totalWeight: 6000,
      nameTemplateKey: "suffix_life_on_kill",
    },
    {
      modKey: "suffix_mana_on_kill",
      modType: "suffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["마나"],
      tierCount: 8,
      maxLevelRequirement: 78,
      totalWeight: 6000,
      nameTemplateKey: "suffix_mana_on_kill",
    },
    {
      modKey: "suffix_life_on_hit",
      modType: "suffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["생명력", "공격"],
      tierCount: 4,
      maxLevelRequirement: 40,
      totalWeight: 4000,
      nameTemplateKey: "suffix_life_on_hit",
    },
    {
      modKey: "suffix_attack_speed",
      modType: "suffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["공격", "속도"],
      tierCount: 4,
      maxLevelRequirement: 60,
      totalWeight: 2000,
      nameTemplateKey: "suffix_attack_speed",
    },
    {
      modKey: "suffix_crit_damage_bonus",
      modType: "suffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["치명타"],
      tierCount: 5,
      maxLevelRequirement: 59,
      totalWeight: 3750,
      nameTemplateKey: "suffix_crit_damage_bonus",
    },
    {
      modKey: "suffix_item_rarity",
      modType: "suffix",
      applicableSubTypes: ["gloves", "helmet"],
      requiredItemTags: [],
      modTags: [],
      tierCount: 3,
      maxLevelRequirement: 40,
      totalWeight: 3000,
      nameTemplateKey: "suffix_item_rarity",
    },

    // =========================================================================
    // Gloves — Suffixes: Defence-stat Specific
    // =========================================================================

    {
      modKey: "suffix_armour_to_elemental",
      modType: "suffix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["str"],
      modTags: ["방어막", "원소"],
      tierCount: 5,
      maxLevelRequirement: 66,
      totalWeight: 5000,
      nameTemplateKey: "suffix_armour_to_elemental",
    },
    {
      modKey: "suffix_fortify_from_evasion",
      modType: "suffix",
      applicableSubTypes: ["bodyArmour", "gloves", "boots", "helmet"],
      requiredItemTags: ["dex"],
      modTags: ["방어막"],
      tierCount: 5,
      maxLevelRequirement: 66,
      totalWeight: 5000,
      nameTemplateKey: "suffix_fortify_from_evasion",
    },

    // =========================================================================
    // Body Armour — Corrupted Implicit Suffixes (훼손된 속성 접미어)
    // Source: AMANAMU / KURGAL / ULAMAN vaal gods
    // weight 0 — only obtainable via corruption, not regular crafting
    // =========================================================================

    {
      modKey: "corrupted_fire_chaos_res",
      modType: "corruptedSuffix",
      applicableSubTypes: ["bodyArmour", "gloves"],
      requiredItemTags: [],
      modTags: ["원소", "화염", "카오스", "저항"],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_fire_chaos_res",
    },
    {
      modKey: "corrupted_str_int",
      modType: "corruptedSuffix",
      applicableSubTypes: ["bodyArmour", "gloves"],
      requiredItemTags: [],
      modTags: ["능력치"],
      tierCount: 2,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_str_int",
    },
    {
      modKey: "corrupted_str_dex",
      modType: "corruptedSuffix",
      applicableSubTypes: ["bodyArmour", "gloves"],
      requiredItemTags: [],
      modTags: ["능력치"],
      tierCount: 2,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_str_dex",
    },
    {
      modKey: "corrupted_spirit_retention",
      modType: "corruptedSuffix",
      applicableSubTypes: ["bodyArmour", "gloves"],
      requiredItemTags: [],
      modTags: [],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_spirit_retention",
    },
    {
      modKey: "corrupted_reduced_curse_effect",
      modType: "corruptedSuffix",
      applicableSubTypes: ["bodyArmour", "gloves"],
      requiredItemTags: [],
      modTags: ["시전", "저주"],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_reduced_curse_effect",
    },
    {
      modKey: "corrupted_cold_chaos_res",
      modType: "corruptedSuffix",
      applicableSubTypes: ["bodyArmour", "gloves"],
      requiredItemTags: [],
      modTags: ["원소", "냉기", "카오스", "저항"],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_cold_chaos_res",
    },
    {
      modKey: "corrupted_dex_int",
      modType: "corruptedSuffix",
      applicableSubTypes: ["bodyArmour", "gloves"],
      requiredItemTags: [],
      modTags: ["능력치"],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_dex_int",
    },
    {
      modKey: "corrupted_damage_as_mana_cost",
      modType: "corruptedSuffix",
      applicableSubTypes: ["bodyArmour", "gloves"],
      requiredItemTags: [],
      modTags: ["생명력", "마나"],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_damage_as_mana_cost",
    },
    {
      modKey: "corrupted_damage_to_mana_recoup",
      modType: "corruptedSuffix",
      applicableSubTypes: ["bodyArmour", "gloves"],
      requiredItemTags: [],
      modTags: ["생명력", "마나"],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_damage_to_mana_recoup",
    },
    {
      modKey: "corrupted_lightning_chaos_res",
      modType: "corruptedSuffix",
      applicableSubTypes: ["bodyArmour", "gloves"],
      requiredItemTags: [],
      modTags: ["원소", "번개", "카오스", "저항"],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_lightning_chaos_res",
    },
    {
      modKey: "corrupted_reduced_crit_chance_vs_player",
      modType: "corruptedSuffix",
      applicableSubTypes: ["bodyArmour", "gloves"],
      requiredItemTags: [],
      modTags: ["치명타"],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_reduced_crit_chance_vs_player",
    },

    // =========================================================================
    // Gloves — Corrupted Implicit Suffixes (장갑 전용)
    // =========================================================================

    {
      modKey: "corrupted_stun_on_hit",
      modType: "corruptedSuffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: [],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_stun_on_hit",
    },
    {
      modKey: "corrupted_instant_leech",
      modType: "corruptedSuffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: [],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_instant_leech",
    },
    {
      modKey: "corrupted_mana_cost_efficiency",
      modType: "corruptedSuffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["마나"],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_mana_cost_efficiency",
    },
    {
      modKey: "corrupted_ailment_intensity",
      modType: "corruptedSuffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["상태 이상"],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_ailment_intensity",
    },
    {
      modKey: "corrupted_bleed_chance",
      modType: "corruptedSuffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: [],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_bleed_chance",
    },
    {
      modKey: "corrupted_poison_chance",
      modType: "corruptedSuffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: [],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_poison_chance",
    },
    {
      modKey: "corrupted_curse_effect_area",
      modType: "corruptedSuffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["시전", "저주"],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_curse_effect_area",
    },
    {
      modKey: "corrupted_immobilize_buildup",
      modType: "corruptedSuffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: [],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_immobilize_buildup",
    },
    {
      modKey: "corrupted_arcane_shadow_on_crit",
      modType: "corruptedSuffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["치명타"],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_arcane_shadow_on_crit",
    },
    {
      modKey: "corrupted_cast_speed_at_full_life",
      modType: "corruptedSuffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["시전", "속도"],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_cast_speed_at_full_life",
    },
    {
      modKey: "corrupted_skill_speed_consume_frenzy",
      modType: "corruptedSuffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["속도"],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_skill_speed_consume_frenzy",
    },
    {
      modKey: "corrupted_lacerate_on_hit",
      modType: "corruptedSuffix",
      applicableSubTypes: ["gloves"],
      requiredItemTags: [],
      modTags: ["물리", "상태 이상"],
      tierCount: 1,
      maxLevelRequirement: 65,
      totalWeight: 0,
      nameTemplateKey: "corrupted_lacerate_on_hit",
    },

  ],
};
