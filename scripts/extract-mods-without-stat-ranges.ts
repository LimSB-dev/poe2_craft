/**
 * MOD_DB 레코드 중 티어 표시 행에 `statRanges`가 하나도 없는 모드(합성 티어만 있거나 위키 매핑 실패)를 추출한다.
 * 크래프트 랩·툴팁 등에서 `#`만 보이는 후보를 점검할 때 사용.
 *
 * 실행: `yarn extract:mods-without-stat-ranges`
 * 출력: `data/generated/mods-without-stat-ranges.json`
 */

import fs from "fs";
import path from "path";

import { MOD_DB } from "../src/lib/poe2-item-simulator/modDb";
import { getModTierDisplayRows } from "../src/lib/poe2-item-simulator/modDbTierDisplay";
import { MOD_WIKI_TIER_SOURCES } from "../src/lib/poe2-item-simulator/modWikiTierSources";
import { tryGetWikiModTiers } from "../src/lib/poe2-item-simulator/wikiModTierMerge";

type EntryType = {
  modKey: string;
  modType: ModTypeType;
  nameTemplateKey: string;
  displayRowCount: number;
  hasEmbeddedTiersInModDb: boolean;
  hasWikiTierSourceRule: boolean;
  wikiTierRuleMatchedRows: number | null;
  note: string;
};

const OUT_PATH = path.join(process.cwd(), "data/generated/mods-without-stat-ranges.json");

const main = (): void => {
  const without: EntryType[] = [];

  for (const record of MOD_DB.records) {
    const rows = getModTierDisplayRows(record);
    const hasAnyStat = rows.some((row) => {
      return row.statRanges.length > 0;
    });
    if (hasAnyStat) {
      continue;
    }

    const embedded = record.tiers !== undefined && record.tiers.length > 0;
    const hasRule = MOD_WIKI_TIER_SOURCES[record.modKey] !== undefined;
    const wikiTry = tryGetWikiModTiers(record);
    const wikiMatched = wikiTry === null ? null : wikiTry.length;

    let note = "표시 티어 행마다 statRanges 비어 있음";
    if (embedded) {
      note = "modDb에 tiers 배열은 있으나 모든 티어 statRanges 비어 있음";
    } else if (hasRule && wikiTry === null) {
      note = "MOD_WIKI_TIER_SOURCES 규칙은 있으나 위키 Cargo와 매칭된 행 없음(필터·데이터 불일치)";
    } else if (!hasRule) {
      note = "위키 tier 소스 규칙 없음 → 합성 티어만 사용";
    }

    without.push({
      modKey: record.modKey,
      modType: record.modType,
      nameTemplateKey: record.nameTemplateKey,
      displayRowCount: rows.length,
      hasEmbeddedTiersInModDb: embedded,
      hasWikiTierSourceRule: hasRule,
      wikiTierRuleMatchedRows: wikiMatched,
      note,
    });
  }

  const byModType: Record<string, number> = {};
  for (const e of without) {
    const k = e.modType;
    byModType[k] = (byModType[k] ?? 0) + 1;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    modDbVersion: MOD_DB.version,
    totalModRecords: MOD_DB.records.length,
    withoutStatRangesCount: without.length,
    withoutStatRangesByModType: byModType,
    entries: without,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  // eslint-disable-next-line no-console -- CLI 스크립트
  console.log(
    `Wrote ${String(without.length)} mod(s) without stat ranges → ${OUT_PATH}`,
  );
};

main();
