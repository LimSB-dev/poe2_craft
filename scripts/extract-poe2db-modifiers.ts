import fs from "fs";
import path from "path";

const ROOT_URL = "https://poe2db.tw";
const MODIFIERS_URL = `${ROOT_URL}/kr/Modifiers`;
const OUT_PATH = path.join(process.cwd(), "data/generated/poe2db-modifiers.full.json");
const SUMMARY_PATH = path.join(process.cwd(), "data/generated/poe2db-modifiers.summary.json");

const REQUEST_HEADERS: HeadersInit = {
  "User-Agent": "poe2_craft-poe2db-modifier-extract/1.0 (+https://github.com/)",
  Accept: "text/html,application/xhtml+xml",
};

type Poe2DbLinkType = {
  label: string;
  href: string;
  slug: string;
};

type ModsViewBaseItemType = {
  href?: string;
  cn?: string;
  link_name?: string;
  tags?: string;
  attr?: number[];
  opts?: Record<string, string>;
};

type ModsViewRowType = {
  Name?: string;
  Level?: string | number;
  ModGenerationTypeID?: string | number;
  ModFamilyList?: string[];
  DropChance?: string | number;
  str?: string;
  hover?: string;
  [key: string]: unknown;
};

type ModsViewPayloadType = {
  baseitem?: ModsViewBaseItemType;
  [section: string]: unknown;
};

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

type Poe2DbModifiersFileType = {
  source: "poe2db_modifiers_page";
  fetchedAtIso: string;
  pageCount: number;
  sectionKeys: string[];
  rowCount: number;
  rows: ExtractedModifierRowType[];
};

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

const stripHtmlTags = (value: string): string => {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, "\"")
    .replace(/\s+/g, " ")
    .trim();
};

const parseIntSafe = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.replace(/,/g, "").trim();
  if (normalized.length === 0) {
    return null;
  }
  const parsed = Number.parseInt(normalized, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const extractModifierCalcLinks = (html: string): Poe2DbLinkType[] => {
  const links: Poe2DbLinkType[] = [];
  const re = /<a[^>]+href="([^"]+#ModifiersCalc)"[^>]*>([\s\S]*?)<\/a>/g;
  let match = re.exec(html);
  while (match !== null) {
    const hrefRaw = match[1]?.trim() ?? "";
    const labelRaw = stripHtmlTags(match[2] ?? "");
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

  // Fallback: some pages embed links inside scripts, not anchor tags.
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

const extractRowsFromPayload = (
  payload: ModsViewPayloadType,
  source: Poe2DbLinkType,
): ExtractedModifierRowType[] => {
  const rows: ExtractedModifierRowType[] = [];
  const baseitem = payload.baseitem ?? {};

  for (const [section, raw] of Object.entries(payload)) {
    if (!Array.isArray(raw)) {
      continue;
    }
    let subgroup: string | null = null;

    for (const row of raw as ModsViewRowType[]) {
      const name = typeof row.Name === "string" ? row.Name.trim() : "";
      if (name.length === 0) {
        continue;
      }

      // poe2db uses separator rows such as "- 몽구스".
      if (name.startsWith("- ")) {
        subgroup = name.replace(/^-+\s*/, "").trim();
        continue;
      }

      const dropChanceRaw =
        row.DropChance === undefined || row.DropChance === null ? null : String(row.DropChance);
      const statLineText = typeof row.str === "string" ? stripHtmlTags(row.str) : "";
      const families = Array.isArray(row.ModFamilyList)
        ? row.ModFamilyList
            .filter((value): value is string => typeof value === "string")
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
        : [];

      rows.push({
        sourcePageSlug: source.slug,
        sourcePageLabel: source.label,
        sourcePageUrl: source.href,
        section,
        subgroup,
        modifierName: name,
        requiredLevel: parseIntSafe(row.Level),
        modGenerationTypeId: parseIntSafe(row.ModGenerationTypeID),
        modFamilies: families,
        statLineText,
        dropChanceRaw,
        dropChanceValue: parseIntSafe(dropChanceRaw),
        hoverUrl: typeof row.hover === "string" ? row.hover : null,
        applicableItemClass: {
          code: typeof baseitem.href === "string" ? baseitem.href : null,
          nameKo: typeof baseitem.cn === "string" ? baseitem.cn : null,
          tags: typeof baseitem.tags === "string" ? baseitem.tags : null,
          attrs: Array.isArray(baseitem.attr)
            ? baseitem.attr.filter((value): value is number => typeof value === "number")
            : [],
          options:
            baseitem.opts !== undefined && baseitem.opts !== null && typeof baseitem.opts === "object"
              ? (baseitem.opts as Record<string, string>)
              : {},
        },
      });
    }
  }

  return rows;
};

const run = async (): Promise<void> => {
  console.log("Fetching /kr/Modifiers …");
  const modifiersHtml = await fetchText(MODIFIERS_URL);
  const links = extractModifierCalcLinks(modifiersHtml);
  console.log(`Found ${String(links.length)} #ModifiersCalc pages.`);

  const allRows: ExtractedModifierRowType[] = [];
  const sectionKeys = new Set<string>();
  const failed: string[] = [];

  for (const link of links) {
    try {
      console.log(`- ${link.slug}`);
      const html = await fetchText(link.href.replace(/#ModifiersCalc$/, ""));
      const payload = parseModsViewPayload(html);
      const rows = extractRowsFromPayload(payload, link);
      for (const row of rows) {
        sectionKeys.add(row.section);
        allRows.push(row);
      }
      await delay(120);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed.push(`${link.slug}: ${message}`);
    }
  }

  const output: Poe2DbModifiersFileType = {
    source: "poe2db_modifiers_page",
    fetchedAtIso: new Date().toISOString(),
    pageCount: links.length,
    sectionKeys: [...sectionKeys].sort(),
    rowCount: allRows.length,
    rows: allRows,
  };

  const summary = {
    source: output.source,
    fetchedAtIso: output.fetchedAtIso,
    pageCount: output.pageCount,
    rowCount: output.rowCount,
    sectionKeys: output.sectionKeys,
    failed,
    note: "Full rows are stored in poe2db-modifiers.full.json",
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(output)}\n`, "utf8");
  fs.writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(`Wrote ${OUT_PATH}`);
  console.log(`Wrote ${SUMMARY_PATH}`);
  console.log(`Rows: ${String(output.rowCount)} | failed pages: ${String(failed.length)}`);
};

void run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

