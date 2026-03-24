import fs from "fs";
import path from "path";

import { BASE_ITEM_DB } from "@/lib/poe2-item-simulator/baseItemDb";
import { toBaseItemImageFileSlug } from "@/lib/poe2-item-simulator/baseItemImagePaths";

type CatalogRowType = {
  name?: string;
};

type CatalogType = {
  baseItems?: Record<string, CatalogRowType>;
};

type BaseItemImageMetaRowType = {
  englishDisplayName: string;
  poe2dbSlug: string;
};

type BaseItemImageMetaFileType = Record<string, BaseItemImageMetaRowType>;

const ROOT_DIR = process.cwd();
const OUT_ROOT = path.join(ROOT_DIR, "public/images/items");
const KO_CATALOG_PATH = path.join(ROOT_DIR, "src/i18n/messages/ko/simulator.json");
const META_OUT_PATH = path.join(ROOT_DIR, "data/generated/base-item-image-meta.json");
const REPORT_PATH = path.join(OUT_ROOT, "_download_report.tsv");

const FETCH_HEADERS: HeadersInit = {
  "User-Agent": "poe2_craft-image-sync/1.0 (+https://github.com/)",
  Accept: "text/html,application/xhtml+xml",
};
const FETCH_TIMEOUT_MS = 15000;

const REFERER_POE2DB = "https://poe2db.tw/";

type ItemClassSourceType = {
  listSegment: string;
  whiteitemClass: string;
};

/** poe2db 목록 페이지 경로 (itemClass → URL segment) */
const ITEM_CLASS_SOURCE_BY_ITEM_CLASS: Record<string, ItemClassSourceType> = {
  Gloves: { listSegment: "Gloves", whiteitemClass: "Gloves" },
  "Body Armour": { listSegment: "Body_Armours", whiteitemClass: "BodyArmour" },
  Boots: { listSegment: "Boots", whiteitemClass: "Boots" },
};

type FallbackSourceCandidateType = {
  listSegments: ReadonlyArray<string>;
  whiteitemClasses: ReadonlyArray<string>;
};

/** subtype 폴더 기반 보강 추출용 후보 매핑 (페이지 naming 차이를 허용) */
const FALLBACK_CANDIDATES_BY_SUB_TYPE: Record<string, FallbackSourceCandidateType> = {
  gloves: { listSegments: ["Gloves"], whiteitemClasses: ["Gloves"] },
  bodyArmour: { listSegments: ["Body_Armours", "Body_Armour"], whiteitemClasses: ["BodyArmour"] },
  boots: { listSegments: ["Boots"], whiteitemClasses: ["Boots"] },
  helmet: { listSegments: ["Helmets", "Helmet"], whiteitemClasses: ["Helmets", "Helmet"] },
  amulet: { listSegments: ["Amulets", "Amulet"], whiteitemClasses: ["Amulets", "Amulet"] },
  ring: { listSegments: ["Rings", "Ring"], whiteitemClasses: ["Rings", "Ring"] },
  belt: { listSegments: ["Belts", "Belt"], whiteitemClasses: ["Belts", "Belt"] },
  quiver: { listSegments: ["Quivers", "Quiver"], whiteitemClasses: ["Quivers", "Quiver"] },
  shield: { listSegments: ["Shields", "Shield"], whiteitemClasses: ["Shields", "Shield"] },
  buckler: { listSegments: ["Bucklers", "Buckler"], whiteitemClasses: ["Bucklers", "Buckler"] },
  focus: { listSegments: ["Foci", "Focus"], whiteitemClasses: ["Foci", "Focus"] },
  bow: { listSegments: ["Bows", "Bow"], whiteitemClasses: ["Bows", "Bow"] },
  claw: { listSegments: ["Claws", "Claw"], whiteitemClasses: ["Claws", "Claw"] },
  crossbow: { listSegments: ["Crossbows", "Crossbow"], whiteitemClasses: ["Crossbows", "Crossbow"] },
  dagger: { listSegments: ["Daggers", "Dagger"], whiteitemClasses: ["Daggers", "Dagger"] },
  fishingRod: { listSegments: ["Fishing_Rods", "Fishing_Rod"], whiteitemClasses: ["FishingRod"] },
  flail: { listSegments: ["Flails", "Flail"], whiteitemClasses: ["Flails", "Flail"] },
  oneHandAxe: {
    listSegments: ["One_Hand_Axes", "One_Handed_Axes"],
    whiteitemClasses: ["OneHandAxe", "OneHandedAxe"],
  },
  oneHandMace: {
    listSegments: ["One_Hand_Maces", "One_Handed_Maces"],
    whiteitemClasses: ["OneHandMace", "OneHandedMace"],
  },
  oneHandSword: {
    listSegments: ["One_Hand_Swords", "One_Handed_Swords"],
    whiteitemClasses: ["OneHandSword", "OneHandedSword"],
  },
  quarterstaff: { listSegments: ["Quarterstaves", "Quarterstaff"], whiteitemClasses: ["Quarterstaff"] },
  sceptre: { listSegments: ["Sceptres", "Sceptre"], whiteitemClasses: ["Sceptres", "Sceptre"] },
  spear: { listSegments: ["Spears", "Spear"], whiteitemClasses: ["Spears", "Spear"] },
  staff: { listSegments: ["Staves", "Staffs", "Staff"], whiteitemClasses: ["Staves", "Staff", "Staffs"] },
  talisman: { listSegments: ["Talismans", "Talisman"], whiteitemClasses: ["Talismans", "Talisman"] },
  trap: { listSegments: ["Traps", "Trap"], whiteitemClasses: ["Traps", "Trap"] },
  twoHandAxe: {
    listSegments: ["Two_Hand_Axes", "Two_Handed_Axes"],
    whiteitemClasses: ["TwoHandAxe", "TwoHandedAxe"],
  },
  twoHandMace: {
    listSegments: ["Two_Hand_Maces", "Two_Handed_Maces"],
    whiteitemClasses: ["TwoHandMace", "TwoHandedMace"],
  },
  twoHandSword: {
    listSegments: ["Two_Hand_Swords", "Two_Handed_Swords"],
    whiteitemClasses: ["TwoHandSword", "TwoHandedSword"],
  },
  wand: { listSegments: ["Wands", "Wand"], whiteitemClasses: ["Wands", "Wand"] },
};

const delay = async (ms: number): Promise<void> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
};

const readKoCatalog = (): CatalogType => {
  const raw = fs.readFileSync(KO_CATALOG_PATH, "utf8");
  return JSON.parse(raw) as CatalogType;
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

const buildNameToSlugMap = (html: string, whiteitemClass: string): Map<string, string> => {
  const map = new Map<string, string>();
  const escaped = whiteitemClass.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<a class="whiteitem ${escaped}"[^>]*href="([^"]+)"[^>]*>([^<]+)</a>`,
    "g",
  );
  let match = re.exec(html);
  while (match !== null) {
    const slug = match[1]?.trim() ?? "";
    const localizedName = match[2]?.trim() ?? "";
    if (slug.length > 0 && localizedName.length > 0) {
      const key = localizedName.normalize("NFC");
      map.set(key, slug);
    }
    match = re.exec(html);
  }
  return map;
};

const buildEnglishNameToSlugMap = (html: string, whiteitemClass: string): Map<string, string> => {
  const map = new Map<string, string>();
  const escaped = whiteitemClass.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<a class="whiteitem ${escaped}"[^>]*href="([^"]+)"[^>]*>([^<]+)<\\/a>`,
    "g",
  );
  let match = re.exec(html);
  while (match !== null) {
    const slug = match[1]?.trim() ?? "";
    const englishName = match[2]?.trim() ?? "";
    if (slug.length > 0 && englishName.length > 0) {
      map.set(englishName, slug);
    }
    match = re.exec(html);
  }
  return map;
};

const extractEnglishBaseType = (detailHtml: string): string | null => {
  // First <td> may contain tooltip spans: <td>BaseType <span ...></span></td>
  const re = /<tr><td>BaseType[\s\S]*?<\/td><td>([^<]+)<\/td><\/tr>/g;
  let match: RegExpExecArray | null = re.exec(detailHtml);
  while (match !== null) {
    const cell = match[1]?.trim() ?? "";
    if (cell.length > 0 && /^[\x20-\x7E]+$/.test(cell)) {
      return cell;
    }
    match = re.exec(detailHtml);
  }
  return null;
};

const extractOgImage = (detailHtml: string): string | null => {
  const m = detailHtml.match(/property="og:image"\s+content="([^"]+)"/);
  return m?.[1] ?? null;
};

const downloadBinary = async (url: string, destination: string): Promise<void> => {
  const response = await fetchWithTimeout(url, {
    headers: {
      ...FETCH_HEADERS,
      Referer: REFERER_POE2DB,
    },
  });
  if (!response.ok) {
    throw new Error(`Download failed: ${url} (${response.status})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, buffer);
};

const run = async (): Promise<void> => {
  const catalog = readKoCatalog();
  const baseItemsCatalog = catalog.baseItems ?? {};

  const listHtmlCache = new Map<string, string>();
  const nameMaps = new Map<string, Map<string, string>>();
  const englishNameMaps = new Map<string, Map<string, string>>();

  const getListHtmlBySource = async (source: ItemClassSourceType): Promise<string> => {
    const cacheKey = source.listSegment;
    const cached = listHtmlCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
    const url = `https://poe2db.tw/kr/${source.listSegment}`;
    const html = await fetchText(url);
    listHtmlCache.set(cacheKey, html);
    await delay(200);
    return html;
  };

  const getNameMapForItemClass = async (itemClass: string): Promise<Map<string, string>> => {
    const cached = nameMaps.get(itemClass);
    if (cached !== undefined) {
      return cached;
    }
    const source = ITEM_CLASS_SOURCE_BY_ITEM_CLASS[itemClass];
    if (source === undefined) {
      throw new Error(`No poe2db list segment for itemClass="${itemClass}"`);
    }
    const html = await getListHtmlBySource(source);
    const map = buildNameToSlugMap(html, source.whiteitemClass);
    nameMaps.set(itemClass, map);
    return map;
  };

  const resolveFallbackSourceBySubType = async (
    subType: string,
  ): Promise<ItemClassSourceType | undefined> => {
    const candidate = FALLBACK_CANDIDATES_BY_SUB_TYPE[subType];
    if (candidate === undefined) {
      return undefined;
    }
    for (const listSegment of candidate.listSegments) {
      let html: string;
      try {
        html = await getListHtmlBySource({ listSegment, whiteitemClass: candidate.whiteitemClasses[0] ?? "" });
      } catch {
        continue;
      }
      for (const whiteitemClass of candidate.whiteitemClasses) {
        const map = buildEnglishNameToSlugMap(html, whiteitemClass);
        if (map.size > 0) {
          return { listSegment, whiteitemClass };
        }
      }
    }
    return undefined;
  };

  const getEnglishNameMapBySubType = async (subType: string): Promise<Map<string, string>> => {
    const cached = englishNameMaps.get(subType);
    if (cached !== undefined) {
      return cached;
    }
    const source = await resolveFallbackSourceBySubType(subType);
    if (source === undefined) {
      throw new Error(`No fallback source for subType="${subType}"`);
    }
    const html = await getListHtmlBySource(source);
    const map = buildEnglishNameToSlugMap(html, source.whiteitemClass);
    englishNameMaps.set(subType, map);
    return map;
  };

  const meta: BaseItemImageMetaFileType = {};
  const reportLines: string[] = ["baseItemKey\tdisplayName\treason\tdetail"];

  let saved = 0;
  let skippedExisting = 0;
  let failed = 0;

  for (const record of BASE_ITEM_DB.records) {
    const displayName = baseItemsCatalog[record.baseItemKey]?.name?.trim() ?? "";
    if (displayName.length === 0) {
      failed += 1;
      reportLines.push(`${record.baseItemKey}\t\tmissing-ko-catalog-name\t`);
      continue;
    }

    let slug: string | undefined;
    try {
      const nameMap = await getNameMapForItemClass(record.itemClass);
      slug = nameMap.get(displayName.normalize("NFC"));
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      reportLines.push(`${record.baseItemKey}\t${displayName}\tlist-fetch-error\t${message}`);
      continue;
    }

    if (slug === undefined) {
      failed += 1;
      reportLines.push(
        `${record.baseItemKey}\t${displayName}\tno-slug-on-list\tcheck poe2db name spelling`,
      );
      continue;
    }

    const detailUrl = `https://poe2db.tw/kr/${encodeURI(slug)}`;
    let detailHtml: string;
    try {
      detailHtml = await fetchText(detailUrl);
      await delay(150);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      reportLines.push(`${record.baseItemKey}\t${displayName}\tdetail-fetch\t${message}`);
      continue;
    }

    const englishName = extractEnglishBaseType(detailHtml);
    if (englishName === null) {
      failed += 1;
      reportLines.push(`${record.baseItemKey}\t${displayName}\tno-english-basetype\t`);
      continue;
    }

    const imageUrl = extractOgImage(detailHtml);
    if (imageUrl === null || !imageUrl.includes("cdn.poe2db.tw")) {
      failed += 1;
      reportLines.push(`${record.baseItemKey}\t${displayName}\tno-og-image\t`);
      continue;
    }

    const fileSlug = toBaseItemImageFileSlug(englishName);
    const destination = path.join(
      OUT_ROOT,
      record.equipmentType,
      record.subType,
      `${fileSlug}.webp`,
    );

    meta[record.baseItemKey] = {
      englishDisplayName: englishName,
      poe2dbSlug: slug,
    };

    if (fs.existsSync(destination)) {
      skippedExisting += 1;
      continue;
    }

    try {
      await downloadBinary(imageUrl, destination);
      saved += 1;
      await delay(150);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      reportLines.push(`${record.baseItemKey}\t${displayName}\tdownload\t${message}`);
      delete meta[record.baseItemKey];
    }
  }

  const equipmentDirs = fs
    .readdirSync(OUT_ROOT, { withFileTypes: true })
    .filter((entry) => {
      return entry.isDirectory();
    })
    .map((entry) => {
      return entry.name;
    });

  for (const equipmentType of equipmentDirs) {
    const equipmentPath = path.join(OUT_ROOT, equipmentType);
    const subTypeDirs = fs
      .readdirSync(equipmentPath, { withFileTypes: true })
      .filter((entry) => {
        return entry.isDirectory();
      })
      .map((entry) => {
        return entry.name;
      });

    for (const subType of subTypeDirs) {
      const subTypePath = path.join(equipmentPath, subType);
      const existingWebpFiles = fs
        .readdirSync(subTypePath, { withFileTypes: true })
        .filter((entry) => {
          return entry.isFile() && entry.name.endsWith(".webp");
        });
      if (existingWebpFiles.length > 0) {
        continue;
      }

      const fallbackSource = FALLBACK_CANDIDATES_BY_SUB_TYPE[subType];
      if (fallbackSource === undefined) {
        reportLines.push(`folder:${equipmentType}/${subType}\t\tno-fallback-source\t`);
        continue;
      }

      let englishNameMap: Map<string, string>;
      try {
        englishNameMap = await getEnglishNameMapBySubType(subType);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        reportLines.push(`folder:${equipmentType}/${subType}\t\tfallback-list-fetch\t${message}`);
        failed += 1;
        continue;
      }

      for (const [localizedName, slug] of englishNameMap.entries()) {
        const detailUrl = `https://poe2db.tw/kr/${encodeURI(slug)}`;
        let detailHtml: string;
        try {
          detailHtml = await fetchText(detailUrl);
          await delay(100);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          reportLines.push(
            `folder:${equipmentType}/${subType}\t${localizedName}\tfallback-detail-fetch\t${message}`,
          );
          failed += 1;
          continue;
        }
        const englishName = extractEnglishBaseType(detailHtml);
        if (englishName === null) {
          reportLines.push(
            `folder:${equipmentType}/${subType}\t${localizedName}\tfallback-no-english-basetype\t`,
          );
          failed += 1;
          continue;
        }
        const imageUrl = extractOgImage(detailHtml);
        if (imageUrl === null || !imageUrl.includes("cdn.poe2db.tw")) {
          reportLines.push(
            `folder:${equipmentType}/${subType}\t${localizedName}\tfallback-no-og-image\t`,
          );
          failed += 1;
          continue;
        }
        const fileSlug = toBaseItemImageFileSlug(englishName);
        const destination = path.join(subTypePath, `${fileSlug}.webp`);
        if (fs.existsSync(destination)) {
          skippedExisting += 1;
          continue;
        }
        try {
          await downloadBinary(imageUrl, destination);
          saved += 1;
          await delay(100);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          reportLines.push(
            `folder:${equipmentType}/${subType}\t${localizedName}\tfallback-download\t${message}`,
          );
          failed += 1;
        }
      }
    }
  }

  fs.mkdirSync(path.dirname(META_OUT_PATH), { recursive: true });
  fs.writeFileSync(META_OUT_PATH, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
  fs.writeFileSync(REPORT_PATH, `${reportLines.join("\n")}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        records: BASE_ITEM_DB.records.length,
        saved,
        skippedExisting,
        failed,
        metaPath: META_OUT_PATH,
        reportPath: REPORT_PATH,
      },
      null,
      2,
    ),
  );
};

void run();
