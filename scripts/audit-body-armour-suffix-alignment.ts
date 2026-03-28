/**
 * 갑옷(bodyArmour) 접미 속성에 대해 위키 spawn·티어 수·PoE2DB 가중치 합을 modDb·힌트 JSON과 대조한다.
 *
 * 실행: `tsx scripts/audit-body-armour-suffix-alignment.ts`
 * (루트에서, `src` 경로 해석 가능한 환경 — package.json 과 동일)
 */

import fs from "fs";
import path from "path";

import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";
import { MOD_WIKI_TIER_SOURCES } from "@/lib/poe2-item-simulator/modWikiTierSources";
import { isRecordEligibleForBaseFilters } from "@/lib/poe2-item-simulator/roller";
import { getWikiModTierMergeCandidates } from "@/lib/poe2-item-simulator/wikiModTierCandidates";
import { modDbTotalWeightHintTierCount } from "@/lib/poe2-item-simulator/poe2dbModDbTotalWeightHints";
import {
  wikiSpawnRowMatchesBaseItem,
  wikiTierSpawnContextFromBaseFilters,
} from "@/lib/poe2-item-simulator/wikiTierSpawnFilter";

const WEIGHTS_PATH = path.join(process.cwd(), "data/generated/poe2db-mod-drop-weights.json");
const OUT_PATH = path.join(process.cwd(), "data/generated/body-armour-suffix-audit.json");

const BODY_STAT_TAG_COMBOS: readonly (readonly IBaseItemStatTagType[])[] = [
  ["str"],
  ["dex"],
  ["int"],
  ["str", "dex"],
  ["str", "int"],
  ["dex", "int"],
  ["str", "dex", "int"],
] as const;

type AuditIssueType = {
  modKey: string;
  statTags: readonly IBaseItemStatTagType[];
  kind: "spawn" | "tierCount" | "weightHint" | "missingWikiMapping" | "noCandidates";
  detail: string;
};

const main = (): void => {
  const raw = fs.readFileSync(WEIGHTS_PATH, "utf8");
  const parsed = JSON.parse(raw) as {
    modDbTotalWeightHintsByModKey?: Record<
      string,
      {
        suggestedTotalWeight: number;
        missingWikiModIds: readonly string[];
        tiersWithPoe2dbWeight: number;
      }
    >;
  };
  const hints = parsed.modDbTotalWeightHintsByModKey ?? {};

  const issues: AuditIssueType[] = [];
  const ok: string[] = [];

  const bodySuffixRecords = MOD_DB.records.filter((r) => {
    return r.modType === "suffix" && r.applicableSubTypes.includes("bodyArmour");
  });

  for (const record of bodySuffixRecords) {
    const modKey = record.modKey;
    const rule = MOD_WIKI_TIER_SOURCES[modKey];
    if (rule === undefined) {
      issues.push({
        modKey,
        statTags: [],
        kind: "missingWikiMapping",
        detail: "MOD_WIKI_TIER_SOURCES에 없음(위키 티어 대조 생략)",
      });
      continue;
    }

    const hint = hints[modKey];
    if (hint !== undefined && hint.missingWikiModIds.length > 0) {
      issues.push({
        modKey,
        statTags: [],
        kind: "weightHint",
        detail: `PoE2DB 가중치 누락 wikiModId: ${hint.missingWikiModIds.slice(0, 8).join(", ")}${hint.missingWikiModIds.length > 8 ? "…" : ""}`,
      });
    }

    if (hint !== undefined && record.totalWeight !== hint.suggestedTotalWeight) {
      issues.push({
        modKey,
        statTags: [],
        kind: "weightHint",
        detail: `modDb.totalWeight=${String(record.totalWeight)} vs PoE2DB 힌트 합=${String(hint.suggestedTotalWeight)} (티어 ${String(modDbTotalWeightHintTierCount(hint))}개)`,
      });
    }

    if (hint !== undefined && record.tierCount !== modDbTotalWeightHintTierCount(hint)) {
      issues.push({
        modKey,
        statTags: [],
        kind: "tierCount",
        detail: `modDb.tierCount=${String(record.tierCount)} vs 위키+PoE2DB 힌트 티어 수=${String(modDbTotalWeightHintTierCount(hint))}`,
      });
    }

    for (const statTags of BODY_STAT_TAG_COMBOS) {
      const filters = { baseItemSubType: "bodyArmour" as const, itemStatTags: statTags };
      if (!isRecordEligibleForBaseFilters(record, filters)) {
        continue;
      }

      const wikiCtx = wikiTierSpawnContextFromBaseFilters(filters);
      const candidates = getWikiModTierMergeCandidates(modKey, wikiCtx ?? undefined);

      if (candidates === null || candidates.length === 0) {
        issues.push({
          modKey,
          statTags,
          kind: "noCandidates",
          detail: "스폰 필터 후 위키 티어 후보 0개(폴백·매핑 확인 필요)",
        });
        continue;
      }

      for (const row of candidates) {
        if (wikiCtx !== undefined && !wikiSpawnRowMatchesBaseItem(row, wikiCtx)) {
          issues.push({
            modKey,
            statTags,
            kind: "spawn",
            detail: `wikiModId=${row.wikiModId} 가 현재 베이스 스폰 필터와 불일치`,
          });
        }
      }
    }

    ok.push(modKey);
  }

  const uniqueOk = [...new Set(ok)];
  const summary = {
    schemaVersion: "body-armour-suffix-audit@1" as const,
    fetchedAtIso: new Date().toISOString(),
    weightsFile: WEIGHTS_PATH,
    bodySuffixModCount: bodySuffixRecords.length,
    wikiMappedModKeys: uniqueOk.length,
    issueCount: issues.length,
    issues,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(`Wrote ${OUT_PATH}`);
  console.log(`Body suffix mods: ${String(bodySuffixRecords.length)}, issues: ${String(issues.length)}`);
  if (issues.length > 0) {
    console.log(JSON.stringify(issues.slice(0, 25), null, 2));
    if (issues.length > 25) {
      console.log(`… and ${String(issues.length - 25)} more`);
    }
  }
};

main();
