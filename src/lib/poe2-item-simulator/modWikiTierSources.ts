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
};

/**
 * Only non-corrupted `modKey`s we can align with wiki Cargo rows.
 * Corrupted and unmatched keys fall back to synthetic tiers in `getModTierDisplayRows`.
 */
export const MOD_WIKI_TIER_SOURCES: Readonly<
  Partial<Readonly<Record<string, ModWikiTierSourceRuleType>>>
> = {
  prefix_max_life: { modGroups: "IncreasedLife", generationType: 1 },
  prefix_max_es: { modGroups: "IncreasedEnergyShield", generationType: 1 },
  prefix_inc_es: { modGroups: "EnergyShieldPercent", generationType: 1 },
  prefix_inc_es_max_life: {
    modGroups: "BaseLocalDefencesAndLife",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesLifeEsOnly,
  },
  prefix_max_es_inc_es: {
    modGroups: "BaseLocalDefencesAndDefencePercent",
    generationType: 1,
    rowMatches: wikiRow.baseLocalDefencesPctEsFlatEs,
  },
  prefix_phys_thorns: { modGroups: "Thorns", generationType: 1 },
  prefix_spirit: { modGroups: "BaseSpirit", generationType: 1 },
  prefix_max_mana: { modGroups: "IncreasedMana", generationType: 1 },
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
  prefix_added_phys_damage_attack: { modGroups: "PhysicalDamage", generationType: 1 },
  prefix_added_fire_damage_attack: { modGroups: "FireDamage", generationType: 1 },
  prefix_added_cold_damage_attack: { modGroups: "ColdDamage", generationType: 1 },
  prefix_added_lightning_damage_attack: { modGroups: "LightningDamage", generationType: 1 },
  prefix_accuracy: {
    modGroups: "IncreasedAccuracy",
    generationType: 1,
    rowMatches: wikiRow.increasedAccuracyNoLightRadius,
  },
  suffix_intelligence: { modGroups: "Intelligence", generationType: 2 },
  suffix_fire_res: { modGroups: "FireResistance", generationType: 2 },
  suffix_cold_res: { modGroups: "ColdResistance", generationType: 2 },
  suffix_lightning_res: { modGroups: "LightningResistance", generationType: 2 },
  suffix_chaos_res: { modGroups: "ChaosResistance", generationType: 2 },
  suffix_reduced_attr_req: { modGroups: "LocalAttributeRequirements", generationType: 2 },
  suffix_stun_threshold: { modGroups: "StunThreshold", generationType: 2 },
  suffix_life_regen: { modGroups: "LifeRegeneration", generationType: 2 },
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
    rowMatches: wikiRow.meleeSocketedOnly,
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
  suffix_attack_speed: { modGroups: "IncreasedAttackSpeed", generationType: 2 },
  suffix_crit_damage_bonus: {
    modGroups: "CriticalStrikeMultiplier",
    generationType: 2,
    rowMatches: wikiRow.critMultGlobal,
  },
  suffix_item_rarity: { modGroups: "ItemFoundRarityIncrease", generationType: 2 },
  suffix_armour_to_elemental: { modGroups: "ArmourAppliesToElementalDamage", generationType: 2 },
};
