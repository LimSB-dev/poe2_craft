import type {
  IPoe2DbAnchorType,
  IPoe2DbEntityKindType,
  IPoe2DbEntityType,
  IPoe2DbImportResultType,
} from "@/lib/poe2db/schema";

const DEFAULT_BASE_URL: string = "https://poe2db.tw";

const normalizeWhitespace = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

const stripTags = (value: string): string => {
  return value.replace(/<[^>]+>/g, "");
};

const toAbsoluteUrl = (baseUrl: string, href: string): string => {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return `${baseUrl}${href.startsWith("/") ? href : `/${href}`}`;
  }
};

const toKey = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const inferKind = (url: string, text: string): IPoe2DbEntityKindType => {
  const lower = `${url} ${text}`.toLowerCase();
  if (lower.includes("essence")) {
    return "essence";
  }
  if (lower.includes("omen")) {
    return "omen";
  }
  if (lower.includes("currency")) {
    return "currency";
  }
  if (lower.includes("modifier") || lower.includes("mod")) {
    return "modifier";
  }
  if (lower.includes("item")) {
    return "base_item";
  }
  return "unknown";
};

const extractPatchVersion = (html: string): string | null => {
  const versionMatch = html.match(/(\d+\.\d+(?:\.\d+)?)/);
  if (versionMatch?.[1]) {
    return versionMatch[1];
  }
  return null;
};

const extractAnchorsFromHtml = (html: string): IPoe2DbAnchorType[] => {
  const anchors: IPoe2DbAnchorType[] = [];
  const anchorRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gim;
  let match: RegExpExecArray | null = anchorRegex.exec(html);

  while (match !== null) {
    const href = normalizeWhitespace(match[1] ?? "");
    const text = normalizeWhitespace(stripTags(match[2] ?? ""));
    if (href !== "" && text !== "") {
      anchors.push({ href, text });
    }
    match = anchorRegex.exec(html);
  }

  return anchors;
};

const toEntities = (params: {
  baseUrl: string;
  pageUrl: string;
  anchors: IPoe2DbAnchorType[];
  patchVersion: string | null;
  importedAt: string;
}): IPoe2DbEntityType[] => {
  const dedupe = new Set<string>();
  const entities: IPoe2DbEntityType[] = [];

  for (const anchor of params.anchors) {
    const url = toAbsoluteUrl(params.baseUrl, anchor.href);
    const name = anchor.text;
    const key = toKey(name);
    const id = `poe2db:${key}:${toKey(url)}`;
    if (dedupe.has(id)) {
      continue;
    }

    dedupe.add(id);
    entities.push({
      id,
      source: "poe2db",
      kind: inferKind(url, name),
      key,
      name,
      url,
      tags: [],
      patchVersion: params.patchVersion,
      updatedAt: params.importedAt,
      metadata: {
        pageUrl: params.pageUrl,
      },
    });
  }

  return entities;
};

const fetchHtml = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "user-agent": "poe2-craft-importer/0.1",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`PoE2DB fetch failed: ${response.status} ${response.statusText} (${url})`);
  }
  return response.text();
};

export const importFromPoe2DbPages = async (params?: {
  baseUrl?: string;
  paths?: string[];
}): Promise<IPoe2DbImportResultType> => {
  const baseUrl = params?.baseUrl ?? DEFAULT_BASE_URL;
  const paths = params?.paths ?? ["/"];
  const importedAt = new Date().toISOString();

  let patchVersion: string | null = null;
  let anchorCount = 0;
  const entities: IPoe2DbEntityType[] = [];
  const pageUrls: string[] = [];

  for (const path of paths) {
    const pageUrl = toAbsoluteUrl(baseUrl, path);
    const html = await fetchHtml(pageUrl);
    const anchors = extractAnchorsFromHtml(html);
    anchorCount += anchors.length;
    pageUrls.push(pageUrl);

    if (patchVersion === null) {
      patchVersion = extractPatchVersion(html);
    }

    const pageEntities = toEntities({
      baseUrl,
      pageUrl,
      anchors,
      patchVersion,
      importedAt,
    });
    entities.push(...pageEntities);
  }

  return {
    source: "poe2db",
    importedAt,
    patchVersion,
    baseUrl,
    pages: pageUrls,
    stats: {
      pageCount: pageUrls.length,
      anchorCount,
      entityCount: entities.length,
    },
    entities,
  };
};
