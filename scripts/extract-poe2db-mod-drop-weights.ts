/**
 * PoE2DB 스폰 가중치 추출 — **동작 요약**
 *
 * 1. `/kr/Modifiers` 한 번 요청 → HTML 안의 모든 `#ModifiersCalc` 링크를 수집(슬러그 기준 중복 제거).
 * 2. **각 베이스 페이지**를 순서대로 요청하고, 페이지마다 `new ModsView(...)` JSON을 파싱한다.
 * 3. 각 페이지의 **`normal` 배열 전 행**을 순회한다(한 페이지 안에서는 빠짐없이 순회).
 * 4. 행마다 `DropChance`>1·`wikiModId` 해석 가능 → `weightsByWikiModId[id]`에 기록.
 *    동일 `wikiModId`가 여러 아이템 클래스 페이지에 나오면 **가장 큰 DropChance**를 남긴다(베이스별 표기 차이 흡수).
 *
 * 위 과정은 “모든 ModifiersCalc 페이지 × 각 페이지의 모든 normal 행”을 도는 것이 맞다.
 * 다만 **UI에 모드가 안 보이는 문제**는 대개 이 JSON이 아니라 `modDb.ts`의 `applicableSubTypes` 등
 * 시뮬레이터 매핑이 위키 스폰과 다를 때 발생한다.
 *
 * PoE2DB 각 베이스 `#ModifiersCalc` 페이지의 `ModsView`에서 `normal` 행의 `DropChance`를 읽어
 * 위키 `mods.id`와 동일한 키(`wikiModId`)로 매핑한다. (스폰 가중치 — 위키 Cargo `value` 플래그보다 정밀)
 *
 * **UI에 보이는 빨간 가중치 숫자**와 `DropChance`가 다를 수 있다(예: 900 vs 1000). 이 레포는 **`DropChance`만** 쓴다.
 * 이유·역추적 절차: `@/lib/poe2db/poe2dbModsViewWeightSemantics`
 *
 * `Code`가 없는 행은 `poe2wiki-item-mod-tiers.json`과 `(mod_groups, generation_type, required_level)`·스탯 숫자로
 * `wikiModId`를 해석한다(접두 생명력·마나·정확도 등 포함).
 *
 * `modDbTotalWeightHintsByModKey`: 각 `modKey`에 대해 위키 티어 후보의 PoE2DB 가중치 합(= `modDb.totalWeight` 교정 참고).
 * 티어 개수는 JSON에 중복 저장하지 않으며 `missingWikiModIds.length + tiersWithPoe2dbWeight`로 계산한다(`modDbTotalWeightHintTierCount`).
 * `yarn apply:poe2db-moddb-total-weights`로 `modDb.ts`의 `totalWeight`를 힌트로 일괄 갱신할 수 있다(누락 티어 없을 때만).
 *
 * `DropChance` ≤ 1 인 행은 무시(무기 지역 치명타·일부 함정 등 플레이스홀더).
 *
 * 동일 `wikiModId`가 페이지마다 다른 `DropChance`를 가질 수 있다. **`weightsByWikiModId`** 는 전 페이지
 * **max**(기존 호환·`modDbTotalWeightHints` 합산용). **`weightsByWikiModIdAndWikiSpawnTag`** 는
 * PoE2DB 슬러그→위키 스폰 태그(`helmet`, `body_armour`, …)별로 max를 따로 둔다 — `tryGetWikiModTiers`가 부위
 * 컨텍스트가 있으면 여기서 조회한다.
 *
 * 실행: `yarn extract:poe2db-mod-drop-weights`
 * 앱 반영: `cp data/generated/poe2db-mod-drop-weights.json src/lib/poe2-item-simulator/data/`
 */

import fs from "fs";
import path from "path";

import { POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG } from "@/lib/poe2db/poe2dbModifiersCalcSlugToWikiSpawnTag";
import { computeModDbTotalWeightHintsFromWeightsByWikiModId } from "@/lib/poe2-item-simulator/poe2dbModDbTotalWeightHints";
import { resolveWikiModIdForPoe2DbModsViewNormalRow } from "@/lib/poe2-item-simulator/poe2dbModsViewWikiModIdResolve";
import type { WikiItemModTiersFileType } from "@/lib/poe2-item-simulator/wikiModTierTypes";
import wikiModTierPayload from "@/lib/poe2-item-simulator/data/poe2wiki-item-mod-tiers.json";

const ROOT_URL = "https://poe2db.tw";
const MODIFIERS_URL = `${ROOT_URL}/kr/Modifiers`;
const OUT_PATH = path.join(process.cwd(), "data/generated/poe2db-mod-drop-weights.json");

const wikiTierRows = (wikiModTierPayload as WikiItemModTiersFileType).rows;
const WIKI_MOD_ID_SET = new Set(wikiTierRows.map((r) => r.wikiModId));

/**
 * `resolveWikiModIdForPoe2DbModsViewNormalRow`가 실패해도 `ModsView` 행에 `Code`(= 위키 `mods.id`)가 있으면
 * 가중치 추출에 한해 동일 id로 인정한다 — 투구/몸통 등 일부 페이지에서 스탯 문자열 매칭이 어긋나는 경우가 있다.
 */
const resolveWikiModIdForDropWeightExtraction = (
  row: Parameters<typeof resolveWikiModIdForPoe2DbModsViewNormalRow>[0],
): string | null => {
  const resolved = resolveWikiModIdForPoe2DbModsViewNormalRow(row, wikiTierRows);
  if (resolved !== null) {
    return resolved;
  }
  const code = typeof row.Code === "string" ? row.Code.trim() : "";
  if (code.length > 0 && WIKI_MOD_ID_SET.has(code)) {
    return code;
  }
  return null;
};

const REQUEST_HEADERS: HeadersInit = {
  "User-Agent": "poe2_craft-poe2db-drop-weight-extract/1.0 (+https://github.com/)",
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

const run = async (): Promise<void> => {
  console.log("Fetching /kr/Modifiers …");
  const modifiersHtml = await fetchText(MODIFIERS_URL);
  const links = extractModifierCalcLinks(modifiersHtml);
  console.log(`Found ${String(links.length)} #ModifiersCalc pages.`);

  const weightsByWikiModId: Record<string, number> = {};
  const weightsByWikiModIdAndWikiSpawnTag: Record<string, Record<string, number>> = {};
  /** PoE2DB `#ModifiersCalc` 페이지 슬러그별 — 방어구는 `Helmets_str` 등 능력치 페이지(`poe2dbStatAffinityPages`). */
  const weightsByWikiModIdAndPoe2DbPageSlug: Record<string, Record<string, number>> = {};
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
        /** `extract-poe2db-modifiers.ts`와 달리 접미 **이름**이 `- 절대군주`처럼 `- `로 시작할 수 있음. 구분선만 제외한다. */
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

        const wikiModId = resolveWikiModIdForDropWeightExtraction(
          row as Parameters<typeof resolveWikiModIdForPoe2DbModsViewNormalRow>[0],
        );
        if (wikiModId === null) {
          continue;
        }

        const prev = weightsByWikiModId[wikiModId];
        if (prev === undefined || drop > prev) {
          weightsByWikiModId[wikiModId] = drop;
        }

        let bySlug = weightsByWikiModIdAndPoe2DbPageSlug[wikiModId];
        if (bySlug === undefined) {
          bySlug = {};
          weightsByWikiModIdAndPoe2DbPageSlug[wikiModId] = bySlug;
        }
        const prevSlug = bySlug[link.slug];
        bySlug[link.slug] = prevSlug === undefined ? drop : Math.max(prevSlug, drop);

        const spawnTag = POE2DB_MODIFIERS_CALC_SLUG_TO_WIKI_SPAWN_TAG[link.slug];
        if (typeof spawnTag === "string" && spawnTag.length > 0) {
          let byTag = weightsByWikiModIdAndWikiSpawnTag[wikiModId];
          if (byTag === undefined) {
            byTag = {};
            weightsByWikiModIdAndWikiSpawnTag[wikiModId] = byTag;
          }
          const prevTag = byTag[spawnTag];
          byTag[spawnTag] = prevTag === undefined ? drop : Math.max(prevTag, drop);
        }
      }

      await delay(120);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed.push(`${link.slug}: ${message}`);
    }
  }

  const sortedKeys = Object.keys(weightsByWikiModId).sort((a, b) => a.localeCompare(b));
  const sortedWeights: Record<string, number> = {};
  for (const key of sortedKeys) {
    const v = weightsByWikiModId[key];
    if (v !== undefined) {
      sortedWeights[key] = v;
    }
  }

  const modDbTotalWeightHintsByModKey =
    computeModDbTotalWeightHintsFromWeightsByWikiModId(sortedWeights);

  const sortedSpawnModIds = Object.keys(weightsByWikiModIdAndWikiSpawnTag).sort((a, b) =>
    a.localeCompare(b),
  );
  const weightsByWikiModIdAndWikiSpawnTagSorted: Record<string, Record<string, number>> = {};
  for (const id of sortedSpawnModIds) {
    const inner = weightsByWikiModIdAndWikiSpawnTag[id];
    if (inner === undefined) {
      continue;
    }
    const sortedInner: Record<string, number> = {};
    for (const tag of Object.keys(inner).sort((a, b) => a.localeCompare(b))) {
      sortedInner[tag] = inner[tag] ?? 0;
    }
    weightsByWikiModIdAndWikiSpawnTagSorted[id] = sortedInner;
  }

  const sortedSlugModIds = Object.keys(weightsByWikiModIdAndPoe2DbPageSlug).sort((a, b) =>
    a.localeCompare(b),
  );
  const weightsByWikiModIdAndPoe2DbPageSlugSorted: Record<string, Record<string, number>> = {};
  for (const id of sortedSlugModIds) {
    const inner = weightsByWikiModIdAndPoe2DbPageSlug[id];
    if (inner === undefined) {
      continue;
    }
    const sortedInner: Record<string, number> = {};
    for (const slug of Object.keys(inner).sort((a, b) => a.localeCompare(b))) {
      sortedInner[slug] = inner[slug] ?? 0;
    }
    weightsByWikiModIdAndPoe2DbPageSlugSorted[id] = sortedInner;
  }

  const output = {
    schemaVersion: "poe2db-drop-chance@4" as const,
    source: "poe2db_modsview_normal_drop_chance",
    fetchedAtIso: new Date().toISOString(),
    pageCount: links.length,
    wikiModCount: sortedKeys.length,
    failedPages: failed,
    weightsByWikiModId: sortedWeights,
    weightsByWikiModIdAndWikiSpawnTag: weightsByWikiModIdAndWikiSpawnTagSorted,
    weightsByWikiModIdAndPoe2DbPageSlug: weightsByWikiModIdAndPoe2DbPageSlugSorted,
    modDbTotalWeightHintsByModKey,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote ${OUT_PATH}`);
  console.log(`Mapped ${String(sortedKeys.length)} wiki mod ids | failed: ${String(failed.length)}`);
};

void run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
