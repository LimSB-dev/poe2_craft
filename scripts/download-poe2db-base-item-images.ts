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
const KO_CATALOG_PATH = path.join(ROOT_DIR, "messages/ko/simulator/catalog.json");
const META_OUT_PATH = path.join(ROOT_DIR, "data/generated/base-item-image-meta.json");
const REPORT_PATH = path.join(OUT_ROOT, "_download_report.tsv");

const FETCH_HEADERS: HeadersInit = {
  "User-Agent": "poe2_craft-image-sync/1.0 (+https://github.com/)",
  Accept: "text/html,application/xhtml+xml",
};

const REFERER_POE2DB = "https://poe2db.tw/";

/** poe2db 목록 페이지 경로 (itemClass → URL segment) */
const ITEM_CLASS_TO_POE2DB_LIST_SEGMENT: Record<string, string> = {
  Gloves: "Gloves",
  "Body Armour": "Body_Armours",
};

/** HTML `class="whiteitem …"` 의 두 번째 토큰 */
const ITEM_CLASS_TO_WHITEITEM_CLASS: Record<string, string> = {
  Gloves: "Gloves",
  "Body Armour": "BodyArmour",
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

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url, { headers: FETCH_HEADERS });
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
  const response = await fetch(url, {
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

  const getNameMapForItemClass = async (itemClass: string): Promise<Map<string, string>> => {
    const cached = nameMaps.get(itemClass);
    if (cached !== undefined) {
      return cached;
    }
    const segment = ITEM_CLASS_TO_POE2DB_LIST_SEGMENT[itemClass];
    if (segment === undefined) {
      throw new Error(`No poe2db list segment for itemClass="${itemClass}"`);
    }
    let html = listHtmlCache.get(segment);
    if (html === undefined) {
      const url = `https://poe2db.tw/kr/${segment}`;
      html = await fetchText(url);
      listHtmlCache.set(segment, html);
      await delay(200);
    }
    const whiteitem = ITEM_CLASS_TO_WHITEITEM_CLASS[itemClass];
    if (whiteitem === undefined) {
      throw new Error(`No whiteitem class for itemClass="${itemClass}"`);
    }
    const map = buildNameToSlugMap(html, whiteitem);
    nameMaps.set(itemClass, map);
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
