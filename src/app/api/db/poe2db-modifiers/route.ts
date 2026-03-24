import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

import type {
  Poe2DbModifierApiResponseType,
  Poe2DbModifierApiRowType,
} from "@/lib/poe2-item-simulator/poe2dbModifiersApiTypes";

type ExtractedModifierRowType = {
  sourcePageSlug: string;
  section: string;
  subgroup: string | null;
  modifierName: string;
  requiredLevel: number | null;
  modGenerationTypeId: number | null;
  modFamilies: string[];
  statLineText: string;
  dropChanceValue: number | null;
  applicableItemClass: {
    code: string | null;
    tags: string | null;
  };
};

type ExtractedModifiersFileType = {
  fetchedAtIso: string;
  rowCount: number;
  rows: ExtractedModifierRowType[];
};

const SOURCE_PATH = path.join(process.cwd(), "data/generated/poe2db-modifiers.full.json");

let cachedResponse: Poe2DbModifierApiResponseType | null = null;

const buildResponse = (): Poe2DbModifierApiResponseType => {
  if (cachedResponse !== null) {
    return cachedResponse;
  }

  const raw = fs.readFileSync(SOURCE_PATH, "utf8");
  const parsed = JSON.parse(raw) as ExtractedModifiersFileType;
  const rows: Poe2DbModifierApiRowType[] = parsed.rows.map((row) => {
    return {
      sourcePageSlug: row.sourcePageSlug,
      section: row.section,
      subgroup: row.subgroup,
      modifierName: row.modifierName,
      requiredLevel: row.requiredLevel,
      modGenerationTypeId: row.modGenerationTypeId,
      modFamilies: row.modFamilies,
      statLineText: row.statLineText,
      dropChanceValue: row.dropChanceValue,
      itemClassCode: row.applicableItemClass.code,
      itemClassTags: row.applicableItemClass.tags,
    };
  });

  cachedResponse = {
    fetchedAtIso: parsed.fetchedAtIso,
    rowCount: parsed.rowCount,
    rows,
  };
  return cachedResponse;
};

export const GET = (): NextResponse<Poe2DbModifierApiResponseType | { error: string }> => {
  try {
    const response = buildResponse();
    return NextResponse.json(response, { status: 200 });
  } catch {
    return NextResponse.json({ error: "failed_to_load_poe2db_modifiers" }, { status: 500 });
  }
};

