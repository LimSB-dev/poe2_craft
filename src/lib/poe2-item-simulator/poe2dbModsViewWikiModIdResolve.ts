import type { WikiExtractedModTierRowType } from "@/lib/poe2-item-simulator/wikiModTierTypes";
import {
  type Poe2DbModsViewRowForInferenceType,
  inferWikiModIdFromPoe2DbModsViewNormalRow,
} from "@/lib/poe2-item-simulator/poe2dbModsViewWikiModIdInference";
import { wikiRowStatPower } from "@/lib/poe2-item-simulator/wikiModTierCandidates";

const parsePositiveInt = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value !== "string") {
    return null;
  }
  const parsed = Number.parseInt(value.replace(/,/g, "").trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const extractIntegersFromHtml = (html: string): number[] => {
  const plain = html.replace(/<[^>]+>/g, " ");
  const matches = plain.match(/-?\d[\d,]*/g) ?? [];
  const out: number[] = [];
  for (const m of matches) {
    const parsed = Number.parseInt(m.replace(/,/g, ""), 10);
    if (!Number.isNaN(parsed)) {
      out.push(parsed);
    }
  }
  return out;
};

const scoreWikiRowAgainstPoe2DbStr = (
  poe2dbStr: string,
  wiki: WikiExtractedModTierRowType,
): number => {
  const nums = extractIntegersFromHtml(poe2dbStr);
  if (nums.length === 0) {
    return 0;
  }
  const expected = new Set<number>();
  for (const s of wiki.statRanges) {
    expected.add(s.min);
    expected.add(s.max);
  }
  let hits = 0;
  for (const n of nums) {
    if (expected.has(n)) {
      hits += 3;
      continue;
    }
    for (const e of expected) {
      if (Math.abs(e - n) <= 1) {
        hits += 1;
        break;
      }
    }
  }
  return hits;
};

/**
 * PoE2DB `ModsView` `normal` 행 → 위키 `mods.id`.
 * - `Code`가 있으면 그대로 사용.
 * - 없으면 `poe2wiki-item-mod-tiers` 행과 `(mod_groups, generation_type, required_level)` 및 스탯 숫자로 매칭.
 * - 그다음 기존 `inferWikiModIdFromPoe2DbModsViewNormalRow`(접미 일부 패밀리 전용)로 폴백.
 */
export const resolveWikiModIdForPoe2DbModsViewNormalRow = (
  row: Poe2DbModsViewRowForInferenceType,
  wikiRows: readonly WikiExtractedModTierRowType[],
): string | null => {
  const familiesEarly = row.ModFamilyList ?? [];
  const famEarly = familiesEarly[0];
  let code = typeof row.Code === "string" ? row.Code.trim() : "";
  /**
   * PoE2DB `ModsView`가 방어구 `DefencesPercent` 줄에 전역 ES% `IncreasedEnergyShieldPercent*` Code를
   * 붙이는 경우가 있어, 로컬 사다리(`LocalIncreasedEnergyShieldPercent*`)와 가중치가 어긋난다.
   * 동일 패밀리·레벨에서 스탯 숫자로 위키 행을 고르도록 Code를 무시한다.
   */
  if (
    famEarly === "DefencesPercent" &&
    /^IncreasedEnergyShieldPercent\d+$/.test(code)
  ) {
    code = "";
  }
  if (code.length > 0 && /^[A-Za-z_]/.test(code)) {
    return code;
  }

  const gen = parsePositiveInt(row.ModGenerationTypeID);
  const level = parsePositiveInt(row.Level);
  const families = row.ModFamilyList ?? [];
  const fam = families[0];
  const str = typeof row.str === "string" ? row.str : "";

  if (fam === undefined || gen === null || level === null) {
    return inferWikiModIdFromPoe2DbModsViewNormalRow(row);
  }

  if (gen !== 1 && gen !== 2) {
    return inferWikiModIdFromPoe2DbModsViewNormalRow(row);
  }

  let candidates = wikiRows.filter((r) => {
    return r.modGroups === fam && r.generationType === gen && r.requiredLevel === level;
  });

  /**
   * `DefencesPercent`에는 동일 ilvl에 방어/회피/ES 단일·하이브리드 줄이 같이 있다.
   * PoE2DB HTML에 Armour/Evasion이 없으면(순수 ES % 등) 하이브리드 위키 행을 후보에서 제외한다.
   */
  if (fam === "DefencesPercent" && candidates.length > 1) {
    const stripped = str.replace(/<[^>]+>/g, " ").toLowerCase();
    const mentionsArmour = stripped.includes("armour");
    const mentionsEvasion = stripped.includes("evasion");
    if (!mentionsArmour && !mentionsEvasion) {
      const narrowed = candidates.filter((c) => {
        const t = (c.statText ?? "").replace(/\[\[/g, " ").toLowerCase();
        return !t.includes("armour") && !t.includes("evasion");
      });
      if (narrowed.length > 0) {
        candidates = narrowed;
      }
    }
  }

  if (candidates.length === 0) {
    return inferWikiModIdFromPoe2DbModsViewNormalRow(row);
  }

  if (candidates.length === 1) {
    const only = candidates[0];
    return only !== undefined ? only.wikiModId : null;
  }

  const legacy = inferWikiModIdFromPoe2DbModsViewNormalRow(row);
  if (legacy !== null && candidates.some((c) => c.wikiModId === legacy)) {
    return legacy;
  }

  const scored = candidates.map((c) => {
    return {
      row: c,
      score: scoreWikiRowAgainstPoe2DbStr(str, c),
    };
  });
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const powerDiff = wikiRowStatPower(b.row) - wikiRowStatPower(a.row);
    if (powerDiff !== 0) {
      return powerDiff;
    }
    return a.row.wikiModId.localeCompare(b.row.wikiModId);
  });
  const best = scored[0];
  return best?.row.wikiModId ?? null;
};
