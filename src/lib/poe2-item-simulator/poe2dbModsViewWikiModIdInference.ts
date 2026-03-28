/**
 * PoE2DB `ModsView` `normal` 행 → 위키 Cargo `mods.id` 추론.
 * `Code`가 없을 때만(접두/접미 이름만 있는 행) 사용한다.
 */

export type Poe2DbModsViewRowForInferenceType = {
  Code?: string;
  Name?: string;
  Level?: string | number;
  ModGenerationTypeID?: string | number;
  ModFamilyList?: string[];
  str?: string;
  spawn_no?: string[];
  DropChance?: string | number;
};

/** `CriticalStrikeChance1`…`6` — Amulet/Helmets `normal`과 동일 요구 레벨. */
const GLOBAL_CRIT_CHANCE_LEVEL_TO_TIER: ReadonlyArray<readonly [number, number]> = [
  [5, 1],
  [20, 2],
  [30, 3],
  [44, 4],
  [58, 5],
  [72, 6],
];

/** `AttackCriticalStrikeChance1`…`6` — Quiver 등과 동일 레벨 스케일. */
const ATTACK_CRIT_CHANCE_LEVEL_TO_TIER = GLOBAL_CRIT_CHANCE_LEVEL_TO_TIER;

/** `TrapCriticalStrikeChance1`…`6` — 함정 전용 레벨. */
const TRAP_CRIT_CHANCE_LEVEL_TO_TIER: ReadonlyArray<readonly [number, number]> = [
  [11, 1],
  [21, 2],
  [28, 3],
  [41, 4],
  [59, 5],
  [76, 6],
];

/** `LocalCriticalStrikeChance1`…`6` — 한손 무기 등 지역 치명타 확률. */
const LOCAL_CRIT_CHANCE_LEVEL_TO_TIER: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [20, 2],
  [30, 3],
  [44, 4],
  [59, 5],
  [73, 6],
];

/** `GlobalMinionSpellSkillGemLevelWeapon1`…`5` — 요구 레벨 → 티어 번호. */
const MINION_WEAPON_LEVEL_TO_TIER: ReadonlyArray<readonly [number, number]> = [
  [2, 1],
  [25, 2],
  [55, 3],
  [78, 4],
  [81, 5],
];

const tierFromLevels = (level: number, table: ReadonlyArray<readonly [number, number]>): number | null => {
  for (const [req, tier] of table) {
    if (req === level) {
      return tier;
    }
  }
  return null;
};

const parseIntSafeLocal = (value: string, fallback: number): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parsePositiveInt = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value !== "string") {
    return null;
  }
  const parsed = Number.parseInt(value.replace(/,/g, "").trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseMinionPlusFromStr = (str: string): number | null => {
  const m = str.match(/mod-value['"]>([+][0-9]+)</);
  if (m === null || m[1] === undefined) {
    return null;
  }
  return parseIntSafeLocal(m[1].replace("+", ""), 0);
};

/**
 * `normal` 섹션 한 행에서 위키 `wikiModId`를 추론한다. 추론 불가면 `null`.
 */
export const inferWikiModIdFromPoe2DbModsViewNormalRow = (
  row: Poe2DbModsViewRowForInferenceType,
): string | null => {
  const code = typeof row.Code === "string" ? row.Code.trim() : "";
  if (code.length > 0 && /^[A-Za-z_]/.test(code)) {
    return code;
  }

  const gen = parsePositiveInt(row.ModGenerationTypeID);
  if (gen === null || gen !== 2) {
    return null;
  }

  const families = row.ModFamilyList ?? [];
  const fam = families[0];
  const str = typeof row.str === "string" ? row.str : "";
  const spawn = Array.isArray(row.spawn_no) ? row.spawn_no : [];
  const level = parsePositiveInt(row.Level);
  if (level === null) {
    return null;
  }

  if (fam === "CriticalStrikeChanceIncrease") {
    if (spawn.includes("quiver") && !spawn.includes("helmet")) {
      const tier = tierFromLevels(level, ATTACK_CRIT_CHANCE_LEVEL_TO_TIER);
      return tier === null ? null : `AttackCriticalStrikeChance${String(tier)}`;
    }
    if (spawn.includes("trap")) {
      const tier = tierFromLevels(level, TRAP_CRIT_CHANCE_LEVEL_TO_TIER);
      return tier === null ? null : `TrapCriticalStrikeChance${String(tier)}`;
    }
    if (spawn.includes("weapon") && !spawn.includes("helmet")) {
      const tier = tierFromLevels(level, LOCAL_CRIT_CHANCE_LEVEL_TO_TIER);
      return tier === null ? null : `LocalCriticalStrikeChance${String(tier)}`;
    }
    /** 투구+목걸이 또는 최상위 티만 목걸이(`CriticalStrikeChance6`). */
    if (
      spawn.includes("amulet") &&
      !spawn.includes("quiver") &&
      !spawn.includes("weapon") &&
      !spawn.includes("trap")
    ) {
      const tier = tierFromLevels(level, GLOBAL_CRIT_CHANCE_LEVEL_TO_TIER);
      return tier === null ? null : `CriticalStrikeChance${String(tier)}`;
    }
    return null;
  }

  if (fam === "IncreaseSocketedGemLevel" && (str.includes("Minion") || str.includes("소환수"))) {
    if (spawn.includes("weapon") && !spawn.includes("helmet")) {
      const tier = tierFromLevels(level, MINION_WEAPON_LEVEL_TO_TIER);
      return tier === null ? null : `GlobalMinionSpellSkillGemLevelWeapon${String(tier)}`;
    }
    const plus = parseMinionPlusFromStr(str);
    if (plus === null || plus < 1 || plus > 3) {
      return null;
    }
    if (!spawn.includes("amulet")) {
      return null;
    }
    /** 최상위 티(+3)는 목걸이만 스폰 — `helmet` 태그 없음. */
    if (plus === 3 && !spawn.includes("helmet")) {
      return "GlobalMinionSpellSkillGemLevel3";
    }
    if (spawn.includes("helmet")) {
      return `GlobalMinionSpellSkillGemLevel${String(plus)}`;
    }
    return null;
  }

  return null;
};
