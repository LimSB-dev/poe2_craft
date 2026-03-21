import type {
  IPoe2DbAnchorType,
  IPoe2DbEntityKindType,
  IPoe2DbEntityType,
} from "@/lib/poe2db/schema";

type INormalizeAnchorParamsType = {
  baseUrl: string;
  pageUrl: string;
  anchor: IPoe2DbAnchorType;
  patchVersion: string | null;
  importedAt: string;
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

const toKey = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const classifyKind = (url: string, name: string): IPoe2DbEntityKindType => {
  const lower = `${url} ${name}`.toLowerCase();
  if (lower.includes("essence")) {
    return "essence";
  }
  if (lower.includes("omen")) {
    return "omen";
  }
  if (lower.includes("currency")) {
    return "currency";
  }
  if (lower.includes("modifier") || lower.includes("modifiers")) {
    return "modifier";
  }
  if (lower.includes("item")) {
    return "base_item";
  }
  return "unknown";
};

const inferTags = (url: string, name: string): string[] => {
  const lower = `${url} ${name}`.toLowerCase();
  const tags: string[] = [];

  if (lower.includes("prefix")) {
    tags.push("prefix");
  }
  if (lower.includes("suffix")) {
    tags.push("suffix");
  }
  if (lower.includes("tier")) {
    tags.push("tiered");
  }
  if (lower.includes("chaos")) {
    tags.push("chaos");
  }
  if (lower.includes("essence")) {
    tags.push("essence");
  }
  if (lower.includes("omen")) {
    tags.push("omen");
  }

  return Array.from(new Set(tags));
};

const parseTier = (name: string): number | null => {
  const tierMatch = name.match(/(?:^|\s)t(?:ier)?\s*([1-5])(?:\s|$)/i);
  if (tierMatch?.[1]) {
    return Number.parseInt(tierMatch[1], 10);
  }
  return null;
};

const buildId = (key: string, url: string): string => {
  return `poe2db:${key}:${toKey(url)}`;
};

export const normalizePoe2DbAnchor = (params: INormalizeAnchorParamsType): IPoe2DbEntityType | null => {
  const name = normalizeWhitespace(params.anchor.text);
  if (name === "") {
    return null;
  }

  const url = toAbsoluteUrl(params.baseUrl, params.anchor.href);
  const key = toKey(name);
  const tier = parseTier(name);
  const kind = classifyKind(url, name);
  const tags = inferTags(url, name);

  return {
    id: buildId(key, url),
    source: "poe2db",
    kind,
    key,
    name,
    url,
    tags,
    patchVersion: params.patchVersion,
    updatedAt: params.importedAt,
    metadata: {
      pageUrl: params.pageUrl,
      tier,
    },
  };
};
