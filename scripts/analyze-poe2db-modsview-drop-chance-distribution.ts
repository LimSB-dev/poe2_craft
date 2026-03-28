/**
 * PoE2DB `ModsView.normal[]`의 `DropChance` 분포 분석 (추출기와 동일 크롤).
 * - 행 단위로 `DropChance`>1 이고 `wikiModId` 해석 가능한 경우만 집계.
 * - 동일 `wikiModId`가 페이지마다 다른 `DropChance`를 갖는지 목록화.
 *
 * 실행: `yarn analyze:poe2db-modsview-drop-chance-distribution`
 * 결과: `data/generated/poe2db-modsview-drop-chance-distribution.json`
 */

import fs from "fs";
import path from "path";

import { resolveWikiModIdForPoe2DbModsViewNormalRow } from "@/lib/poe2-item-simulator/poe2dbModsViewWikiModIdResolve";
import type { WikiItemModTiersFileType } from "@/lib/poe2-item-simulator/wikiModTierTypes";
import wikiModTierPayload from "@/lib/poe2-item-simulator/data/poe2wiki-item-mod-tiers.json";

const ROOT_URL = "https://poe2db.tw";
const MODIFIERS_URL = `${ROOT_URL}/kr/Modifiers`;
const OUT_PATH = path.join(process.cwd(), "data/generated/poe2db-modsview-drop-chance-distribution.json");

const wikiTierRows = (wikiModTierPayload as WikiItemModTiersFileType).rows;

const REQUEST_HEADERS: HeadersInit = {
  "User-Agent": "poe2_craft-poe2db-drop-chance-analyze/1.0 (+https://github.com/)",
  Accept: "text/html,application/xhtml+xml",
};

type Poe2DbLinkType = {
  label: string;
  href: string;
  slug: string;
};

type ModsViewPayloadType = Record<string, unknown>;

const delay = async (ms: number): Promise<void> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
};

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url, { headers: REQUEST_HEADERS });
  if (!response.ok) {
    throw new Error(`HTTP ${String(response.status)}: ${url}`);
  }
  return await response.text();
};

const extractModifierCalcLinks = (html: string): Poe2DbLinkType[] => {
  const links: Poe2DbLinkType[] = [];
  const re = /<a[^>]+href="([^"]+#ModifiersCalc)"[^>]*>([\s\S]*?)<\/a>/g;
  let match = re.exec(html);
  while (match !== null) {
    const hrefRaw = match[1]?.trim() ?? "";
    const labelRaw = match[2]?.replace(/<[^>]+>/g, "").trim() ?? "";
    if (hrefRaw.startsWith("/kr/") && labelRaw.length > 0) {
      const href = hrefRaw.startsWith("http") ? hrefRaw : `${ROOT_URL}${hrefRaw}`;
      const slug = hrefRaw
        .replace(/^\/kr\//, "")
        .replace(/#ModifiersCalc$/, "")
        .trim();
      links.push({ label: labelRaw, href, slug });
    }
    match = re.exec(html);
  }

  const fallbackRe = /\/kr\/([A-Za-z0-9_:-]+)#ModifiersCalc/g;
  let fallbackMatch = fallbackRe.exec(html);
  while (fallbackMatch !== null) {
    const slug = fallbackMatch[1]?.trim() ?? "";
    if (slug.length > 0) {
      links.push({
        label: slug,
        href: `${ROOT_URL}/kr/${slug}#ModifiersCalc`,
        slug,
      });
    }
    fallbackMatch = fallbackRe.exec(html);
  }

  const dedup = new Map<string, Poe2DbLinkType>();
  for (const link of links) {
    if (!dedup.has(link.slug)) {
      dedup.set(link.slug, link);
    }
  }
  return [...dedup.values()];
};

const findMatchingParenIndex = (source: string, openParenIndex: number): number => {
  let depth = 1;
  let inString = false;
  let escaped = false;

  for (let index = openParenIndex + 1; index < source.length; index += 1) {
    const ch = source[index];
    if (ch === undefined) {
      continue;
    }
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }
    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "(") {
      depth += 1;
      continue;
    }
    if (ch === ")") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
};

const parseModsViewPayload = (html: string): ModsViewPayloadType => {
  const needle = "new ModsView(";
  const start = html.indexOf(needle);
  if (start < 0) {
    throw new Error("ModsView payload not found.");
  }
  const openParen = start + needle.length - 1;
  const closeParen = findMatchingParenIndex(html, openParen);
  if (closeParen < 0) {
    throw new Error("Could not locate end of ModsView payload.");
  }
  const payloadText = html.slice(openParen + 1, closeParen);
  return JSON.parse(payloadText) as ModsViewPayloadType;
};

const parseDropChance = (raw: unknown): number | null => {
  if (raw === undefined || raw === null) {
    return null;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.trunc(raw);
  }
  if (typeof raw === "string") {
    const parsed = Number.parseInt(raw.replace(/,/g, "").trim(), 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const primaryFamily = (row: Record<string, unknown>): string => {
  const list = row.ModFamilyList;
  if (!Array.isArray(list) || list.length === 0) {
    return "(none)";
  }
  const first = list[0];
  return typeof first === "string" ? first : "(non_string)";
};

const run = async (): Promise<void> => {
  console.log("Fetching /kr/Modifiers …");
  const modifiersHtml = await fetchText(MODIFIERS_URL);
  const links = extractModifierCalcLinks(modifiersHtml);
  console.log(`Found ${String(links.length)} #ModifiersCalc pages.`);

  /** DropChance 값 → 해당 값이 나온 행 수 */
  const dropHistogram = new Map<number, number>();
  /** 첫 번째 ModFamily → DropChance → 행 수 */
  const byFamily = new Map<string, Map<number, number>>();
  /** wikiModId → 관측된 DropChance 집합 */
  const wikiModDrops = new Map<string, Set<number>>();

  let rowsCounted = 0;
  const failed: string[] = [];

  for (const link of links) {
    try {
      const html = await fetchText(link.href.replace(/#ModifiersCalc$/, ""));
      const payload = parseModsViewPayload(html);
      const normal = payload.normal;
      if (!Array.isArray(normal)) {
        await delay(120);
        continue;
      }

      for (const raw of normal) {
        if (typeof raw !== "object" || raw === null) {
          continue;
        }
        const row = raw as Record<string, unknown>;
        const name = typeof row.Name === "string" ? row.Name.trim() : "";
        if (name.length === 0) {
          continue;
        }
        if (
          name.startsWith("- ") &&
          (!Array.isArray(row.ModFamilyList) || row.ModFamilyList.length === 0)
        ) {
          continue;
        }

        const drop = parseDropChance(row.DropChance);
        if (drop === null || drop <= 1) {
          continue;
        }

        const wikiModId = resolveWikiModIdForPoe2DbModsViewNormalRow(
          row as Parameters<typeof resolveWikiModIdForPoe2DbModsViewNormalRow>[0],
          wikiTierRows,
        );
        if (wikiModId === null) {
          continue;
        }

        rowsCounted += 1;
        dropHistogram.set(drop, (dropHistogram.get(drop) ?? 0) + 1);

        const fam = primaryFamily(row);
        let famMap = byFamily.get(fam);
        if (famMap === undefined) {
          famMap = new Map();
          byFamily.set(fam, famMap);
        }
        famMap.set(drop, (famMap.get(drop) ?? 0) + 1);

        let set = wikiModDrops.get(wikiModId);
        if (set === undefined) {
          set = new Set();
          wikiModDrops.set(wikiModId, set);
        }
        set.add(drop);
      }

      await delay(120);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed.push(`${link.slug}: ${message}`);
    }
  }

  const uniqueDrops = [...dropHistogram.keys()].sort((a, b) => a - b);

  const wikiModsWithMultipleDrops: Array<{ wikiModId: string; distinctDropChances: number[] }> = [];
  for (const [id, set] of wikiModDrops) {
    if (set.size > 1) {
      wikiModsWithMultipleDrops.push({
        wikiModId: id,
        distinctDropChances: [...set].sort((a, b) => a - b),
      });
    }
  }
  wikiModsWithMultipleDrops.sort((a, b) => a.wikiModId.localeCompare(b.wikiModId));

  const byFamilySerialized: Record<string, Record<string, number>> = {};
  const sortedFamilyKeys = [...byFamily.keys()].sort((a, b) => a.localeCompare(b));
  for (const fk of sortedFamilyKeys) {
    const m = byFamily.get(fk);
    if (m === undefined) {
      continue;
    }
    const inner: Record<string, number> = {};
    const sortedDrops = [...m.keys()].sort((a, b) => a - b);
    for (const d of sortedDrops) {
      inner[String(d)] = m.get(d) ?? 0;
    }
    byFamilySerialized[fk] = inner;
  }

  const dropHistogramSerialized: Record<string, number> = {};
  for (const d of uniqueDrops) {
    dropHistogramSerialized[String(d)] = dropHistogram.get(d) ?? 0;
  }

  const output = {
    schemaVersion: "poe2db-modsview-drop-chance-distribution@1" as const,
    source: "poe2db_modsview_normal_rows_resolved_wiki_mod_id",
    fetchedAtIso: new Date().toISOString(),
    pageCount: links.length,
    rowsWithResolvedWikiModIdAndDropGt1: rowsCounted,
    uniqueDropChanceValues: uniqueDrops,
    dropChanceRowHistogram: dropHistogramSerialized,
    byPrimaryModFamily: byFamilySerialized,
    wikiModIdsWithMultipleDistinctDropChanceCount: wikiModsWithMultipleDrops.length,
    wikiModIdsWithMultipleDistinctDropChance: wikiModsWithMultipleDrops,
    failedPages: failed,
    note:
      "dropChanceRowHistogram counts ModsView normal rows (same wikiModId may appear on many pages). " +
      "extract-poe2db-mod-drop-weights keeps max(DropChance) per wikiModId.",
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Wrote ${OUT_PATH}`);
  console.log(`Rows counted: ${String(rowsCounted)}`);
  console.log(`Unique DropChance values: ${uniqueDrops.join(", ")}`);
  console.log(`wikiModIds with >1 distinct DropChance: ${String(wikiModsWithMultipleDrops.length)}`);
  console.log(`Failed pages: ${String(failed.length)}`);
};

void run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
