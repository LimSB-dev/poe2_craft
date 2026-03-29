/**
 * 위키 Cargo로 채운 `poe2wiki-item-mod-tiers.json` 한 행과,
 * PoE2DB `#ModifiersCalc`가 넣는 `new ModsView(...)` JSON 한 덩어리를 **읽기 전용**으로 비교한다.
 * 시뮬 로직은 변경하지 않는다.
 *
 * 실행:
 *   `yarn probe:poe2db-wiki-mod-parity`
 * 상세 샘플(JSON):
 *   `EXTRACT_DEBUG=1 yarn probe:poe2db-wiki-mod-parity`
 * 다른 부위 페이지:
 *   `POE2DB_PROBE_CLASS_SLUG=Helmets yarn probe:poe2db-wiki-mod-parity`
 */

import fs from "fs";
import path from "path";

import type { WikiExtractedModTierRowType } from "@/lib/poe2-item-simulator/wikiModTierTypes";
import type { WikiItemModTiersFileType } from "@/lib/poe2-item-simulator/wikiModTierTypes";

import { isExtractDebug, logExtractDebugBlock, previewJson, summarizeModsViewLikePayload } from "./extract-debug";

const ROOT_URL = "https://poe2db.tw";
const DEFAULT_CLASS_SLUG = "Staves";

const REQUEST_HEADERS: HeadersInit = {
  "User-Agent": "poe2_craft-probe-mod-parity/1.0 (+https://github.com/LimSB-dev/poe2_craft)",
  Accept: "text/html,application/xhtml+xml",
};

type ModsViewPayloadType = Record<string, unknown>;

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

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url, { headers: REQUEST_HEADERS });
  if (!response.ok) {
    throw new Error(`HTTP ${String(response.status)}: ${url}`);
  }
  return await response.text();
};

const loadWikiTierFile = (): WikiItemModTiersFileType => {
  const jsonPath = path.join(
    process.cwd(),
    "src/lib/poe2-item-simulator/data/poe2wiki-item-mod-tiers.json",
  );
  const raw = fs.readFileSync(jsonPath, "utf8");
  return JSON.parse(raw) as WikiItemModTiersFileType;
};

const pickWikiSampleRows = (
  rows: readonly WikiExtractedModTierRowType[],
): { withSpawn: WikiExtractedModTierRowType; spellStaff?: WikiExtractedModTierRowType } => {
  const withSpawn =
    rows.find((r) => {
      return r.spawnWeights.some((w) => {
        return w.value > 0;
      });
    }) ?? rows[0];
  if (withSpawn === undefined) {
    throw new Error("Wiki tier JSON has no rows.");
  }
  const spellStaff = rows.find((r) => {
    return r.wikiModId.startsWith("SpellDamageOnTwoHandWeapon");
  });
  return { withSpawn, spellStaff };
};

const firstModsViewNormalRow = (
  payload: ModsViewPayloadType,
): Record<string, unknown> | null => {
  const normal = payload.normal;
  if (!Array.isArray(normal) || normal.length === 0) {
    return null;
  }
  const first = normal[0];
  if (typeof first !== "object" || first === null) {
    return null;
  }
  return first as Record<string, unknown>;
};

const main = async (): Promise<void> => {
  const classSlug = process.env.POE2DB_PROBE_CLASS_SLUG?.trim() || DEFAULT_CLASS_SLUG;
  const pageUrl = `${ROOT_URL}/kr/${classSlug}`;

  console.log(
    `[probe] PoE2DB 페이지: ${pageUrl} (바꾸려면 POE2DB_PROBE_CLASS_SLUG=Helmets 등)`,
  );
  if (isExtractDebug()) {
    console.log("[EXTRACT_DEBUG] 위키·PoE2DB 샘플 JSON 전체를 추가로 출력합니다.");
  }

  const wikiFile = loadWikiTierFile();
  const { withSpawn, spellStaff } = pickWikiSampleRows(wikiFile.rows);

  const wikiShapeSummary = {
    source: "committed poe2wiki-item-mod-tiers.json (from extract:mod-tiers)",
    rowCount: wikiFile.rows.length,
    sampleWikiModId: withSpawn.wikiModId,
    topLevelFieldsOnRow: Object.keys(withSpawn),
    spawnWeightsExample: withSpawn.spawnWeights.slice(0, 6),
    statRangesExample: withSpawn.statRanges.slice(0, 3),
    optionalSpellStaffRowId: spellStaff?.wikiModId ?? null,
  };

  const html = await fetchText(pageUrl);
  const payload = parseModsViewPayload(html);
  const normalFirst = firstModsViewNormalRow(payload);
  const sectionKeys = Object.keys(payload).filter((k) => {
    return Array.isArray((payload as Record<string, unknown>)[k]);
  });

  const poe2dbShapeSummary = {
    source: "PoE2DB HTML embedded ModsView JSON",
    pageUrl,
    htmlCharLength: html.length,
    modsViewTopLevelKeys: Object.keys(payload),
    arraySectionKeys: sectionKeys,
    baseitem: payload.baseitem,
    normalRowCount: Array.isArray(payload.normal) ? payload.normal.length : 0,
    firstNormalRowKeys: normalFirst !== null ? Object.keys(normalFirst) : null,
  };

  const parityNotes: string[] = [
    "위키 행: 전역 mods.id(wikiModId), mod_groups, generation_type, stat_ranges(min/max), mod_spawn_weights(tag→value) 다수.",
    "PoE2DB ModsView 행: 부위 페이지마다 Prefix/Suffix/normal 등 섹션, DropChance·ModFamilyList·Code(있을 때)·스탯 HTML(str).",
    "스폰 태그 전체 행렬은 위키 Cargo에만 있고, PoE2DB는 ‘이 클래스 페이지에 보이는 가중치’에 가깝다.",
  ];

  const report = {
    parityNotes,
    wikiSample: wikiShapeSummary,
    poe2dbSample: poe2dbShapeSummary,
  };

  console.log("\n--- 요약 (한 덩어리) ---\n");
  console.log(previewJson(report, 12000));

  if (isExtractDebug()) {
    logExtractDebugBlock(
      "위키 샘플 행 1개 (전체 필드)",
      previewJson(withSpawn, 14000),
    );
    if (spellStaff !== undefined) {
      logExtractDebugBlock(
        "위키 샘플: SpellDamageOnTwoHandWeapon* (있다면)",
        previewJson(spellStaff, 14000),
      );
    }
    logExtractDebugBlock(
      "PoE2DB ModsView payload 요약(배열은 길이·첫 행만)",
      previewJson(summarizeModsViewLikePayload(payload as Record<string, unknown>), 16000),
    );
    if (normalFirst !== null) {
      logExtractDebugBlock(
        "PoE2DB normal[0] 원본 객체",
        previewJson(normalFirst, 12000),
      );
    }
    logExtractDebugBlock(
      "PoE2DB HTML 앞 4000자 (ModsView 앞부분 포함 가능)",
      previewJson({ pageUrl, preview: html.slice(0, 4000) }, 12000),
    );
  }

  console.log("\n[probe] 완료. 상세 로그는 EXTRACT_DEBUG=1 로 다시 실행하세요.\n");
};

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
