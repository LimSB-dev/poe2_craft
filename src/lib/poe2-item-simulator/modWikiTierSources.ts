import type { WikiExtractedModTierRowType } from "@/lib/poe2-item-simulator/wikiModTierTypes";

/**
 * Maps simulator `modKey` → poe2wiki Cargo `mods.mod_groups` (+ prefix/suffix).
 * When `mod_groups` contains multiple stat families, use `rowMatches` to pick rows.
 */
export type ModWikiTierSourceRuleType = {
  modGroups: string;
  generationType: 1 | 2;
  rowMatches?: (row: WikiExtractedModTierRowType) => boolean;
};

const normStatText = (row: WikiExtractedModTierRowType): string => {
  return (row.statText ?? "").replace(/&lt;br&gt;/gi, " ");
};

const wikiRow = {
  baseLocalDefencesArmourEvasionFlat: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return (
      t.includes("[[Armour]]") &&
      t.includes("[[Evasion]] Rating") &&
      !t.includes("maximum [[Energy Shield]]")
    );
  },
  baseLocalDefencesArmourEsFlat: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return t.includes("[[Armour]]") && t.includes("maximum [[Energy Shield]]");
  },
  baseLocalDefencesEvasionEsFlat: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return t.includes("[[Evasion]] Rating") && t.includes("maximum [[Energy Shield]]");
  },
  baseLocalDefencesLifeArmourOnly: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return (
      t.includes("increased [[Armour]]") &&
      t.includes("maximum Life") &&
      !t.includes("Energy Shield") &&
      !t.includes("Evasion")
    );
  },
  baseLocalDefencesLifeArmourEs: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return (
      t.includes("Armour]] and [[Energy Shield]]") &&
      t.includes("maximum Life")
    );
  },
  baseLocalDefencesLifeArmourEvasion: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return (
      t.includes("Armour]] and [[Evasion]]") &&
      t.includes("maximum Life")
    );
  },
  baseLocalDefencesLifeEsOnly: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return (
      t.includes("increased [[Energy Shield]]") &&
      t.includes("maximum Life") &&
      !t.includes("Armour") &&
      !t.includes("Evasion")
    );
  },
  /** `BaseLocalDefencesAndMana`: `LocalIncreasedEnergyShieldAndMana*` (not Armour/Evasion hybrid lines). */
  baseLocalDefencesManaEsOnly: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return (
      t.includes("increased [[Energy Shield]]") &&
      t.includes("maximum Mana") &&
      !t.includes("Armour") &&
      !t.includes("Evasion") &&
      !t.includes("Life")
    );
  },
  baseLocalDefencesLifeEvasionEs: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return (
      t.includes("Evasion]] and [[Energy Shield]]") &&
      t.includes("maximum Life")
    );
  },
  baseLocalDefencesLifeEvasionOnly: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return (
      t.includes("increased [[Evasion]]") &&
      t.includes("maximum Life") &&
      !t.includes("Armour") &&
      !t.includes("Energy Shield")
    );
  },
  baseLocalDefencesPctArmourFlatArmour: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return (
      t.includes("increased [[Armour]]") &&
      t.includes("to [[Armour]]") &&
      !t.includes("Energy Shield") &&
      !t.includes("Evasion")
    );
  },
  baseLocalDefencesPctArmourEs: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return t.includes("Armour]] and [[Energy Shield]]") && t.includes("increased");
  },
  baseLocalDefencesPctArmourEvasion: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return t.includes("Armour]] and [[Evasion]]") && t.includes("increased");
  },
  baseLocalDefencesPctEsFlatEs: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return (
      t.includes("increased [[Energy Shield]]") &&
      t.includes("maximum [[Energy Shield]]") &&
      !t.includes("Armour") &&
      !t.includes("Evasion")
    );
  },
  /** `+(n–m) to maximum Energy Shield` only (local). Excludes % ES, 하이브리드(생명/마나/방어 등). */
  baseLocalDefencesFlatEsOnly: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    if (!t.includes("maximum [[Energy Shield]]")) {
      return false;
    }
    if (t.includes("increased")) {
      return false;
    }
    if (t.includes("Life") || t.includes("Mana")) {
      return false;
    }
    if (t.includes("Armour") || t.includes("Evasion")) {
      return false;
    }
    return true;
  },
  baseLocalDefencesPctEvasionEs: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return t.includes("Evasion]] and [[Energy Shield]]") && t.includes("increased");
  },
  baseLocalDefencesPctEvasionFlatEvasion: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return (
      t.includes("increased [[Evasion]]") &&
      t.includes("to [[Evasion]] Rating") &&
      !t.includes("Armour") &&
      !t.includes("Energy Shield")
    );
  },
  increasedAccuracyNoLightRadius: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return t.includes("[[Accuracy]] Rating") && !t.toLowerCase().includes("light radius");
  },
  lifeLeechAttack: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return t.includes("[[Physical]] [[Attack]] Damage as Life");
  },
  manaLeechAttack: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return t.includes("[[Physical]] [[Attack]] Damage as Mana");
  },
  meleeSocketedOnly: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return t.includes("Melee]] Skills");
  },
  reducedAilmentBleed: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return t.includes("[[Bleeding]]");
  },
  reducedAilmentPoison: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return t.includes("[[Poison]] Duration on you");
  },
  reducedAilmentIgnite: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return t.includes("[[Ignite]] Duration on you");
  },
  critMultGlobal: (row: WikiExtractedModTierRowType): boolean => {
    const t = normStatText(row);
    return t.includes("Critical Damage Bonus]]") && !t.includes("for [[Attack]]");
  },
  /**
   * Wiki Cargo often lists a parallel ladder for two-hand weapons (e.g. `IncreasedManaTwoHandWeapon*`,
   * `LocalAddedFireDamageTwoHand*`) under the same `mod_groups` as one-hand / glove. Merging both
   * duplicates ilvl rows and scrambles tier order — keep a single ladder for simulator `modKey`s.
   */
  wikiModExcludeTwoHandVariant: (row: WikiExtractedModTierRowType): boolean => {
    return !row.wikiModId.includes("TwoHand");
  },
  /** `GlobalMinionSpellSkillGemLevel1–3` — `Weapon` 변형(셉터) 제외. */
  minionGlobalSocketedGemSkill: (row: WikiExtractedModTierRowType): boolean => {
    return (
      row.wikiModId.startsWith("GlobalMinionSpellSkillGemLevel") &&
      !row.wikiModId.includes("Weapon")
    );
  },
  /**
   * 동일 `mod_groups`에 `NearbyAlliesLifeRegeneration*`(셉터·아군 재생)가 있으면 티어가 섞인다.
   * `suffix_life_regen`(플레이어 % 재생)만 남긴다.
   */
  lifeRegenerationPlayerSuffix: (row: WikiExtractedModTierRowType): boolean => {
    return !row.wikiModId.startsWith("NearbyAllies");
  },
  /**
   * `CriticalStrikeChanceIncrease`에 무기 지역·궁술·함정·셉터(아군) 등이 섞여 있음.
   * 투구·목걸이 전역 줄만 — `CriticalStrikeChance1`…`CriticalStrikeChance6`.
   */
  criticalStrikeChanceGlobalHelmetAmulet: (row: WikiExtractedModTierRowType): boolean => {
    return /^CriticalStrikeChance\d+$/.test(row.wikiModId);
  },
  /**
   * 로컬 ES % (`DefencesPercent`) — `EnergyShieldPercent`의 전역 최대 ES %(`IncreasedEnergyShieldPercent*`)와 분리.
   */
  localIncreasedEnergyShieldPercentOnly: (row: WikiExtractedModTierRowType): boolean => {
    return row.wikiModId.startsWith("LocalIncreasedEnergyShieldPercent");
  },
};

/**
 * Only non-corrupted `modKey`s we can align with wiki Cargo rows.
 * Corrupted and unmatched keys fall back to synthetic tiers in `getModTierDisplayRows`.
 */
export const MOD_WIKI_TIER_SOURCES: Readonly<
  Partial<Readonly<Record<string, ModWikiTierSourceRuleType>>>
> = {
  prefix_max_life: { modGroups: "IncreasedLife", generationType: 1 },
  prefix_max_es: {
    modGroups: "BaseLocalDefences",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesFlatEsOnly,
  },
  prefix_inc_es: {
    modGroups: "DefencesPercent",
    generationType: 1,
    rowMatches: wikiRow.localIncreasedEnergyShieldPercentOnly,
  },
  prefix_inc_es_max_life: {
    modGroups: "BaseLocalDefencesAndLife",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesLifeEsOnly,
  },
  prefix_inc_es_max_mana: {
    modGroups: "BaseLocalDefencesAndMana",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesManaEsOnly,
  },
  prefix_max_es_inc_es: {
    modGroups: "BaseLocalDefencesAndDefencePercent",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesPctEsFlatEs,
  },
  prefix_phys_thorns: { modGroups: "Thorns", generationType: 1 },
  prefix_spirit: { modGroups: "BaseSpirit", generationType: 1 },
  prefix_max_mana: {
    modGroups: "IncreasedMana",
    generationType: 1,
    rowMatches: wikiRow.wikiModExcludeTwoHandVariant,
  },
  prefix_max_armour: { modGroups: "IncreasedPhysicalDamageReductionRating", generationType: 1 },
  prefix_inc_armour: {
    modGroups: "BaseLocalDefencesAndDefencePercent",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesPctArmourFlatArmour,
  },
  prefix_inc_armour_max_life: {
    modGroups: "BaseLocalDefencesAndLife",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesLifeArmourOnly,
  },
  prefix_max_evasion: { modGroups: "IncreasedEvasionRating", generationType: 1 },
  prefix_inc_evasion: {
    modGroups: "BaseLocalDefencesAndDefencePercent",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesPctEvasionFlatEvasion,
  },
  prefix_inc_evasion_max_life: {
    modGroups: "BaseLocalDefencesAndLife",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesLifeEvasionOnly,
  },
  prefix_armour_evasion_flat: {
    modGroups: "BaseLocalDefences",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesArmourEvasionFlat,
  },
  prefix_inc_armour_evasion: {
    modGroups: "BaseLocalDefencesAndDefencePercent",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesPctArmourEvasion,
  },
  prefix_inc_armour_evasion_max_life: {
    modGroups: "BaseLocalDefencesAndLife",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesLifeArmourEvasion,
  },
  prefix_armour_es_flat: {
    modGroups: "BaseLocalDefences",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesArmourEsFlat,
  },
  prefix_inc_armour_es: {
    modGroups: "BaseLocalDefencesAndDefencePercent",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesPctArmourEs,
  },
  prefix_inc_armour_es_max_life: {
    modGroups: "BaseLocalDefencesAndLife",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesLifeArmourEs,
  },
  prefix_evasion_es_flat: {
    modGroups: "BaseLocalDefences",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesEvasionEsFlat,
  },
  prefix_inc_evasion_es: {
    modGroups: "BaseLocalDefencesAndDefencePercent",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesPctEvasionEs,
  },
  prefix_inc_evasion_es_max_life: {
    modGroups: "BaseLocalDefencesAndLife",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesLifeEvasionEs,
  },
  prefix_added_phys_damage_attack: {
    modGroups: "PhysicalDamage",
    generationType: 1,
    rowMatches: wikiRow.wikiModExcludeTwoHandVariant,
  },
  prefix_added_fire_damage_attack: {
    modGroups: "FireDamage",
    generationType: 1,
    rowMatches: wikiRow.wikiModExcludeTwoHandVariant,
  },
  prefix_added_cold_damage_attack: {
    modGroups: "ColdDamage",
    generationType: 1,
    rowMatches: wikiRow.wikiModExcludeTwoHandVariant,
  },
  prefix_added_lightning_damage_attack: {
    modGroups: "LightningDamage",
    generationType: 1,
    rowMatches: wikiRow.wikiModExcludeTwoHandVariant,
  },
  prefix_accuracy: {
    modGroups: "IncreasedAccuracy",
    generationType: 1,
    rowMatches: wikiRow.increasedAccuracyNoLightRadius,
  },
  /** `SpellDamageOnTwoHandWeapon*` — 위키 `staff` 열만. */
  prefix_inc_spell_damage_staff: {
    modGroups: "WeaponCasterDamagePrefix",
    generationType: 1,
    rowMatches: (row: WikiExtractedModTierRowType): boolean => {
      return row.wikiModId.startsWith("SpellDamageOnTwoHandWeapon");
    },
  },
  /** `SpellDamageOnWeapon*` — 완드·포커스(셉터는 Cargo에 별도 행 없음). */
  prefix_inc_spell_damage_wand_focus: {
    modGroups: "WeaponCasterDamagePrefix",
    generationType: 1,
    rowMatches: (row: WikiExtractedModTierRowType): boolean => {
      return /^SpellDamageOnWeapon/.test(row.wikiModId);
    },
  },
  /** `IncreasedManaTwoHandWeapon*` — 위키 `staff` 열(스펠 스태프). */
  prefix_max_mana_staff: {
    modGroups: "IncreasedMana",
    generationType: 1,
    rowMatches: (row: WikiExtractedModTierRowType): boolean => {
      return row.wikiModId.startsWith("IncreasedManaTwoHandWeapon");
    },
  },
  prefix_spell_damage_and_mana_staff: {
    modGroups: "SpellDamageAndMana",
    generationType: 1,
    rowMatches: (row: WikiExtractedModTierRowType): boolean => {
      return row.wikiModId.startsWith("SpellDamageAndManaOnTwoHandWeapon");
    },
  },
  prefix_spell_damage_and_mana_wand_focus: {
    modGroups: "SpellDamageAndMana",
    generationType: 1,
    rowMatches: (row: WikiExtractedModTierRowType): boolean => {
      return /^SpellDamageAndManaOnWeapon/.test(row.wikiModId);
    },
  },
  prefix_inc_weapon_fire_damage_staff: {
    modGroups: "WeaponDamageTypePrefix",
    generationType: 1,
    rowMatches: (row: WikiExtractedModTierRowType): boolean => {
      return row.wikiModId.startsWith("FireDamagePrefixOnTwoHandWeapon");
    },
  },
  prefix_inc_weapon_cold_damage_staff: {
    modGroups: "WeaponDamageTypePrefix",
    generationType: 1,
    rowMatches: (row: WikiExtractedModTierRowType): boolean => {
      return row.wikiModId.startsWith("ColdDamagePrefixOnTwoHandWeapon");
    },
  },
  prefix_inc_weapon_lightning_damage_staff: {
    modGroups: "WeaponDamageTypePrefix",
    generationType: 1,
    rowMatches: (row: WikiExtractedModTierRowType): boolean => {
      return row.wikiModId.startsWith("LightningDamagePrefixOnTwoHandWeapon");
    },
  },
  prefix_inc_weapon_phys_damage_staff: {
    modGroups: "WeaponDamageTypePrefix",
    generationType: 1,
    rowMatches: (row: WikiExtractedModTierRowType): boolean => {
      return row.wikiModId.startsWith("PhysicalDamagePrefixOnTwoHandWeapon");
    },
  },
  prefix_inc_weapon_chaos_damage_staff: {
    modGroups: "WeaponDamageTypePrefix",
    generationType: 1,
    rowMatches: (row: WikiExtractedModTierRowType): boolean => {
      return row.wikiModId.startsWith("ChaosDamagePrefixOnTwoHandWeapon");
    },
  },
  prefix_gain_as_extra_fire_staff: {
    modGroups: "FireDamage",
    generationType: 1,
    rowMatches: (row: WikiExtractedModTierRowType): boolean => {
      return row.wikiModId.startsWith("SpellDamageGainedAsFireTwoHand");
    },
  },
  prefix_gain_as_extra_cold_staff: {
    modGroups: "ColdDamage",
    generationType: 1,
    rowMatches: (row: WikiExtractedModTierRowType): boolean => {
      return row.wikiModId.startsWith("SpellDamageGainedAsColdTwoHand");
    },
  },
  prefix_gain_as_extra_lightning_staff: {
    modGroups: "LightningDamage",
    generationType: 1,
    rowMatches: (row: WikiExtractedModTierRowType): boolean => {
      return row.wikiModId.startsWith("SpellDamageGainedAsLightningTwoHand");
    },
  },
  suffix_intelligence: { modGroups: "Intelligence", generationType: 2 },
  suffix_fire_res: { modGroups: "FireResistance", generationType: 2 },
  suffix_cold_res: { modGroups: "ColdResistance", generationType: 2 },
  suffix_lightning_res: { modGroups: "LightningResistance", generationType: 2 },
  suffix_chaos_res: { modGroups: "ChaosResistance", generationType: 2 },
  suffix_reduced_attr_req: { modGroups: "LocalAttributeRequirements", generationType: 2 },
  suffix_stun_threshold: { modGroups: "StunThreshold", generationType: 2 },
  suffix_crit_chance: {
    modGroups: "CriticalStrikeChanceIncrease",
    generationType: 2,
    rowMatches: wikiRow.criticalStrikeChanceGlobalHelmetAmulet,
  },
  suffix_life_regen: {
    modGroups: "LifeRegeneration",
    generationType: 2,
    rowMatches: wikiRow.lifeRegenerationPlayerSuffix,
  },
  suffix_reduced_bleed_duration: {
    modGroups: "ReducedAilmentDuration",
    generationType: 2,
    rowMatches: wikiRow.reducedAilmentBleed,
  },
  suffix_reduced_poison_duration: {
    modGroups: "ReducedAilmentDuration",
    generationType: 2,
    rowMatches: wikiRow.reducedAilmentPoison,
  },
  suffix_reduced_ignite_duration: {
    modGroups: "ReducedAilmentDuration",
    generationType: 2,
    rowMatches: wikiRow.reducedAilmentIgnite,
  },
  suffix_es_recharge_rate: { modGroups: "EnergyShieldDelay", generationType: 2 },
  suffix_strength: { modGroups: "Strength", generationType: 2 },
  suffix_dexterity: { modGroups: "Dexterity", generationType: 2 },
  suffix_melee_skill_levels: {
    modGroups: "IncreaseSocketedGemLevel",
    generationType: 2,
    rowMatches: (row: WikiExtractedModTierRowType): boolean => {
      return (
        wikiRow.meleeSocketedOnly(row) && wikiRow.wikiModExcludeTwoHandVariant(row)
      );
    },
  },
  suffix_minion_spell_gem_level: {
    modGroups: "IncreaseSocketedGemLevel",
    generationType: 2,
    rowMatches: wikiRow.minionGlobalSocketedGemSkill,
  },
  suffix_life_leech_from_phys: {
    modGroups: "LifeLeech",
    generationType: 2,
    rowMatches: wikiRow.lifeLeechAttack,
  },
  suffix_mana_leech_from_phys: {
    modGroups: "ManaLeech",
    generationType: 2,
    rowMatches: wikiRow.manaLeechAttack,
  },
  suffix_life_on_hit: { modGroups: "LifeGainPerTarget", generationType: 2 },
  suffix_life_on_kill: { modGroups: "LifeGainedFromEnemyDeath", generationType: 2 },
  suffix_mana_on_kill: { modGroups: "ManaGainedFromEnemyDeath", generationType: 2 },
  suffix_attack_speed: { modGroups: "IncreasedAttackSpeed", generationType: 2 },
  suffix_crit_damage_bonus: {
    modGroups: "CriticalStrikeMultiplier",
    generationType: 2,
    rowMatches: wikiRow.critMultGlobal,
  },
  prefix_item_rarity: { modGroups: "ItemFoundRarityIncreasePrefix", generationType: 1 },
  suffix_item_rarity: { modGroups: "ItemFoundRarityIncrease", generationType: 2 },
  suffix_armour_to_elemental: { modGroups: "ArmourAppliesToElementalDamage", generationType: 2 },
};
