import fs from "fs";
import path from "path";

import type { IModDbRecordType } from "@/lib/poe2-item-simulator/modDb";
import { MOD_DB } from "@/lib/poe2-item-simulator/modDb";
import koSimulatorMessages from "@/../messages/ko/simulator.json";

type ExtractedModifierRowType = {
  sourcePageSlug: string;
  sourcePageLabel: string;
  sourcePageUrl: string;
  section: string;
  subgroup: string | null;
  modifierName: string;
  requiredLevel: number | null;
  modGenerationTypeId: number | null;
  modFamilies: string[];
  statLineText: string;
  dropChanceRaw: string | null;
  dropChanceValue: number | null;
  hoverUrl: string | null;
  applicableItemClass: {
    code: string | null;
    nameKo: string | null;
    tags: string | null;
    attrs: number[];
    options: Record<string, string>;
  };
};

type ExtractFileType = {
  fetchedAtIso: string;
  rows: ExtractedModifierRowType[];
};

type KoSimulatorMessagesType = {
  mods?: Record<string, string>;
};

const IN_PATH = path.join(process.cwd(), "data/generated/poe2db-modifiers.full.json");
const OUT_FAMILY_PATH = path.join(
  process.cwd(),
  "data/generated/poe2db-modifiers.by-family.json",
);
const OUT_ITEM_CLASS_PATH = path.join(
  process.cwd(),
  "data/generated/poe2db-modifiers.by-item-class.json",
);
const OUT_MATCH_PATH = path.join(
  process.cwd(),
  "data/generated/poe2db-modifiers.moddb-match.json",
);

const compact = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

const toTokenSet = (value: string): Set<string> => {
  const normalized = value
    .toLowerCase()
    .replace(/[0-9]+/g, " ")
    .replace(/[()\-—~,+.%:/[\]<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = normalized
    .split(" ")
    .map((v) => v.trim())
    .filter((v) => v.length >= 2);
  return new Set(parts);
};

const overlapScore = (left: Set<string>, right: Set<string>): number => {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }
  let hit = 0;
  for (const token of left) {
    if (right.has(token)) {
      hit += 1;
    }
  }
  return hit / Math.max(left.size, right.size);
};

const generationTypeFromModRecord = (record: IModDbRecordType): number | null => {
  if (record.modType === "prefix") {
    return 1;
  }
  if (record.modType === "suffix") {
    return 2;
  }
  return null;
};

const buildFamilyIndex = (rows: readonly ExtractedModifierRowType[]): unknown => {
  const map = new Map<
    string,
    {
      family: string;
      rows: number;
      sections: Set<string>;
      minLevel: number | null;
      maxLevel: number | null;
      itemClasses: Set<string>;
      sampleStatLines: string[];
    }
  >();

  for (const row of rows) {
    for (const family of row.modFamilies) {
      const current = map.get(family) ?? {
        family,
        rows: 0,
        sections: new Set<string>(),
        minLevel: null,
        maxLevel: null,
        itemClasses: new Set<string>(),
        sampleStatLines: [],
      };
      current.rows += 1;
      current.sections.add(row.section);
      if (row.requiredLevel !== null) {
        current.minLevel =
          current.minLevel === null ? row.requiredLevel : Math.min(current.minLevel, row.requiredLevel);
        current.maxLevel =
          current.maxLevel === null ? row.requiredLevel : Math.max(current.maxLevel, row.requiredLevel);
      }
      if (row.applicableItemClass.code !== null) {
        current.itemClasses.add(row.applicableItemClass.code);
      }
      if (row.statLineText.length > 0 && current.sampleStatLines.length < 5) {
        current.sampleStatLines.push(row.statLineText);
      }
      map.set(family, current);
    }
  }

  const rowsOut = [...map.values()]
    .map((v) => {
      return {
        family: v.family,
        rows: v.rows,
        sections: [...v.sections].sort(),
        minLevel: v.minLevel,
        maxLevel: v.maxLevel,
        itemClasses: [...v.itemClasses].sort(),
        sampleStatLines: v.sampleStatLines,
      };
    })
    .sort((a, b) => b.rows - a.rows || a.family.localeCompare(b.family));

  return {
    count: rowsOut.length,
    rows: rowsOut,
  };
};

const buildItemClassIndex = (rows: readonly ExtractedModifierRowType[]): unknown => {
  const map = new Map<
    string,
    {
      code: string;
      nameKo: string | null;
      rows: number;
      sections: Map<string, number>;
      families: Map<string, number>;
    }
  >();

  for (const row of rows) {
    const code = row.applicableItemClass.code;
    if (code === null) {
      continue;
    }
    const current = map.get(code) ?? {
      code,
      nameKo: row.applicableItemClass.nameKo,
      rows: 0,
      sections: new Map<string, number>(),
      families: new Map<string, number>(),
    };
    current.rows += 1;
    current.sections.set(row.section, (current.sections.get(row.section) ?? 0) + 1);
    for (const family of row.modFamilies) {
      current.families.set(family, (current.families.get(family) ?? 0) + 1);
    }
    map.set(code, current);
  }

  const rowsOut = [...map.values()]
    .map((v) => {
      const topFamilies = [...v.families.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 15)
        .map(([family, count]) => ({ family, count }));
      const sections = [...v.sections.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([section, count]) => ({ section, count }));
      return {
        code: v.code,
        nameKo: v.nameKo,
        rows: v.rows,
        sections,
        topFamilies,
      };
    })
    .sort((a, b) => b.rows - a.rows || a.code.localeCompare(b.code));

  return {
    count: rowsOut.length,
    rows: rowsOut,
  };
};

const buildModDbMatch = (
  rows: readonly ExtractedModifierRowType[],
  modDbRecords: readonly IModDbRecordType[],
): unknown => {
  const koMods = (koSimulatorMessages as KoSimulatorMessagesType).mods ?? {};
  const results: Array<{
    modKey: string;
    modType: string;
    templateKo: string | null;
    candidates: Array<{
      family: string;
      score: number;
      sampleStatLine: string | null;
      itemClasses: string[];
      rows: number;
    }>;
  }> = [];

  const familyBucket = new Map<
    string,
    {
      rows: ExtractedModifierRowType[];
      tokenSet: Set<string>;
    }
  >();

  for (const row of rows) {
    if (row.modFamilies.length === 0) {
      continue;
    }
    for (const family of row.modFamilies) {
      const current = familyBucket.get(family) ?? { rows: [], tokenSet: new Set<string>() };
      current.rows.push(row);
      for (const token of toTokenSet(row.statLineText)) {
        current.tokenSet.add(token);
      }
      familyBucket.set(family, current);
    }
  }

  for (const record of modDbRecords) {
    const templateKo = koMods[record.nameTemplateKey] ?? null;
    const generationType = generationTypeFromModRecord(record);
    const templateTokens = templateKo === null ? new Set<string>() : toTokenSet(templateKo);

    const candidateRows: Array<{
      family: string;
      score: number;
      sampleStatLine: string | null;
      itemClasses: string[];
      rows: number;
    }> = [];

    for (const [family, bucket] of familyBucket) {
      const rowsOfFamily = bucket.rows.filter((r) => {
        if (generationType === null) {
          return true;
        }
        return r.modGenerationTypeId === generationType;
      });
      if (rowsOfFamily.length === 0) {
        continue;
      }

      const score = overlapScore(templateTokens, bucket.tokenSet);
      if (score <= 0) {
        continue;
      }

      const itemClasses = new Set<string>();
      for (const row of rowsOfFamily) {
        if (row.applicableItemClass.code !== null) {
          itemClasses.add(row.applicableItemClass.code);
        }
      }

      candidateRows.push({
        family,
        score,
        sampleStatLine: rowsOfFamily[0]?.statLineText ?? null,
        itemClasses: [...itemClasses].sort(),
        rows: rowsOfFamily.length,
      });
    }

    candidateRows.sort((a, b) => b.score - a.score || b.rows - a.rows || a.family.localeCompare(b.family));

    results.push({
      modKey: record.modKey,
      modType: record.modType,
      templateKo,
      candidates: candidateRows.slice(0, 8),
    });
  }

  return {
    rowCount: results.length,
    rows: results,
  };
};

const run = (): void => {
  const raw = fs.readFileSync(IN_PATH, "utf8");
  const extracted = JSON.parse(raw) as ExtractFileType;
  const rows = extracted.rows;

  const familyIndex = buildFamilyIndex(rows);
  const itemClassIndex = buildItemClassIndex(rows);
  const modDbMatch = buildModDbMatch(rows, MOD_DB.records);

  fs.writeFileSync(OUT_FAMILY_PATH, `${JSON.stringify(familyIndex, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUT_ITEM_CLASS_PATH, `${JSON.stringify(itemClassIndex, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUT_MATCH_PATH, `${JSON.stringify(modDbMatch, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        sourceRows: rows.length,
        familyIndexPath: OUT_FAMILY_PATH,
        itemClassIndexPath: OUT_ITEM_CLASS_PATH,
        modDbMatchPath: OUT_MATCH_PATH,
      },
      null,
      2,
    ),
  );
};

run();

