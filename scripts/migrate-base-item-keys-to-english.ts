import fs from "fs";
import path from "path";

import { BASE_ITEM_DB } from "@/lib/poe2-item-simulator/baseItemDb";

type CatalogJsonType = {
  baseItems?: Record<string, unknown>;
};

type ItemSimulatorCatalogJsonType = {
  itemSimulatorCatalog?: {
    baseItems?: Record<string, unknown>;
  };
};

const ROOT = process.cwd();
const BASE_ITEM_DB_PATH = path.join(
  ROOT,
  "src/lib/poe2-item-simulator/baseItemDb.ts",
);

const LOCALES = ["en", "ko", "ja", "zh-CN"] as const;

const toSnake = (value: string): string => {
  return value
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const sanitizeEnglishName = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const isAscii = (value: string): boolean => {
  return /^[\x00-\x7F]+$/.test(value);
};

const alphaToken = (index: number): string => {
  let n = index + 1;
  let token = "";
  while (n > 0) {
    n -= 1;
    token = String.fromCharCode(97 + (n % 26)) + token;
    n = Math.floor(n / 26);
  }
  return token;
};

const readJson = <T>(filePath: string): T => {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
};

const writeJson = (filePath: string, data: unknown): void => {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
};

const getEnglishNameByKey = (): Record<string, string | null> => {
  const byKey: Record<string, string | null> = {};
  const itemSimCatalogPath = path.join(
    ROOT,
    "messages/en/simulator/itemSimulatorCatalog.json",
  );
  const catalogPath = path.join(ROOT, "messages/en/simulator/catalog.json");
  const itemSimJson = readJson<ItemSimulatorCatalogJsonType>(itemSimCatalogPath);
  const catalogJson = readJson<CatalogJsonType>(catalogPath);
  const itemSimRows = itemSimJson.itemSimulatorCatalog?.baseItems ?? {};
  const catalogRows = catalogJson.baseItems ?? {};

  for (const record of BASE_ITEM_DB.records) {
    const rowA = itemSimRows[record.baseItemKey];
    const rowB = catalogRows[record.baseItemKey];
    const nameA =
      typeof rowA === "object" &&
      rowA !== null &&
      "name" in rowA &&
      typeof (rowA as { name?: unknown }).name === "string"
        ? (rowA as { name: string }).name
        : null;
    const nameB =
      typeof rowB === "object" &&
      rowB !== null &&
      "name" in rowB &&
      typeof (rowB as { name?: unknown }).name === "string"
        ? (rowB as { name: string }).name
        : null;
    const picked = nameA ?? nameB;
    byKey[record.baseItemKey] = picked;
  }

  return byKey;
};

const buildKeyMap = (): Record<string, string> => {
  const englishNameByKey = getEnglishNameByKey();
  const used = new Set<string>();
  const fallbackIndexBySubtype = new Map<string, number>();
  const keyMap: Record<string, string> = {};

  for (const record of BASE_ITEM_DB.records) {
    const oldKey = record.baseItemKey;
    const subTypeToken = toSnake(record.subType);
    const maybeName = englishNameByKey[oldKey];
    const normalizedName =
      maybeName !== null && isAscii(maybeName) ? sanitizeEnglishName(maybeName) : "";

    let baseCandidate: string;
    if (normalizedName.length > 0) {
      baseCandidate = `${subTypeToken}_${normalizedName}`;
    } else {
      const nextIndex = fallbackIndexBySubtype.get(record.subType) ?? 0;
      fallbackIndexBySubtype.set(record.subType, nextIndex + 1);
      baseCandidate = `${subTypeToken}_variant_${alphaToken(nextIndex)}`;
    }

    let candidate = baseCandidate;
    let collision = 0;
    while (used.has(candidate)) {
      candidate = `${baseCandidate}_alt_${alphaToken(collision)}`;
      collision += 1;
    }
    used.add(candidate);
    keyMap[oldKey] = candidate;
  }

  return keyMap;
};

const migrateBaseItemDbTs = (keyMap: Record<string, string>): void => {
  let source = fs.readFileSync(BASE_ITEM_DB_PATH, "utf8");
  for (const [oldKey, newKey] of Object.entries(keyMap)) {
    source = source.replaceAll(`"${oldKey}"`, `"${newKey}"`);
  }
  fs.writeFileSync(BASE_ITEM_DB_PATH, source, "utf8");
};

const migrateMessageFiles = (keyMap: Record<string, string>): void => {
  for (const locale of LOCALES) {
    const catalogPath = path.join(ROOT, `messages/${locale}/simulator/catalog.json`);
    const itemSimPath = path.join(
      ROOT,
      `messages/${locale}/simulator/itemSimulatorCatalog.json`,
    );

    const catalogJson = readJson<CatalogJsonType>(catalogPath);
    const itemSimJson = readJson<ItemSimulatorCatalogJsonType>(itemSimPath);

    const catalogBaseItems = catalogJson.baseItems ?? {};
    const nextCatalogBaseItems: Record<string, unknown> = {};
    for (const [oldKey, row] of Object.entries(catalogBaseItems)) {
      const mapped = keyMap[oldKey];
      nextCatalogBaseItems[mapped ?? oldKey] = row;
    }
    catalogJson.baseItems = nextCatalogBaseItems;
    writeJson(catalogPath, catalogJson);

    const itemSimBaseItems = itemSimJson.itemSimulatorCatalog?.baseItems ?? {};
    const nextItemSimBaseItems: Record<string, unknown> = {};
    for (const [oldKey, row] of Object.entries(itemSimBaseItems)) {
      const mapped = keyMap[oldKey];
      nextItemSimBaseItems[mapped ?? oldKey] = row;
    }
    if (itemSimJson.itemSimulatorCatalog === undefined) {
      itemSimJson.itemSimulatorCatalog = {};
    }
    itemSimJson.itemSimulatorCatalog.baseItems = nextItemSimBaseItems;
    writeJson(itemSimPath, itemSimJson);
  }
};

const writeKeyMapReport = (keyMap: Record<string, string>): void => {
  const rows = ["oldKey\tnewKey"];
  for (const [oldKey, newKey] of Object.entries(keyMap)) {
    rows.push(`${oldKey}\t${newKey}`);
  }
  fs.writeFileSync(
    path.join(ROOT, "data/base-item-key-migration.tsv"),
    `${rows.join("\n")}\n`,
    "utf8",
  );
};

const run = (): void => {
  const keyMap = buildKeyMap();
  migrateBaseItemDbTs(keyMap);
  migrateMessageFiles(keyMap);
  writeKeyMapReport(keyMap);
  console.log(
    JSON.stringify(
      {
        migrated: Object.keys(keyMap).length,
        report: "data/base-item-key-migration.tsv",
      },
      null,
      2,
    ),
  );
};

run();
