import fs from "fs";
import path from "path";

import {
  BASE_ITEM_SUB_TYPES_BY_EQUIPMENT,
} from "@/lib/poe2-item-simulator/baseItemDb";
import { POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE } from "@/lib/poe2db/poe2dbItemClassSlugs";
import { extractPoe2dbBaseItemTagsFromDetailHtml } from "@/lib/poe2db/poe2dbBaseItemTagsFromHtml";
import {
  ARMOUR_SUB_TYPES_WITH_POE2DB_STAT_PAGE,
  buildPoe2DbStatAffinitySourceSlug,
  DB_ARMOUR_STAT_AFFINITY_VALUES,
} from "@/lib/poe2db/poe2dbStatAffinityPages";

import {
  isExtractDebug,
  logExtractDebugBlock,
  previewJson,
  truncateText,
} from "./extract-debug";

const ROOT = process.cwd();
const OUT_JSON = path.join(
  ROOT,
  "src/lib/poe2-item-simulator/data/poe2dbBaseItems.generated.json",
);
const LOCALES = ["en", "ko", "ja", "zh-CN"] as const;

const POE2DB_LOCALE = "kr";
const POE2DB_ORIGIN = "https://poe2db.tw";

const FETCH_HEADERS: HeadersInit = {
  "User-Agent": "poe2_craft-poe2db-base-items/1.0 (+https://github.com/)",
  Accept: "text/html,application/xhtml+xml",
};
const FETCH_TIMEOUT_MS = 20000;
const DELAY_MS = 130;

const delay = async (ms: number): Promise<void> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
};

const fetchWithTimeout = async (url: string, init: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const fetchText = async (url: string): Promise<string> => {
  const response = await fetchWithTimeout(url, { headers: FETCH_HEADERS });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }
  return await response.text();
};

/** PoE2DB list `whiteitem` CSS class per internal subtype (excludes SoulCore, etc.). */
const WHITEITEM_CLASS_BY_SUB_TYPE: Readonly<Record<IBaseItemSubTypeType, string>> = {
  claw: "Claw",
  dagger: "Dagger",
  wand: "Wand",
  oneHandSword: "OneHandSword",
  oneHandAxe: "OneHandAxe",
  oneHandMace: "OneHandMace",
  sceptre: "Sceptre",
  spear: "Spear",
  flail: "Flail",
  bow: "Bow",
  staff: "Staff",
  twoHandSword: "TwoHandSword",
  twoHandAxe: "TwoHandAxe",
  twoHandMace: "TwoHandMace",
  quarterstaff: "Warstaff",
  fishingRod: "FishingRod",
  crossbow: "Crossbow",
  trap: "TrapTool",
  talisman: "Talisman",
  quiver: "Quiver",
  shield: "Shield",
  buckler: "Buckler",
  focus: "Focus",
  gloves: "Gloves",
  boots: "Boots",
  bodyArmour: "BodyArmour",
  helmet: "Helmet",
  amulet: "Amulet",
  ring: "Ring",
  belt: "Belt",
};

const ITEM_CLASS_LABEL_BY_SUB_TYPE: Readonly<Record<IBaseItemSubTypeType, string>> = {
  claw: "Claws",
  dagger: "Daggers",
  wand: "Wands",
  oneHandSword: "One Hand Swords",
  oneHandAxe: "One Hand Axes",
  oneHandMace: "One Hand Maces",
  sceptre: "Sceptres",
  spear: "Spears",
  flail: "Flails",
  bow: "Bows",
  staff: "Staves",
  twoHandSword: "Two Hand Swords",
  twoHandAxe: "Two Hand Axes",
  twoHandMace: "Two Hand Maces",
  quarterstaff: "Quarterstaves",
  fishingRod: "Fishing Rods",
  crossbow: "Crossbows",
  trap: "Traps",
  talisman: "Talismans",
  quiver: "Quivers",
  shield: "Shields",
  buckler: "Bucklers",
  focus: "Foci",
  gloves: "Gloves",
  boots: "Boots",
  bodyArmour: "Body Armour",
  helmet: "Helmets",
  amulet: "Amulets",
  ring: "Rings",
  belt: "Belts",
};

const SUB_TYPE_BY_POE2DB_ITEM_CLASS_HREF: Readonly<Record<string, IBaseItemSubTypeType>> = {
  Claws: "claw",
  Daggers: "dagger",
  Wands: "wand",
  One_Hand_Swords: "oneHandSword",
  One_Hand_Axes: "oneHandAxe",
  One_Hand_Maces: "oneHandMace",
  Sceptres: "sceptre",
  Spears: "spear",
  Flails: "flail",
  Bows: "bow",
  Staves: "staff",
  Two_Hand_Swords: "twoHandSword",
  Two_Hand_Axes: "twoHandAxe",
  Two_Hand_Maces: "twoHandMace",
  Quarterstaves: "quarterstaff",
  Fishing_Rods: "fishingRod",
  Crossbows: "crossbow",
  Traps: "trap",
  Talismans: "talisman",
  Quivers: "quiver",
  Shields: "shield",
  Bucklers: "buckler",
  Foci: "focus",
  Gloves: "gloves",
  Boots: "boots",
  Body_Armours: "bodyArmour",
  Helmets: "helmet",
  Amulets: "amulet",
  Rings: "ring",
  Belts: "belt",
};

const EQUIPMENT_TYPE_BY_SUB_TYPE: Readonly<Record<IBaseItemSubTypeType, IBaseItemEquipmentTypeType>> =
  (() => {
    const out: Partial<Record<IBaseItemSubTypeType, IBaseItemEquipmentTypeType>> = {};
    for (const [equipmentType, subTypes] of Object.entries(BASE_ITEM_SUB_TYPES_BY_EQUIPMENT) as [
      IBaseItemEquipmentTypeType,
      readonly IBaseItemSubTypeType[],
    ][]) {
      for (const subType of subTypes) {
        out[subType] = equipmentType;
      }
    }
    return out as Readonly<Record<IBaseItemSubTypeType, IBaseItemEquipmentTypeType>>;
  })();

type FallbackSegmentsType = Readonly<Record<string, ReadonlyArray<string>>>;

/** Extra list URL segments to try after wiki slug (404 or empty list). */
const EXTRA_LIST_SEGMENTS_BY_SUB_TYPE: FallbackSegmentsType = {
  staff: ["Staves", "Staffs", "Staff"],
  bodyArmour: ["Body_Armours", "Body_Armour"],
  helmet: ["Helmets", "Helmet"],
  quarterstaff: ["Quarterstaves", "Quarterstaff"],
  oneHandAxe: ["One_Hand_Axes", "One_Handed_Axes"],
  oneHandMace: ["One_Hand_Maces", "One_Handed_Maces"],
  oneHandSword: ["One_Hand_Swords", "One_Handed_Swords"],
  twoHandAxe: ["Two_Hand_Axes", "Two_Handed_Axes"],
  twoHandMace: ["Two_Hand_Maces", "Two_Handed_Maces"],
  twoHandSword: ["Two_Hand_Swords", "Two_Handed_Swords"],
  wand: ["Wands", "Wand"],
  crossbow: ["Crossbows", "Crossbow"],
  bow: ["Bows", "Bow"],
  quiver: ["Quivers", "Quiver"],
  shield: ["Shields", "Shield"],
  buckler: ["Bucklers", "Buckler"],
  focus: ["Foci", "Focus"],
  gloves: ["Gloves"],
};

/**
 * PoE2DB 목록 순회 우선순위 (요청: 마법봉·한손 철퇴·…·허리띠 등 → 나머지 부위).
 * @see ITEM_CLASS_LABEL_KO_PRIORITY_BY_SUB_TYPE — 같은 순서의 한글 주석.
 */
const SUB_TYPES_PRIORITY_ORDER: readonly IBaseItemSubTypeType[] = [
  "wand",
  "oneHandMace",
  "sceptre",
  "spear",
  "bow",
  "twoHandMace",
  "quarterstaff",
  "crossbow",
  "talisman",
  "quiver",
  "buckler",
  "focus",
  "amulet",
  "ring",
  "belt",
];

const ITEM_CLASS_LABEL_KO_PRIORITY_BY_SUB_TYPE: Readonly<
  Partial<Record<IBaseItemSubTypeType, string>>
> = {
  wand: "마법봉",
  oneHandMace: "한손 철퇴",
  sceptre: "셉터",
  spear: "창",
  bow: "활",
  twoHandMace: "양손 철퇴",
  quarterstaff: "육척봉",
  crossbow: "쇠뇌",
  talisman: "부적",
  quiver: "화살통",
  buckler: "버클러",
  focus: "집중구",
  amulet: "목걸이",
  ring: "반지",
  belt: "허리띠",
};

const ORDERED_SUB_TYPES: readonly IBaseItemSubTypeType[] = (() => {
  const defaultFlat = Object.values(BASE_ITEM_SUB_TYPES_BY_EQUIPMENT).flat() as IBaseItemSubTypeType[];
  const seen = new Set<IBaseItemSubTypeType>();
  const out: IBaseItemSubTypeType[] = [];
  for (const st of SUB_TYPES_PRIORITY_ORDER) {
    if (!seen.has(st)) {
      seen.add(st);
      out.push(st);
    }
  }
  for (const st of defaultFlat) {
    if (!seen.has(st)) {
      seen.add(st);
      out.push(st);
    }
  }
  return out;
})();


const sanitizeEnglishName = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const toSnakeSubType = (value: IBaseItemSubTypeType): string => {
  return value
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

type ListRowType = {
  slug: string;
  koName: string;
  whiteitemClass: string;
  /** HTML after name `</a>` until next list anchor (exclusive). */
  rowHtml: string;
};

const extractListRows = (html: string, allowedWhiteitemClass: string): ListRowType[] => {
  const escaped = escapeRegex(allowedWhiteitemClass);
  const anchorRe = new RegExp(
    `class="flex-grow-1 ms-2"><a class="whiteitem ${escaped}"[^>]*href="([^"]+)"[^>]*>([^<]+)</a>`,
    "g",
  );
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null = anchorRe.exec(html);
  while (match !== null) {
    matches.push(match);
    match = anchorRe.exec(html);
  }

  const rows: ListRowType[] = [];
  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i];
    const slug = current[1]?.trim() ?? "";
    const koName = current[2]?.trim() ?? "";
    if (slug.length === 0 || koName.length === 0) {
      continue;
    }
    const start = current.index + current[0].length;
    const end =
      i + 1 < matches.length ? matches[i + 1].index : Math.min(start + 8000, html.length);
    rows.push({
      slug,
      koName,
      whiteitemClass: allowedWhiteitemClass,
      rowHtml: html.slice(start, end),
    });
  }
  return rows;
};

const parseRequirementNumbers = (reqInnerHtml: string): {
  level: number;
  str: number;
  dex: number;
  int: number;
} => {
  let level = 1;
  let str = 0;
  let dex = 0;
  let int = 0;
  const levelMatch = reqInnerHtml.match(/레벨\s*(\d+)/);
  if (levelMatch !== null && levelMatch[1] !== undefined) {
    level = Number.parseInt(levelMatch[1], 10);
    if (Number.isNaN(level)) {
      level = 1;
    }
  }
  const strMatch = reqInnerHtml.match(/(\d+)\s*힘/);
  if (strMatch !== null && strMatch[1] !== undefined) {
    str = Number.parseInt(strMatch[1], 10) || 0;
  }
  const dexMatch = reqInnerHtml.match(/(\d+)\s*민첩/);
  if (dexMatch !== null && dexMatch[1] !== undefined) {
    dex = Number.parseInt(dexMatch[1], 10) || 0;
  }
  const intMatch = reqInnerHtml.match(/(\d+)\s*지능/);
  if (intMatch !== null && intMatch[1] !== undefined) {
    int = Number.parseInt(intMatch[1], 10) || 0;
  }
  return { level, str, dex, int };
};

const parseRequirementsFromHtmlSlice = (
  slice: string,
): { level: number; str: number; dex: number; int: number } => {
  const requirementsMatch = slice.match(/<div class="requirements">([\s\S]*?)<\/div>/);
  if (requirementsMatch !== null && requirementsMatch[1] !== undefined) {
    return parseRequirementNumbers(requirementsMatch[1]);
  }
  return { level: 1, str: 0, dex: 0, int: 0 };
};

const extractActiveTabHtml = (html: string): string => {
  const start = html.indexOf('class="tab-pane fade show active"');
  if (start === -1) {
    return html;
  }
  const after = html.slice(start);
  const uniqueIdx = after.indexOf('<div id="고유"');
  const fallbackEnd = after.indexOf('<div class="card mb-1">');
  const endIdx = uniqueIdx !== -1 ? uniqueIdx : fallbackEnd;
  return endIdx === -1 ? after : after.slice(0, endIdx);
};

type WeaponLikeStatsParseType = {
  physicalDamageMin?: number;
  physicalDamageMax?: number;
  criticalStrikeChancePercent?: number;
  attacksPerSecond?: number;
  weaponRange?: number;
  reloadTimeSeconds?: number;
  blockChancePercent?: number;
  spellDamageIncreasedPercentMin?: number;
  spellDamageIncreasedPercentMax?: number;
};

const stripHtmlToPlainTextKo = (html: string): string => {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .trim();
};

const extractPropertyLinesKo = (statsInnerHtml: string): string[] => {
  const lines: string[] = [];
  const re = /<div class="property">([\s\S]*?)<\/div>/g;
  let match: RegExpExecArray | null = re.exec(statsInnerHtml);
  while (match !== null) {
    const inner = match[1]?.trim() ?? "";
    if (inner.length > 0) {
      const plain = stripHtmlToPlainTextKo(inner);
      if (plain.length > 0) {
        lines.push(plain);
      }
    }
    match = re.exec(statsInnerHtml);
  }
  return lines;
};

const extractRequirementsLineKo = (statsInnerHtml: string): string | null => {
  const m = statsInnerHtml.match(/<div class="requirements">([\s\S]*?)<\/div>/);
  if (m === null || m[1] === undefined) {
    return null;
  }
  const plain = stripHtmlToPlainTextKo(m[1]);
  return plain.length > 0 ? plain : null;
};

/**
 * PoE2DB item-box `Stats` — `property` → `requirements` → `implicitMod` 순서의 평문 줄.
 */
const extractOrderedStatsBoxLinesKo = (statsInnerHtml: string): string[] => {
  const lines: string[] = [];
  const re =
    /<div class="(property|requirements|implicitMod)">([\s\S]*?)<\/div>/g;
  let match: RegExpExecArray | null = re.exec(statsInnerHtml);
  while (match !== null) {
    const inner = match[2]?.trim() ?? "";
    if (inner.length > 0) {
      const plain = stripHtmlToPlainTextKo(inner);
      if (plain.length > 0) {
        lines.push(plain);
      }
    }
    match = re.exec(statsInnerHtml);
  }
  return lines;
};

const parseSpellDamageIncreasedPercentFromPlainLines = (
  lines: readonly string[],
): { min?: number; max?: number } => {
  for (const line of lines) {
    const rangeMatch = line.match(
      /주문\s*피해\s*\(?([\d]+)\s*[—\-]\s*([\d]+)\)?\s*%?\s*증가/,
    );
    if (rangeMatch !== null && rangeMatch[1] !== undefined && rangeMatch[2] !== undefined) {
      const a = Number.parseInt(rangeMatch[1], 10);
      const b = Number.parseInt(rangeMatch[2], 10);
      if (!Number.isNaN(a) && !Number.isNaN(b)) {
        return { min: Math.min(a, b), max: Math.max(a, b) };
      }
    }
    const singleMatch = line.match(/주문\s*피해\s*([\d.]+)\s*%?\s*증가/);
    if (singleMatch !== null && singleMatch[1] !== undefined) {
      const v = Number.parseFloat(singleMatch[1]);
      if (!Number.isNaN(v)) {
        return { min: v, max: v };
      }
    }
  }
  return {};
};

/**
 * HTML 파싱이 빠졌을 때 `property` 평문(물리 피해: 7-12 등)으로 수치 보강.
 */
const enrichWeaponStatsFromPropertyLinesKo = (
  lines: readonly string[],
  parsed: WeaponLikeStatsParseType,
): void => {
  for (const raw of lines) {
    const line = raw.trim();
    if (line.length === 0) {
      continue;
    }
    if (parsed.physicalDamageMin === undefined) {
      const phys = line.match(/물리\s*피해:\s*(\d+)\s*-\s*(\d+)/);
      if (phys !== null && phys[1] !== undefined && phys[2] !== undefined) {
        const a = Number.parseInt(phys[1], 10);
        const b = Number.parseInt(phys[2], 10);
        if (!Number.isNaN(a) && !Number.isNaN(b)) {
          parsed.physicalDamageMin = a;
          parsed.physicalDamageMax = b;
        }
      }
    }
    if (parsed.criticalStrikeChancePercent === undefined) {
      const crit = line.match(/치명타\s*명중\s*확률:\s*([\d.]+)\s*%/);
      if (crit !== null && crit[1] !== undefined) {
        const v = Number.parseFloat(crit[1]);
        if (!Number.isNaN(v)) {
          parsed.criticalStrikeChancePercent = v;
        }
      }
    }
    if (parsed.attacksPerSecond === undefined) {
      const aps = line.match(/초당\s*공격\s*횟수:\s*([\d.]+)/);
      if (aps !== null && aps[1] !== undefined) {
        const v = Number.parseFloat(aps[1]);
        if (!Number.isNaN(v)) {
          parsed.attacksPerSecond = v;
        }
      }
    }
    if (parsed.weaponRange === undefined) {
      const wr = line.match(/무기\s*범위:\s*([\d.]+)/);
      if (wr !== null && wr[1] !== undefined) {
        const v = Number.parseFloat(wr[1]);
        if (!Number.isNaN(v)) {
          parsed.weaponRange = v;
        }
      }
    }
    if (parsed.reloadTimeSeconds === undefined) {
      const rel = line.match(/재장전\s*시간:\s*([\d.]+)/);
      if (rel !== null && rel[1] !== undefined) {
        const v = Number.parseFloat(rel[1]);
        if (!Number.isNaN(v)) {
          parsed.reloadTimeSeconds = v;
        }
      }
    }
    if (parsed.blockChancePercent === undefined) {
      const blk = line.match(/막기\s*확률:\s*(\d+)\s*%/);
      if (blk !== null && blk[1] !== undefined) {
        const v = Number.parseInt(blk[1], 10);
        if (!Number.isNaN(v)) {
          parsed.blockChancePercent = v;
        }
      }
    }
    const spellExtra = parseSpellDamageIncreasedPercentFromPlainLines([line]);
    if (
      parsed.spellDamageIncreasedPercentMin === undefined &&
      spellExtra.min !== undefined
    ) {
      parsed.spellDamageIncreasedPercentMin = spellExtra.min;
      parsed.spellDamageIncreasedPercentMax = spellExtra.max ?? spellExtra.min;
    }
  }
};

const parseGrantedSkillGrantLineKo = (
  line: string,
): IBaseItemGrantedSkillKoType | null => {
  const trimmed = line.trim();
  const prefix = "스킬 부여:";
  if (!trimmed.startsWith(prefix)) {
    return null;
  }
  const rest = trimmed.slice(prefix.length).trim();
  const withLevel = rest.match(/^레벨\s+(\d+)\s+(.+)$/);
  if (withLevel !== null && withLevel[1] !== undefined && withLevel[2] !== undefined) {
    const level = Number.parseInt(withLevel[1], 10);
    const nameKo = withLevel[2].trim();
    if (nameKo.length > 0) {
      return Number.isNaN(level) ? { nameKo } : { level, nameKo };
    }
  }
  if (rest.length > 0) {
    return { nameKo: rest };
  }
  return null;
};

const parseGrantedSkillsKoFromImplicitLines = (
  implicitLines: readonly string[],
): IBaseItemGrantedSkillKoType[] => {
  const out: IBaseItemGrantedSkillKoType[] = [];
  for (const line of implicitLines) {
    const parsed = parseGrantedSkillGrantLineKo(line);
    if (parsed !== null) {
      out.push(parsed);
    }
  }
  return out;
};

const extractImplicitModLinesKo = (statsInnerHtml: string): string[] => {
  const lines: string[] = [];
  const re = /<div class="implicitMod">([\s\S]*?)<\/div>/g;
  let match: RegExpExecArray | null = re.exec(statsInnerHtml);
  while (match !== null) {
    const inner = match[1]?.trim() ?? "";
    if (inner.length > 0) {
      const plain = stripHtmlToPlainTextKo(inner);
      if (plain.length > 0) {
        lines.push(plain);
      }
    }
    match = re.exec(statsInnerHtml);
  }
  return lines;
};

/**
 * PoE2DB `kr` weapon / shield Stats: 물리 피해, 치명타, APS, 무기 범위, 막기 확률.
 */
const parseWeaponLikeStatsFromStatsHtml = (statsHtml: string): WeaponLikeStatsParseType => {
  const out: WeaponLikeStatsParseType = {};
  const physMatch = statsHtml.match(
    /colourPhysicalDamage[^>]*>\s*(\d+)\s*-\s*(\d+)\s*<\/span>/,
  );
  if (physMatch !== null && physMatch[1] !== undefined && physMatch[2] !== undefined) {
    out.physicalDamageMin = Number.parseInt(physMatch[1], 10);
    out.physicalDamageMax = Number.parseInt(physMatch[2], 10);
  }
  const critMatch = statsHtml.match(
    /치명타 명중<\/a> 확률:\s*<span[^>]*>\s*([\d.]+)%\s*<\/span>/,
  );
  if (critMatch !== null && critMatch[1] !== undefined) {
    const v = Number.parseFloat(critMatch[1]);
    if (!Number.isNaN(v)) {
      out.criticalStrikeChancePercent = v;
    }
  }
  const apsMatch = statsHtml.match(/초당 공격 횟수:\s*<span[^>]*>\s*([\d.]+)\s*<\/span>/);
  if (apsMatch !== null && apsMatch[1] !== undefined) {
    const v = Number.parseFloat(apsMatch[1]);
    if (!Number.isNaN(v)) {
      out.attacksPerSecond = v;
    }
  }
  const rangeMatch = statsHtml.match(/무기 범위:\s*<span[^>]*>\s*([\d.]+)\s*<\/span>/);
  if (rangeMatch !== null && rangeMatch[1] !== undefined) {
    const v = Number.parseFloat(rangeMatch[1]);
    if (!Number.isNaN(v)) {
      out.weaponRange = v;
    }
  }
  const blockMatch = statsHtml.match(/막기<\/a> 확률:\s*<span[^>]*>\s*(\d+)%\s*<\/span>/);
  if (blockMatch !== null && blockMatch[1] !== undefined) {
    out.blockChancePercent = Number.parseInt(blockMatch[1], 10);
  }
  const reloadMatch = statsHtml.match(/재장전 시간:\s*<span[^>]*>\s*([\d.]+)\s*<\/span>/);
  if (reloadMatch !== null && reloadMatch[1] !== undefined) {
    const v = Number.parseFloat(reloadMatch[1]);
    if (!Number.isNaN(v)) {
      out.reloadTimeSeconds = v;
    }
  }
  const propLines = extractPropertyLinesKo(statsHtml);
  const spellFromProps = parseSpellDamageIncreasedPercentFromPlainLines(propLines);
  if (spellFromProps.min !== undefined) {
    out.spellDamageIncreasedPercentMin = spellFromProps.min;
    out.spellDamageIncreasedPercentMax = spellFromProps.max ?? spellFromProps.min;
  }
  if (out.spellDamageIncreasedPercentMin === undefined) {
    const htmlSpellRange = statsHtml.match(
      /주문<\/a>\s*피해\s*[\s\S]{0,320}?<span[^>]*>\s*\(?([\d]+)\s*[—-]\s*([\d]+)\)?\s*<\/span>\s*%?\s*증가/,
    );
    if (
      htmlSpellRange !== null &&
      htmlSpellRange[1] !== undefined &&
      htmlSpellRange[2] !== undefined
    ) {
      const a = Number.parseInt(htmlSpellRange[1], 10);
      const b = Number.parseInt(htmlSpellRange[2], 10);
      if (!Number.isNaN(a) && !Number.isNaN(b)) {
        out.spellDamageIncreasedPercentMin = Math.min(a, b);
        out.spellDamageIncreasedPercentMax = Math.max(a, b);
      }
    }
  }
  return out;
};

const applyWeaponKeyValFallback = (
  parsed: WeaponLikeStatsParseType,
  keyVals: Map<string, string>,
): void => {
  if (
    parsed.physicalDamageMin === undefined &&
    keyVals.has("Weapon.minimum_damage") &&
    keyVals.has("Weapon.maximum_damage")
  ) {
    const mn = Number.parseInt(keyVals.get("Weapon.minimum_damage") ?? "", 10);
    const mx = Number.parseInt(keyVals.get("Weapon.maximum_damage") ?? "", 10);
    if (!Number.isNaN(mn)) {
      parsed.physicalDamageMin = mn;
    }
    if (!Number.isNaN(mx)) {
      parsed.physicalDamageMax = mx;
    }
  }
  if (parsed.criticalStrikeChancePercent === undefined && keyVals.has("Weapon.critical_chance")) {
    const raw = Number.parseInt(keyVals.get("Weapon.critical_chance") ?? "", 10);
    if (!Number.isNaN(raw)) {
      parsed.criticalStrikeChancePercent = raw / 100;
    }
  }
};

const parseStatsDefences = (
  statsHtml: string,
): { armour?: number; evasion?: number; energyShield?: number } => {
  const out: { armour?: number; evasion?: number; energyShield?: number } = {};
  const armourMatch = statsHtml.match(
    /방어도<\/a>:\s*<span[^>]*>\s*(\d+)\s*<\/span>/,
  );
  if (armourMatch !== null && armourMatch[1] !== undefined) {
    out.armour = Number.parseInt(armourMatch[1], 10);
  }
  const evasionMatch = statsHtml.match(/회피<\/a>:\s*<span[^>]*>\s*(\d+)\s*<\/span>/);
  if (evasionMatch !== null && evasionMatch[1] !== undefined) {
    out.evasion = Number.parseInt(evasionMatch[1], 10);
  }
  const esMatch = statsHtml.match(
    /에너지 보호막<\/a>:\s*<span[^>]*>\s*(\d+)\s*<\/span>/,
  );
  if (esMatch !== null && esMatch[1] !== undefined) {
    out.energyShield = Number.parseInt(esMatch[1], 10);
  }
  return out;
};

const parseStatsRequirements = (
  statsHtml: string,
): { level: number; str: number; dex: number; int: number } | null => {
  const m = statsHtml.match(/<div class="requirements">([\s\S]*?)<\/div>/);
  if (m === null || m[1] === undefined) {
    return null;
  }
  return parseRequirementNumbers(m[1]);
};

const parseKeyValTable = (htmlChunk: string): Map<string, string> => {
  const map = new Map<string, string>();
  const marker = "<th>key</th><th>val</th></tr></thead><tbody>";
  let idx = htmlChunk.indexOf(marker);
  if (idx === -1) {
    return map;
  }
  idx += marker.length;
  const end = htmlChunk.indexOf("</tbody>", idx);
  if (end === -1) {
    return map;
  }
  const body = htmlChunk.slice(idx, end);
  const rowRe = /<tr><td>([^<]*)<\/td><td>([^<]*)<\/td><\/tr>/g;
  let rowMatch: RegExpExecArray | null = rowRe.exec(body);
  while (rowMatch !== null) {
    const key = rowMatch[1]?.trim() ?? "";
    const val = rowMatch[2]?.trim() ?? "";
    if (key.length > 0) {
      map.set(key, val);
    }
    rowMatch = rowRe.exec(body);
  }
  return map;
};

/**
 * First item-box `<div class="Stats">…</div>` inner HTML (nested `<div>`-safe).
 * A naive `*?</div>` match stops at the first inner `</div>` and truncates weapon/jewellery stats.
 */
const extractFirstStatsHtml = (chunk: string): string | null => {
  const marker = '<div class="Stats">';
  const start = chunk.indexOf(marker);
  if (start === -1) {
    return null;
  }
  const contentStart = start + marker.length;
  let pos = contentStart;
  let depth = 1;
  while (pos < chunk.length && depth > 0) {
    const openDiv = chunk.indexOf("<div", pos);
    const closeDiv = chunk.indexOf("</div>", pos);
    if (closeDiv === -1) {
      return null;
    }
    if (openDiv !== -1 && openDiv < closeDiv) {
      depth += 1;
      pos = openDiv + 4;
    } else {
      depth -= 1;
      if (depth === 0) {
        return chunk.slice(contentStart, closeDiv);
      }
      pos = closeDiv + 6;
    }
  }
  return null;
};

const extractEnglishBaseType = (htmlChunk: string): string | null => {
  const re = /<tr><td>BaseType[\s\S]*?<\/td><td>([^<]+)<\/td><\/tr>/g;
  let match: RegExpExecArray | null = re.exec(htmlChunk);
  while (match !== null) {
    const cell = match[1]?.trim() ?? "";
    if (cell.length > 0 && /^[\x20-\x7E]+$/.test(cell)) {
      return cell;
    }
    match = re.exec(htmlChunk);
  }
  return null;
};

const extractItemClassHref = (htmlChunk: string): string | null => {
  const m = htmlChunk.match(
    /<tr><td>Class[\s\S]*?<\/td><td><a class="ItemClasses[^"]*" href="([^"]+)"/,
  );
  return m?.[1] ?? null;
};

const buildStatTags = (
  str: number,
  dex: number,
  int: number,
): ReadonlyArray<IBaseItemStatTagType> => {
  const tags: IBaseItemStatTagType[] = [];
  if (str > 0) {
    tags.push("str");
  }
  if (dex > 0) {
    tags.push("dex");
  }
  if (int > 0) {
    tags.push("int");
  }
  return tags;
};

const resolveListSegments = (subType: IBaseItemSubTypeType): string[] => {
  const primary = POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE[subType];
  const extras = EXTRA_LIST_SEGMENTS_BY_SUB_TYPE[subType] ?? [];
  const ordered: string[] = [];
  const seen = new Set<string>();
  for (const segment of [primary, ...extras]) {
    if (!seen.has(segment)) {
      seen.add(segment);
      ordered.push(segment);
    }
  }
  return ordered;
};

const tryFetchListHtml = async (segments: ReadonlyArray<string>): Promise<string | null> => {
  for (const segment of segments) {
    const url = `${POE2DB_ORIGIN}/${POE2DB_LOCALE}/${segment}`;
    try {
      const html = await fetchText(url);
      await delay(DELAY_MS);
      return html;
    } catch {
      await delay(DELAY_MS);
    }
  }
  return null;
};

type I18nBaseItemRowType = { name: string };

const mergeSimulatorBaseItems = (
  records: readonly IBaseItemDbRecordType[],
  namesByKey: Readonly<Record<string, { en: string; ko: string }>>,
): void => {
  for (const locale of LOCALES) {
    const filePath = path.join(ROOT, "src/i18n", locale, "simulator.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw) as Record<string, unknown>;
    const baseItems =
      typeof data.baseItems === "object" && data.baseItems !== null && !Array.isArray(data.baseItems)
        ? { ...(data.baseItems as Record<string, unknown>) }
        : {};
    for (const record of records) {
      if (baseItems[record.baseItemKey] !== undefined) {
        continue;
      }
      const names = namesByKey[record.baseItemKey];
      let name: string;
      if (locale === "ko") {
        name = names?.ko ?? names?.en ?? record.baseItemKey;
      } else {
        name = names?.en ?? names?.ko ?? record.baseItemKey;
      }
      baseItems[record.baseItemKey] = { name } satisfies I18nBaseItemRowType;
    }
    data.baseItems = baseItems;
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }
};

const run = async (): Promise<void> => {
  const records: IBaseItemDbRecordType[] = [];
  const namesByKey: Record<string, { en: string; ko: string }> = {};
  const baseItemKeyCount = new Map<string, number>();
  const globalSeenSlugs = new Set<string>();
  const warnings: string[] = [];
  let debugListSampleLogged = false;
  let debugDetailSampleLogged = false;

  if (isExtractDebug()) {
    console.log(
      "[EXTRACT_DEBUG] 첫 목록·첫 상세 페이지 응답 형식을 콘솔에 샘플로 출력합니다. 비활성: EXTRACT_DEBUG 미설정.",
    );
  }

  for (const subType of ORDERED_SUB_TYPES) {
    const priorityKoLabel =
      ITEM_CLASS_LABEL_KO_PRIORITY_BY_SUB_TYPE[
        subType as keyof typeof ITEM_CLASS_LABEL_KO_PRIORITY_BY_SUB_TYPE
      ];
    if (priorityKoLabel !== undefined) {
      console.log(`[poe2db-base-items] ${priorityKoLabel} (${subType})`);
    }
    const whiteitemClass = WHITEITEM_CLASS_BY_SUB_TYPE[subType];
    const rows: ListRowType[] = [];

    if (ARMOUR_SUB_TYPES_WITH_POE2DB_STAT_PAGE.includes(subType)) {
      const slugMerge = new Set<string>();
      for (const affinity of DB_ARMOUR_STAT_AFFINITY_VALUES) {
        const segment = buildPoe2DbStatAffinitySourceSlug(subType, affinity);
        if (segment === null) {
          continue;
        }
        let listHtml: string;
        try {
          listHtml = await fetchText(`${POE2DB_ORIGIN}/${POE2DB_LOCALE}/${segment}`);
          await delay(DELAY_MS);
        } catch {
          warnings.push(`no-stat-list: ${subType} ${segment}`);
          continue;
        }
        const rowsRaw = extractListRows(listHtml, whiteitemClass);
        if (isExtractDebug() && !debugListSampleLogged && rowsRaw.length > 0) {
          debugListSampleLogged = true;
          const listUrl = `${POE2DB_ORIGIN}/${POE2DB_LOCALE}/${segment}`;
          const first = rowsRaw[0];
          logExtractDebugBlock(
            "PoE2DB 목록 페이지 (첫 비어 있지 않은 stat 목록)",
            previewJson({
              listUrl,
              subType,
              listHtmlCharLength: listHtml.length,
              rowCountOnPage: rowsRaw.length,
              firstListRow: {
                slug: first.slug,
                koName: first.koName,
                whiteitemClass: first.whiteitemClass,
                rowHtmlCharLength: first.rowHtml.length,
                rowHtmlPreview: truncateText(first.rowHtml, 1500),
              },
            }),
          );
        }
        const seenOnListPage = new Set<string>();
        for (const row of rowsRaw) {
          if (seenOnListPage.has(row.slug)) {
            continue;
          }
          seenOnListPage.add(row.slug);
          if (slugMerge.has(row.slug)) {
            continue;
          }
          slugMerge.add(row.slug);
          rows.push(row);
        }
      }
      if (rows.length === 0) {
        warnings.push(`empty-merged-armour-lists: ${subType}`);
        continue;
      }
    } else {
      const listSegments = resolveListSegments(subType);
      const listHtml = await tryFetchListHtml(listSegments);
      if (listHtml === null) {
        warnings.push(`no-list: ${subType} tried ${listSegments.join(", ")}`);
        continue;
      }
      const rowsRaw = extractListRows(listHtml, whiteitemClass);
      if (isExtractDebug() && !debugListSampleLogged && rowsRaw.length > 0) {
        debugListSampleLogged = true;
        const first = rowsRaw[0];
        logExtractDebugBlock(
          "PoE2DB 목록 페이지 (클래스 목록 첫 성공)",
          previewJson({
            listSegmentsTried: listSegments,
            subType,
            listHtmlCharLength: listHtml.length,
            rowCountOnPage: rowsRaw.length,
            firstListRow: {
              slug: first.slug,
              koName: first.koName,
              whiteitemClass: first.whiteitemClass,
              rowHtmlCharLength: first.rowHtml.length,
              rowHtmlPreview: truncateText(first.rowHtml, 1500),
            },
          }),
        );
      }
      const seenOnListPage = new Set<string>();
      for (const row of rowsRaw) {
        if (seenOnListPage.has(row.slug)) {
          continue;
        }
        seenOnListPage.add(row.slug);
        rows.push(row);
      }
      if (rows.length === 0) {
        warnings.push(`empty-list: ${subType} segment ${listSegments[0]}`);
        continue;
      }
    }

    for (const row of rows) {
      if (globalSeenSlugs.has(row.slug)) {
        warnings.push(`duplicate-slug-skip: ${row.slug} (list ${subType})`);
        continue;
      }
      globalSeenSlugs.add(row.slug);

      const detailUrl = `${POE2DB_ORIGIN}/${POE2DB_LOCALE}/${encodeURIComponent(row.slug)}`;
      let detailHtml: string;
      try {
        detailHtml = await fetchText(detailUrl);
        await delay(DELAY_MS);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        warnings.push(`detail-fail: ${row.slug} ${message}`);
        continue;
      }

      const tabChunk = extractActiveTabHtml(detailHtml);
      const poe2dbTags = extractPoe2dbBaseItemTagsFromDetailHtml(tabChunk);
      const englishName = extractEnglishBaseType(tabChunk);
      if (isExtractDebug() && !debugDetailSampleLogged) {
        debugDetailSampleLogged = true;
        logExtractDebugBlock(
          "PoE2DB 베이스 상세 페이지 (첫 번째 성공 fetch 직후 파싱)",
          previewJson({
            detailUrl,
            listSubType: subType,
            slug: row.slug,
            detailHtmlCharLength: detailHtml.length,
            detailHtmlPreview: truncateText(detailHtml, 2800),
            activeTabChunkCharLength: tabChunk.length,
            activeTabChunkPreview: truncateText(tabChunk, 2800),
            poe2dbTagsFromDetailHtml: poe2dbTags,
            englishBaseType: englishName,
          }),
        );
      }
      if (englishName === null) {
        warnings.push(`no-english-basetype: ${row.slug}`);
        continue;
      }

      const itemClassHref = extractItemClassHref(tabChunk);
      if (itemClassHref === null || itemClassHref.length === 0) {
        warnings.push(`no-item-class-href: ${row.slug}`);
        continue;
      }
      const resolvedSubType = SUB_TYPE_BY_POE2DB_ITEM_CLASS_HREF[itemClassHref];
      if (resolvedSubType === undefined) {
        warnings.push(`unknown-item-class-href: ${itemClassHref} slug=${row.slug}`);
        continue;
      }
      if (resolvedSubType !== subType) {
        warnings.push(`subType-mismatch: list=${subType} detail=${resolvedSubType} slug=${row.slug}`);
        continue;
      }

      const statsHtml = extractFirstStatsHtml(tabChunk);
      const defFromStats =
        statsHtml !== null
          ? parseStatsDefences(statsHtml)
          : { armour: undefined, evasion: undefined, energyShield: undefined };
      const reqFromStats = statsHtml !== null ? parseStatsRequirements(statsHtml) : null;

      const keyVals = parseKeyValTable(tabChunk);
      const strFromKv = Number.parseInt(
        keyVals.get("AttributeRequirements.strength_requirement") ?? "",
        10,
      );
      const dexFromKv = Number.parseInt(
        keyVals.get("AttributeRequirements.dexterity_requirement") ?? "",
        10,
      );
      const intFromKv = Number.parseInt(
        keyVals.get("AttributeRequirements.intelligence_requirement") ?? "",
        10,
      );

      const listReq = parseRequirementsFromHtmlSlice(row.rowHtml);
      const hasListRequirementsBlock = /<div class="requirements">/.test(row.rowHtml);

      let level = 1;
      let str = 0;
      let dex = 0;
      let int = 0;

      if (reqFromStats !== null) {
        level = reqFromStats.level;
        str = reqFromStats.str;
        dex = reqFromStats.dex;
        int = reqFromStats.int;
      } else if (hasListRequirementsBlock) {
        level = listReq.level;
        str = listReq.str;
        dex = listReq.dex;
        int = listReq.int;
      } else {
        if (!Number.isNaN(strFromKv) && keyVals.has("AttributeRequirements.strength_requirement")) {
          str = strFromKv;
        }
        if (!Number.isNaN(dexFromKv) && keyVals.has("AttributeRequirements.dexterity_requirement")) {
          dex = dexFromKv;
        }
        if (!Number.isNaN(intFromKv) && keyVals.has("AttributeRequirements.intelligence_requirement")) {
          int = intFromKv;
        }
        if (keyVals.has("Mods.level_requirement")) {
          const lv = Number.parseInt(keyVals.get("Mods.level_requirement") ?? "", 10);
          if (!Number.isNaN(lv)) {
            level = lv;
          }
        }
      }

      const listDef = extractFirstStatsHtml(row.rowHtml);
      let armour = defFromStats.armour;
      let evasion = defFromStats.evasion;
      let energyShield = defFromStats.energyShield;
      if (listDef !== null) {
        const fromList = parseStatsDefences(listDef);
        armour = armour ?? fromList.armour;
        evasion = evasion ?? fromList.evasion;
        energyShield = energyShield ?? fromList.energyShield;
      }

      const propertyLinesDetail =
        statsHtml !== null ? extractPropertyLinesKo(statsHtml) : [];
      const propertyLinesList =
        listDef !== null ? extractPropertyLinesKo(listDef) : [];

      const weaponFromDetail =
        statsHtml !== null ? parseWeaponLikeStatsFromStatsHtml(statsHtml) : {};
      const weaponFromList =
        listDef !== null ? parseWeaponLikeStatsFromStatsHtml(listDef) : {};
      const weaponMerged: WeaponLikeStatsParseType = {
        physicalDamageMin: weaponFromDetail.physicalDamageMin ?? weaponFromList.physicalDamageMin,
        physicalDamageMax: weaponFromDetail.physicalDamageMax ?? weaponFromList.physicalDamageMax,
        criticalStrikeChancePercent:
          weaponFromDetail.criticalStrikeChancePercent ??
          weaponFromList.criticalStrikeChancePercent,
        attacksPerSecond: weaponFromDetail.attacksPerSecond ?? weaponFromList.attacksPerSecond,
        weaponRange: weaponFromDetail.weaponRange ?? weaponFromList.weaponRange,
        reloadTimeSeconds: weaponFromDetail.reloadTimeSeconds ?? weaponFromList.reloadTimeSeconds,
        blockChancePercent: weaponFromDetail.blockChancePercent ?? weaponFromList.blockChancePercent,
        spellDamageIncreasedPercentMin:
          weaponFromDetail.spellDamageIncreasedPercentMin ??
          weaponFromList.spellDamageIncreasedPercentMin,
        spellDamageIncreasedPercentMax:
          weaponFromDetail.spellDamageIncreasedPercentMax ??
          weaponFromList.spellDamageIncreasedPercentMax,
      };
      enrichWeaponStatsFromPropertyLinesKo(
        [...propertyLinesDetail, ...propertyLinesList],
        weaponMerged,
      );
      applyWeaponKeyValFallback(weaponMerged, keyVals);

      const implicitDetail =
        statsHtml !== null ? extractImplicitModLinesKo(statsHtml) : [];
      const implicitList =
        listDef !== null ? extractImplicitModLinesKo(listDef) : [];
      const implicitModLinesKo =
        implicitDetail.length > 0 ? implicitDetail : implicitList;

      const propertyLinesKo =
        propertyLinesDetail.length > 0 ? propertyLinesDetail : propertyLinesList;

      const requirementsLineDetail =
        statsHtml !== null ? extractRequirementsLineKo(statsHtml) : null;
      const requirementsLineList =
        listDef !== null ? extractRequirementsLineKo(listDef) : null;
      const requirementsLineKo = requirementsLineDetail ?? requirementsLineList;

      const itemStatsLinesDetail =
        statsHtml !== null ? extractOrderedStatsBoxLinesKo(statsHtml) : [];
      const itemStatsLinesList =
        listDef !== null ? extractOrderedStatsBoxLinesKo(listDef) : [];
      const itemStatsLinesKo =
        itemStatsLinesDetail.length > 0 ? itemStatsLinesDetail : itemStatsLinesList;

      const grantedSkillsKo = parseGrantedSkillsKoFromImplicitLines(implicitModLinesKo);

      const subToken = toSnakeSubType(subType);
      const namePart = sanitizeEnglishName(englishName);
      let baseItemKey = `${subToken}_${namePart}`;
      const prev = baseItemKeyCount.get(baseItemKey) ?? 0;
      baseItemKeyCount.set(baseItemKey, prev + 1);
      if (prev > 0) {
        baseItemKey = `${baseItemKey}_${prev + 1}`;
      }

      const equipmentType = EQUIPMENT_TYPE_BY_SUB_TYPE[subType];
      const record: IBaseItemDbRecordType = {
        baseItemKey,
        itemClass: ITEM_CLASS_LABEL_BY_SUB_TYPE[subType],
        itemClassKey: subType,
        equipmentType,
        subType,
        requiredStrength: str,
        requiredDexterity: dex,
        requiredIntelligence: int,
        levelRequirement: level,
        /** 요구 스탯 유도값(참고). 앱 모드 필터는 PoE2DB `tags` 기반으로 처리한다. */
        statTags: buildStatTags(str, dex, int),
        ...(poe2dbTags.length > 0 ? { tags: poe2dbTags } : {}),
        source: "poe2db",
        sourceUrl: detailUrl,
      };
      if (armour !== undefined && !Number.isNaN(armour)) {
        record.armour = armour;
      }
      if (evasion !== undefined && !Number.isNaN(evasion)) {
        record.evasion = evasion;
      }
      if (energyShield !== undefined && !Number.isNaN(energyShield)) {
        record.energyShield = energyShield;
      }
      if (weaponMerged.physicalDamageMin !== undefined && !Number.isNaN(weaponMerged.physicalDamageMin)) {
        record.physicalDamageMin = weaponMerged.physicalDamageMin;
      }
      if (weaponMerged.physicalDamageMax !== undefined && !Number.isNaN(weaponMerged.physicalDamageMax)) {
        record.physicalDamageMax = weaponMerged.physicalDamageMax;
      }
      if (
        weaponMerged.criticalStrikeChancePercent !== undefined &&
        !Number.isNaN(weaponMerged.criticalStrikeChancePercent)
      ) {
        record.criticalStrikeChancePercent = weaponMerged.criticalStrikeChancePercent;
      }
      if (weaponMerged.attacksPerSecond !== undefined && !Number.isNaN(weaponMerged.attacksPerSecond)) {
        record.attacksPerSecond = weaponMerged.attacksPerSecond;
      }
      if (weaponMerged.weaponRange !== undefined && !Number.isNaN(weaponMerged.weaponRange)) {
        record.weaponRange = weaponMerged.weaponRange;
      }
      if (weaponMerged.reloadTimeSeconds !== undefined && !Number.isNaN(weaponMerged.reloadTimeSeconds)) {
        record.reloadTimeSeconds = weaponMerged.reloadTimeSeconds;
      }
      if (weaponMerged.blockChancePercent !== undefined && !Number.isNaN(weaponMerged.blockChancePercent)) {
        record.blockChancePercent = weaponMerged.blockChancePercent;
      }
      if (
        weaponMerged.spellDamageIncreasedPercentMin !== undefined &&
        !Number.isNaN(weaponMerged.spellDamageIncreasedPercentMin)
      ) {
        record.spellDamageIncreasedPercentMin = weaponMerged.spellDamageIncreasedPercentMin;
      }
      if (
        weaponMerged.spellDamageIncreasedPercentMax !== undefined &&
        !Number.isNaN(weaponMerged.spellDamageIncreasedPercentMax)
      ) {
        record.spellDamageIncreasedPercentMax = weaponMerged.spellDamageIncreasedPercentMax;
      }
      if (implicitModLinesKo.length > 0) {
        record.implicitModLinesKo = implicitModLinesKo;
      }
      if (grantedSkillsKo.length > 0) {
        record.grantedSkillsKo = grantedSkillsKo;
      }
      if (itemStatsLinesKo.length > 0) {
        record.itemStatsLinesKo = itemStatsLinesKo;
      }
      if (propertyLinesKo.length > 0) {
        record.propertyLinesKo = propertyLinesKo;
      }
      if (requirementsLineKo !== null && requirementsLineKo.length > 0) {
        record.requirementsLineKo = requirementsLineKo;
      }

      records.push(record);
      namesByKey[record.baseItemKey] = { en: englishName, ko: row.koName };
    }
  }

  const payload: IBaseItemDbType = {
    version: "2026.03.poe2db.extract.v5",
    records,
  };
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(payload.records, null, 2)}\n`, "utf8");

  mergeSimulatorBaseItems(records, namesByKey);

  console.log(`Wrote ${OUT_JSON} (${records.length} records).`);
  if (warnings.length > 0) {
    console.warn(`Warnings (${warnings.length}):`);
    for (const line of warnings.slice(0, 40)) {
      console.warn(`  ${line}`);
    }
    if (warnings.length > 40) {
      console.warn(`  … ${warnings.length - 40} more`);
    }
  }
};

void run();
