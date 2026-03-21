import type {
  IPoe2DbAnchorType,
  IPoe2DbEntityType,
  IPoe2DbImportResultType,
} from "@/lib/poe2db/schema";
import { normalizePoe2DbAnchor } from "@/lib/poe2db/normalize";

const DEFAULT_BASE_URL: string = "https://poe2db.tw";

const stripTags = (value: string): string => {
  return value.replace(/<[^>]+>/g, "");
};

const normalizeWhitespace = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

const toAbsoluteUrl = (baseUrl: string, href: string): string => {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return `${baseUrl}${href.startsWith("/") ? href : `/${href}`}`;
  }
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
    const entity = normalizePoe2DbAnchor({
      baseUrl: params.baseUrl,
      pageUrl: params.pageUrl,
      anchor,
      patchVersion: params.patchVersion,
      importedAt: params.importedAt,
    });
    if (entity === null) {
      continue;
    }
    if (dedupe.has(entity.id)) {
      continue;
    }

    dedupe.add(entity.id);
    entities.push(entity);
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
