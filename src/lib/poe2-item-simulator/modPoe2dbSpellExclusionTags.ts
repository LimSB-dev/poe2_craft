/**
 * PoE2 베이스 `tags`의 `no_*_spell_mods` — **`% increased` 원소 피해(WeaponDamageTypePrefix)** 만 배제한다.
 * «피해의 #%를 추가 * 피해로 획득»(SpellDamageGainedAs) 게인 접두는 여기서 막지 않는다.
 */
const MOD_KEY_BLOCKED_WHEN_POE2DB_TAG_PRESENT: Readonly<Record<string, string>> = {
  prefix_inc_weapon_fire_damage_staff: "no_fire_spell_mods",
  prefix_inc_weapon_cold_damage_staff: "no_cold_spell_mods",
  prefix_inc_weapon_lightning_damage_staff: "no_lightning_spell_mods",
  prefix_inc_weapon_phys_damage_staff: "no_physical_spell_mods",
  prefix_inc_weapon_chaos_damage_staff: "no_chaos_spell_mods",
};

export const isModKeyBlockedByPoe2dbSpellExclusionTags = (
  modKey: string,
  poe2dbTags: ReadonlyArray<string> | undefined,
): boolean => {
  if (poe2dbTags === undefined || poe2dbTags.length === 0) {
    return false;
  }
  const blockedTag = MOD_KEY_BLOCKED_WHEN_POE2DB_TAG_PRESENT[modKey];
  return blockedTag !== undefined && poe2dbTags.includes(blockedTag);
};
