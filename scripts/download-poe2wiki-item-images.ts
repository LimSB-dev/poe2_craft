import fs from "fs";
import path from "path";

import { BASE_ITEM_DB } from "@/lib/poe2-item-simulator/baseItemDb";

type CatalogRowType = {
  name?: string;
};

type CatalogType = {
  baseItems?: Record<string, CatalogRowType>;
};

const ROOT_DIR = process.cwd();
const OUT_ROOT = path.join(ROOT_DIR, "public/images/items");
const CATALOG_PATH = path.join(ROOT_DIR, "src/i18n/messages/en/simulator/catalog.json");

const sanitizeSlug = (value: string): string => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug;
};

const readCatalog = (): CatalogType => {
  const raw = fs.readFileSync(CATALOG_PATH, "utf8");
  return JSON.parse(raw) as CatalogType;
};

const getImageInfoUrl = async (fileTitle: string): Promise<string | null> => {
  const url = new URL("https://www.poe2wiki.net/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", `File:${fileTitle}`);
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as {
    query?: { pages?: Record<string, { imageinfo?: Array<{ url?: string }> }> };
  };
  const pages = data.query?.pages ?? {};
  const page = Object.values(pages)[0];
  const imageUrl = page?.imageinfo?.[0]?.url;
  return typeof imageUrl === "string" ? imageUrl : null;
};

const downloadBinary = async (url: string, destination: string): Promise<void> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${url} (${response.status})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, buffer);
};

const buildFileTitleCandidates = (itemName: string): string[] => {
  const underscoreName = itemName.trim().replace(/\s+/g, "_");
  const withoutApostrophe = itemName
    .trim()
    .replace(/'/g, "")
    .replace(/\s+/g, "_");
  return [
    `${underscoreName}_inventory_icon.png`,
    `${withoutApostrophe}_inventory_icon.png`,
  ];
};

const isAscii = (value: string): boolean => {
  return /^[\x00-\x7F]+$/.test(value);
};

const run = async (): Promise<void> => {
  const catalog = readCatalog();
  const baseItems = catalog.baseItems ?? {};
  const failedRows: string[] = [];

  let attempted = 0;
  let saved = 0;
  let skippedNonAscii = 0;
  let failed = 0;

  for (const record of BASE_ITEM_DB.records) {
    const itemName = baseItems[record.baseItemKey]?.name?.trim() ?? "";
    if (itemName.length === 0) {
      failed += 1;
      failedRows.push(`${record.baseItemKey}\t(no-name)\tmissing-name`);
      continue;
    }

    if (!isAscii(itemName)) {
      skippedNonAscii += 1;
      failedRows.push(`${record.baseItemKey}\t${itemName}\tnon-ascii-name`);
      continue;
    }

    const slug = sanitizeSlug(itemName);
    if (slug.length === 0) {
      failed += 1;
      failedRows.push(`${record.baseItemKey}\t${itemName}\tempty-slug`);
      continue;
    }

    const destination = path.join(
      OUT_ROOT,
      record.equipmentType,
      record.subType,
      `${slug}.png`,
    );
    if (fs.existsSync(destination)) {
      continue;
    }

    attempted += 1;
    const candidates = buildFileTitleCandidates(itemName);

    let foundUrl: string | null = null;
    for (const candidate of candidates) {
      const resolved = await getImageInfoUrl(candidate);
      if (resolved !== null) {
        foundUrl = resolved;
        break;
      }
    }

    if (foundUrl === null) {
      failed += 1;
      failedRows.push(`${record.baseItemKey}\t${itemName}\tno-poe2wiki-file`);
      continue;
    }

    try {
      await downloadBinary(foundUrl, destination);
      saved += 1;
    } catch {
      failed += 1;
      failedRows.push(`${record.baseItemKey}\t${itemName}\tdownload-failed`);
    }
  }

  const reportPath = path.join(OUT_ROOT, "_download_report.tsv");
  fs.writeFileSync(
    reportPath,
    ["baseItemKey\tname\treason", ...failedRows].join("\n"),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        records: BASE_ITEM_DB.records.length,
        attempted,
        saved,
        skippedNonAscii,
        failed,
        reportPath,
      },
      null,
      2,
    ),
  );
};

void run();
