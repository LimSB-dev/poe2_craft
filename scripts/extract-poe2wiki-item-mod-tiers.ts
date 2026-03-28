/**
 * poe2wiki Cargo `mods` (domain=1, prefix/suffix) + `mod_stats` + `mod_spawn_weights` 전량을
 * 끌어와 `data/generated/poe2wiki-item-mod-tiers.json` 에 저장한다.
 *
 * 각 `rows[]` 원소는 PoE2DB 모디파이어 상세(패밀리·도메인·접두/접미·Req·스탯 min/max·지역·스폰·제작 태그 슬롯)와
 * 같은 필드를 갖추도록 `schemaVersion`, `modDomain`, `statRanges[].isLocal`, `craftTags` 등을 둔다.
 * (골드·Effective·craft 태그 본문은 Cargo에 없으면 `null` / `[]`.)
 *
 * 시뮬의 `modDb`는 `tiers` 배열이 비어 있고 `MOD_POOL`이 사실상 티어 1만 쓰는 상태이므로,
 * 이 JSON은 **속성(모드) 그룹별 실제 티어 사다리**를 외부 참고·향후 modDb 이식용으로 쓴다.
 *
 * **스폰 가중치(`spawnWeights[].value`)**: 위키 Cargo `mod_spawn_weights.value`는 PoE2DB UI에 보이는
 * 절대 가중치(예: 500/250)와 같지 않을 수 있으며, 종종 **0/1 등의 플래그·정규화 값**이다.
 * 슬롯별 상대 비교·필터에는 쓰이지만, PoE2DB 숫자와 1:1 대응은 보장하지 않는다.
 *
 * 실행: `yarn extract:mod-tiers`
 * 테스트용 상한: `MAX_MODS=500 yarn extract:mod-tiers`
 *
 * 앱 번들에 반영하려면 생성 후 다음으로 복사한다:
 * `cp data/generated/poe2wiki-item-mod-tiers.json src/lib/poe2-item-simulator/data/poe2wiki-item-mod-tiers.json`
 * (`modWikiTierSources.ts` 매핑과 함께 커밋)
 *
 * 같은 실행에서 `data/generated/poe2wiki-spawn-tag-unions.json`도 쓴다(mod_groups+접두/접미별 스폰 태그 합집합).
 *
 * **빈 `spawnWeights` 보정**: `repairEmptySpawnWeightsInWikiTierRows`(`wikiModTierSpawnRepair.ts`)가 Cargo 누락·전부 0인 행을
 * 동일 사다리 인접 티어에서 복사한다.
 *
 * **PoE2DB 정합 보정**: 그 다음 `applyPoe2dbWikiSpawnPostCorrections`(`wikiTierSpawnExtractPostProcess.ts`)가
 * Cargo와 PoE2DB가 다른 부위 스폰(예: `ItemFoundRarityIncreasePrefix` 최상위 티의 `helmet`)을 덮어쓴다.
 */

import fs from "fs";
import path from "path";

import type { WikiExtractedModTierRowType, WikiItemModTiersFileType } from "@/lib/poe2-item-simulator/wikiModTierTypes";
import { enrichWikiModStatRangesWithLocalFlag } from "@/lib/poe2-item-simulator/wikiModTierNormalization";
import { repairEmptySpawnWeightsInWikiTierRows } from "@/lib/poe2-item-simulator/wikiModTierSpawnRepair";
import { applyPoe2dbWikiSpawnPostCorrections } from "@/lib/poe2-item-simulator/wikiTierSpawnExtractPostProcess";

const WIKI_API = "https://www.poe2wiki.net/w/api.php";
const OUT_PATH = path.join(process.cwd(), "data/generated/poe2wiki-item-mod-tiers.json");
const SUMMARY_PATH = path.join(process.cwd(), "data/generated/poe2wiki-item-mod-tiers.summary.json");
const SPAWN_UNION_PATH = path.join(process.cwd(), "data/generated/poe2wiki-spawn-tag-unions.json");

const PAGE_SIZE = 500;
const ID_CHUNK = 60;
const REQUEST_DELAY_MS = 350;

const delay = async (ms: number): Promise<void> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
};

type CargoModsRowType = {
  id?: string;
  "mod groups"?: string;
  "required level"?: string;
  "generation type"?: string;
  "tier text"?: string | null;
  "stat text"?: string | null;
  name?: string | null;
};

type CargoStatRowType = {
  id?: string;
  stat_id?: string;
  min?: string;
  max?: string;
};

type CargoSpawnRowType = {
  id?: string;
  ordinal?: string;
  tag?: string;
  value?: string;
};

type CargoRawStatRangeType = {
  statId: string;
  min: number;
  max: number;
};

type WikiModSpawnWeightType = {
  ordinal: number;
  tag: string;
  value: number;
};

const POE2DB_STYLE_SCHEMA_VERSION = "poe2db-style@1" as const;

const parseIntSafe = (value: string | undefined, fallback: number): number => {
  if (value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const buildInList = (ids: readonly string[]): string => {
  return ids.map((id) => `"${id.replace(/"/g, '\\"')}"`).join(",");
};

/** 위키 `Modifier:` 문서 제목 — Cargo `mod_spawn_weights` 행의 Page 열과 대응한다. */
const buildWikiModifierPageName = (wikiModId: string): string => {
  return `Modifier:${wikiModId}`;
};

const dedupeSpawnWeights = (weights: WikiModSpawnWeightType[]): WikiModSpawnWeightType[] => {
  const byKey = new Map<string, WikiModSpawnWeightType>();
  for (const w of weights) {
    const key = `${String(w.ordinal)}::${w.tag}`;
    const prev = byKey.get(key);
    if (prev === undefined) {
      byKey.set(key, { ...w });
    } else {
      byKey.set(key, {
        ordinal: w.ordinal,
        tag: w.tag,
        value: Math.max(prev.value, w.value),
      });
    }
  }
  const merged = [...byKey.values()];
  merged.sort((a, b) => a.ordinal - b.ordinal);
  return merged;
};

const cargoQuery = async (params: Record<string, string>): Promise<unknown> => {
  const url = new URL(WIKI_API);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("format", "json");

  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "poe2_craft-mod-tier-extract/1.0 (+https://github.com/)",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${String(response.status)}`);
      }
      return (await response.json()) as unknown;
    } catch (error) {
      lastError = error;
      await delay(1200 * (attempt + 1));
    }
  }
  throw lastError;
};

const readCargoRows = (payload: unknown): Record<string, string>[] => {
  if (typeof payload !== "object" || payload === null) {
    return [];
  }
  const query = (payload as { cargoquery?: unknown }).cargoquery;
  if (!Array.isArray(query)) {
    return [];
  }
  const out: Record<string, string>[] = [];
  for (const entry of query) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }
    const title = (entry as { title?: unknown }).title;
    if (typeof title !== "object" || title === null) {
      continue;
    }
    out.push(title as Record<string, string>);
  }
  return out;
};

const fetchAllModSummaries = async (maxMods: number | null): Promise<CargoModsRowType[]> => {
  const summaries: CargoModsRowType[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    if (maxMods !== null && summaries.length >= maxMods) {
      break;
    }
    const limit =
      maxMods === null ? PAGE_SIZE : Math.min(PAGE_SIZE, maxMods - summaries.length);
    if (limit <= 0) {
      break;
    }
    const payload = await cargoQuery({
      action: "cargoquery",
      tables: "mods=m",
      fields: "m.id,m.mod_groups,m.required_level,m.generation_type,m.tier_text,m.stat_text,m.name",
      where: "m.domain=1 AND (m.generation_type=1 OR m.generation_type=2)",
      offset: String(offset),
      limit: String(limit),
    });
    await delay(REQUEST_DELAY_MS);
    const rows = readCargoRows(payload);
    if (rows.length === 0) {
      break;
    }
    for (const row of rows) {
      summaries.push(row as CargoModsRowType);
    }
    if (rows.length < limit) {
      break;
    }
  }
  return summaries;
};

const fetchStatsForIds = async (ids: readonly string[]): Promise<Map<string, CargoRawStatRangeType[]>> => {
  const map = new Map<string, CargoRawStatRangeType[]>();
  if (ids.length === 0) {
    return map;
  }
  const where = `m.domain=1 AND (m.generation_type=1 OR m.generation_type=2) AND m.id IN (${buildInList(ids)})`;
  const payload = await cargoQuery({
    action: "cargoquery",
    tables: "mods=m,mod_stats=ms",
    join_on: "m._pageName=ms._pageName",
    fields: "m.id,ms.id=stat_id,ms.min,ms.max",
    where,
    limit: "5000",
  });
  await delay(REQUEST_DELAY_MS);
  for (const row of readCargoRows(payload)) {
    const typed = row as unknown as CargoStatRowType;
    const modId = typed.id;
    if (modId === undefined) {
      continue;
    }
    const statId = typed.stat_id;
    if (statId === undefined) {
      continue;
    }
    const list = map.get(modId) ?? [];
    list.push({
      statId,
      min: parseIntSafe(typed.min, 0),
      max: parseIntSafe(typed.max, 0),
    });
    map.set(modId, list);
  }
  return map;
};

/**
 * `mod_spawn_weights`를 `mods`와 `_pageName`으로만 조인하고, `sw._pageName IN ("Modifier:…")`로
 * 필요한 행만 가져온다. `m.id IN (…)`만 쓰는 조인과 동치여야 하나, 페이지 키를 명시해
 * Cargo/조인 이슈 시 디버깅·재현이 쉽다. 동일 (ordinal, tag) 중복 행은 `value` 최대로 병합한다.
 */
const fetchSpawnWeightsByModifierPageNames = async (
  wikiModIds: readonly string[],
): Promise<Map<string, WikiModSpawnWeightType[]>> => {
  const map = new Map<string, WikiModSpawnWeightType[]>();
  if (wikiModIds.length === 0) {
    return map;
  }
  const pageNames = wikiModIds.map((id) => buildWikiModifierPageName(id));
  const where = `sw._pageName IN (${buildInList(pageNames)}) AND m.domain=1 AND (m.generation_type=1 OR m.generation_type=2)`;
  const payload = await cargoQuery({
    action: "cargoquery",
    tables: "mods=m,mod_spawn_weights=sw",
    join_on: "m._pageName=sw._pageName",
    fields: "m.id,sw.ordinal,sw.tag,sw.value",
    where,
    limit: "10000",
  });
  await delay(REQUEST_DELAY_MS);
  for (const row of readCargoRows(payload)) {
    const typed = row as unknown as CargoSpawnRowType;
    const modId = typed.id;
    if (modId === undefined) {
      continue;
    }
    const list = map.get(modId) ?? [];
    list.push({
      ordinal: parseIntSafe(typed.ordinal, 0),
      tag: typed.tag ?? "",
      value: parseIntSafe(typed.value, 0),
    });
    map.set(modId, list);
  }
  for (const [modId, weights] of map) {
    map.set(modId, dedupeSpawnWeights(weights));
  }
  return map;
};

const groupKey = (modGroups: string, generationType: 1 | 2): string => {
  return `${String(generationType)}::${modGroups}`;
};

const buildSpawnTagUnionsPayload = (
  rows: WikiExtractedModTierRowType[],
): {
  schemaVersion: "spawn-tag-union@1";
  source: string;
  fetchedAtIso: string;
  note: string;
  groupCount: number;
  groups: Record<string, { tags: string[]; wikiModCount: number }>;
} => {
  const map = new Map<string, { tags: Set<string>; wikiModCount: number }>();
  for (const row of rows) {
    const key = `${row.modGroups}::${String(row.generationType)}`;
    const prev = map.get(key) ?? { tags: new Set<string>(), wikiModCount: 0 };
    prev.wikiModCount += 1;
    for (const w of row.spawnWeights) {
      if (w.value > 0) {
        prev.tags.add(w.tag);
      }
    }
    map.set(key, prev);
  }
  const sortedKeys = [...map.keys()].sort((a, b) => a.localeCompare(b));
  const groups: Record<string, { tags: string[]; wikiModCount: number }> = {};
  for (const key of sortedKeys) {
    const entry = map.get(key);
    if (entry !== undefined) {
      groups[key] = {
        tags: [...entry.tags].sort((a, b) => a.localeCompare(b)),
        wikiModCount: entry.wikiModCount,
      };
    }
  }
  return {
    schemaVersion: "spawn-tag-union@1",
    source: "poe2wiki_cargo_derived",
    fetchedAtIso: new Date().toISOString(),
    note:
      "Union of mod_spawn_weights.tag where value>0, grouped by mod_groups + generation_type. modDb.applicableSubTypes may omit tags intentionally.",
    groupCount: sortedKeys.length,
    groups,
  };
};

const assignSimulatorTiers = (rows: WikiExtractedModTierRowType[]): void => {
  const byKey = new Map<string, WikiExtractedModTierRowType[]>();
  for (const row of rows) {
    const key = groupKey(row.modGroups, row.generationType);
    const list = byKey.get(key) ?? [];
    list.push(row);
    byKey.set(key, list);
  }
  for (const [, list] of byKey) {
    list.sort((a, b) => {
      if (b.requiredLevel !== a.requiredLevel) {
        return b.requiredLevel - a.requiredLevel;
      }
      return a.wikiModId.localeCompare(b.wikiModId);
    });
    for (let index = 0; index < list.length; index += 1) {
      const row = list[index];
      if (row !== undefined) {
        row.simulatorTierWithinGroup = index + 1;
      }
    }
  }
};

const main = async (): Promise<void> => {
  const maxModsRaw = process.env.MAX_MODS;
  const maxMods =
    maxModsRaw === undefined || maxModsRaw === "" ? null : Number.parseInt(maxModsRaw, 10);

  console.log("Fetching mod summaries from poe2wiki Cargo…");
  const summaries = await fetchAllModSummaries(
    Number.isNaN(maxMods as number) ? null : maxMods,
  );
  const ids = summaries
    .map((row) => row.id)
    .filter((id): id is string => id !== undefined && id.length > 0);

  console.log(`Summaries: ${String(summaries.length)} mods.`);

  const statMap = new Map<string, CargoRawStatRangeType[]>();
  const spawnMap = new Map<string, WikiModSpawnWeightType[]>();

  for (let index = 0; index < ids.length; index += ID_CHUNK) {
    const chunk = ids.slice(index, index + ID_CHUNK);
    console.log(`Fetching stats & spawn weights ${String(index + 1)}–${String(index + chunk.length)} / ${String(ids.length)}…`);
    const [stats, spawns] = await Promise.all([
      fetchStatsForIds(chunk),
      fetchSpawnWeightsByModifierPageNames(chunk),
    ]);
    for (const [k, v] of stats) {
      statMap.set(k, v);
    }
    for (const [k, v] of spawns) {
      spawnMap.set(k, v);
    }
  }

  const rows: WikiExtractedModTierRowType[] = summaries.flatMap((summary) => {
    const wikiModId = summary.id;
    if (wikiModId === undefined) {
      return [];
    }
    const gen = parseIntSafe(summary["generation type"], 0);
    if (gen !== 1 && gen !== 2) {
      return [];
    }
    const modGroups = summary["mod groups"] ?? "";
    const rawStats = statMap.get(wikiModId) ?? [];
    const row: WikiExtractedModTierRowType = {
      wikiModId,
      wikiModifierPageName: buildWikiModifierPageName(wikiModId),
      modGroups,
      generationType: gen as 1 | 2,
      requiredLevel: parseIntSafe(summary["required level"], 0),
      modDomain: 1,
      effectiveLevel: null,
      goldPrice: null,
      craftTags: [] as readonly string[],
      tierText: summary["tier text"] ?? null,
      statText: summary["stat text"] ?? null,
      name: summary.name ?? null,
      statRanges: enrichWikiModStatRangesWithLocalFlag(rawStats),
      spawnWeights: spawnMap.get(wikiModId) ?? [],
      simulatorTierWithinGroup: 0,
    };
    return [row];
  });

  const spawnRepair = repairEmptySpawnWeightsInWikiTierRows(rows);
  if (spawnRepair.repairedCount > 0) {
    // eslint-disable-next-line no-console -- CLI 진단
    console.log(
      `Repaired empty mod_spawn_weights for ${String(spawnRepair.repairedCount)} wiki mod id(s) (see wikiModTierSpawnRepair).`,
    );
  }

  const spawnPost = applyPoe2dbWikiSpawnPostCorrections(rows);
  if (spawnPost.correctionsApplied > 0) {
    // eslint-disable-next-line no-console -- CLI 진단
    console.log(
      `Applied PoE2DB spawn post-corrections for ${String(spawnPost.correctionsApplied)} wiki mod id(s) (see wikiTierSpawnExtractPostProcess).`,
    );
  }
  if (spawnPost.intelligenceHintsApplied > 0) {
    // eslint-disable-next-line no-console -- CLI 진단
    console.log(
      `Applied PoE2DB required-intelligence hints for ${String(spawnPost.intelligenceHintsApplied)} wiki mod id(s).`,
    );
  }

  assignSimulatorTiers(rows);

  const uniqueKeys = new Set(rows.map((row) => groupKey(row.modGroups, row.generationType)));

  const output: WikiItemModTiersFileType = {
    schemaVersion: POE2DB_STYLE_SCHEMA_VERSION,
    source: "poe2wiki_cargo",
    fetchedAtIso: new Date().toISOString(),
    filter: { domain: 1, generationTypes: [1, 2] },
    rowCount: rows.length,
    uniqueModGroupKeys: uniqueKeys.size,
    rows,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(output)}\n`, "utf8");

  const summary = {
    schemaVersion: output.schemaVersion,
    source: output.source,
    fetchedAtIso: output.fetchedAtIso,
    filter: output.filter,
    rowCount: output.rowCount,
    uniqueModGroupKeys: output.uniqueModGroupKeys,
    note: "Full data is in poe2wiki-item-mod-tiers.json (this file omits `rows` for quick inspection).",
  };
  fs.writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  const spawnUnions = buildSpawnTagUnionsPayload(rows);
  fs.writeFileSync(SPAWN_UNION_PATH, `${JSON.stringify(spawnUnions, null, 2)}\n`, "utf8");

  console.log(`Wrote ${OUT_PATH}`);
  console.log(`Wrote ${SUMMARY_PATH}`);
  console.log(`Wrote ${SPAWN_UNION_PATH}`);
  console.log(`Rows: ${String(output.rowCount)}, unique mod group keys: ${String(output.uniqueModGroupKeys)}`);
};

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
