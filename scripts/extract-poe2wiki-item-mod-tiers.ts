/**
 * poe2wiki Cargo `mods` (domain=1, prefix/suffix) + `mod_stats` + `mod_spawn_weights` 전량을
 * 끌어와 `data/generated/poe2wiki-item-mod-tiers.json` 에 저장한다.
 *
 * 시뮬의 `modDb`는 `tiers` 배열이 비어 있고 `MOD_POOL`이 사실상 티어 1만 쓰는 상태이므로,
 * 이 JSON은 **속성(모드) 그룹별 실제 티어 사다리**를 외부 참고·향후 modDb 이식용으로 쓴다.
 *
 * 실행: `yarn extract:mod-tiers`
 * 테스트용 상한: `MAX_MODS=500 yarn extract:mod-tiers`
 *
 * 앱 번들에 반영하려면 생성 후 다음으로 복사한다:
 * `cp data/generated/poe2wiki-item-mod-tiers.json src/lib/poe2-item-simulator/data/poe2wiki-item-mod-tiers.json`
 * (`modWikiTierSources.ts` 매핑과 함께 커밋)
 */

import fs from "fs";
import path from "path";

const WIKI_API = "https://www.poe2wiki.net/w/api.php";
const OUT_PATH = path.join(process.cwd(), "data/generated/poe2wiki-item-mod-tiers.json");
const SUMMARY_PATH = path.join(process.cwd(), "data/generated/poe2wiki-item-mod-tiers.summary.json");

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

type WikiModStatRangeType = {
  statId: string;
  min: number;
  max: number;
};

type WikiModSpawnWeightType = {
  ordinal: number;
  tag: string;
  value: number;
};

export type WikiExtractedModTierRowType = {
  wikiModId: string;
  /** Cargo `mod_groups` 원문 (복수 그룹은 ` • ` 등으로 구분될 수 있음). */
  modGroups: string;
  generationType: 1 | 2;
  requiredLevel: number;
  tierText: string | null;
  statText: string | null;
  name: string | null;
  statRanges: WikiModStatRangeType[];
  spawnWeights: WikiModSpawnWeightType[];
  /**
   * 동일 (modGroups + generationType) 내에서 `requiredLevel` 내림차순 정렬 시 부여하는 티어.
   * 시뮬 `IModTierType` 규칙과 맞춤: **1 = 최상(일반적으로 높은 요구 레벨)**.
   */
  simulatorTierWithinGroup: number;
};

export type WikiItemModTiersFileType = {
  source: "poe2wiki_cargo";
  fetchedAtIso: string;
  filter: {
    domain: number;
    generationTypes: readonly [1, 2];
  };
  rowCount: number;
  uniqueModGroupKeys: number;
  rows: WikiExtractedModTierRowType[];
};

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

const fetchStatsForIds = async (ids: readonly string[]): Promise<Map<string, WikiModStatRangeType[]>> => {
  const map = new Map<string, WikiModStatRangeType[]>();
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

const fetchSpawnForIds = async (ids: readonly string[]): Promise<Map<string, WikiModSpawnWeightType[]>> => {
  const map = new Map<string, WikiModSpawnWeightType[]>();
  if (ids.length === 0) {
    return map;
  }
  const where = `m.domain=1 AND (m.generation_type=1 OR m.generation_type=2) AND m.id IN (${buildInList(ids)})`;
  const payload = await cargoQuery({
    action: "cargoquery",
    tables: "mods=m,mod_spawn_weights=sw",
    join_on: "m._pageName=sw._pageName",
    fields: "m.id,sw.ordinal,sw.tag,sw.value",
    where,
    limit: "5000",
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
  for (const [, weights] of map) {
    weights.sort((a, b) => a.ordinal - b.ordinal);
  }
  return map;
};

const groupKey = (modGroups: string, generationType: 1 | 2): string => {
  return `${String(generationType)}::${modGroups}`;
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

  const statMap = new Map<string, WikiModStatRangeType[]>();
  const spawnMap = new Map<string, WikiModSpawnWeightType[]>();

  for (let index = 0; index < ids.length; index += ID_CHUNK) {
    const chunk = ids.slice(index, index + ID_CHUNK);
    console.log(`Fetching stats & spawn weights ${String(index + 1)}–${String(index + chunk.length)} / ${String(ids.length)}…`);
    const [stats, spawns] = await Promise.all([
      fetchStatsForIds(chunk),
      fetchSpawnForIds(chunk),
    ]);
    for (const [k, v] of stats) {
      statMap.set(k, v);
    }
    for (const [k, v] of spawns) {
      spawnMap.set(k, v);
    }
  }

  const rows: WikiExtractedModTierRowType[] = summaries
    .map((summary) => {
      const wikiModId = summary.id;
      if (wikiModId === undefined) {
        return null;
      }
      const gen = parseIntSafe(summary["generation type"], 0);
      if (gen !== 1 && gen !== 2) {
        return null;
      }
      const modGroups = summary["mod groups"] ?? "";
      return {
        wikiModId,
        modGroups,
        generationType: gen as 1 | 2,
        requiredLevel: parseIntSafe(summary["required level"], 0),
        tierText: summary["tier text"] ?? null,
        statText: summary["stat text"] ?? null,
        name: summary.name ?? null,
        statRanges: statMap.get(wikiModId) ?? [],
        spawnWeights: spawnMap.get(wikiModId) ?? [],
        simulatorTierWithinGroup: 0,
      };
    })
    .filter((row): row is WikiExtractedModTierRowType => row !== null);

  assignSimulatorTiers(rows);

  const uniqueKeys = new Set(rows.map((row) => groupKey(row.modGroups, row.generationType)));

  const output: WikiItemModTiersFileType = {
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
    source: output.source,
    fetchedAtIso: output.fetchedAtIso,
    filter: output.filter,
    rowCount: output.rowCount,
    uniqueModGroupKeys: output.uniqueModGroupKeys,
    note: "Full data is in poe2wiki-item-mod-tiers.json (this file omits `rows` for quick inspection).",
  };
  fs.writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(`Wrote ${OUT_PATH}`);
  console.log(`Wrote ${SUMMARY_PATH}`);
  console.log(`Rows: ${String(output.rowCount)}, unique mod group keys: ${String(output.uniqueModGroupKeys)}`);
};

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
