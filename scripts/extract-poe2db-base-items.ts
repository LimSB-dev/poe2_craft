import fs from "fs";
import path from "path";

import {
  BASE_ITEM_SUB_TYPES_BY_EQUIPMENT,
} from "@/lib/poe2-item-simulator/baseItemDb";
import { POE2DB_ITEM_CLASS_WIKI_SLUG_BY_SUB_TYPE } from "@/lib/poe2db/poe2dbItemClassSlugs";
import {
  ARMOUR_SUB_TYPES_WITH_POE2DB_STAT_PAGE,
  buildPoe2DbStatAffinitySourceSlug,
  DB_ARMOUR_STAT_AFFINITY_VALUES,
} from "@/lib/poe2db/poe2dbStatAffinityPages";

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

const ORDERED_SUB_TYPES: readonly IBaseItemSubTypeType[] = Object.values(
  BASE_ITEM_SUB_TYPES_BY_EQUIPMENT,
).flat() as IBaseItemSubTypeType[];


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

const extractFirstStatsHtml = (chunk: string): string | null => {
  const m = chunk.match(/<div class="Stats">([\s\S]*?)<\/div>/);
  return m !== null && m[1] !== undefined ? m[1] : null;
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
    const filePath = path.join(ROOT, "src/i18n/messages", locale, "simulator.json");
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

  for (const subType of ORDERED_SUB_TYPES) {
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
      const englishName = extractEnglishBaseType(tabChunk);
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
        statTags: buildStatTags(str, dex, int),
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

      records.push(record);
      namesByKey[record.baseItemKey] = { en: englishName, ko: row.koName };
    }
  }

  const payload: IBaseItemDbType = {
    version: "2026.03.poe2db.extract.v1",
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
