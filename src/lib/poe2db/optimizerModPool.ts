import type { IModDefinition } from "@/lib/poe2-item-simulator/types";
import type { IPoe2DbImportResultType } from "@/lib/poe2db/schema";

const inferModType = (name: string, url: string): "prefix" | "suffix" => {
  const lower = `${name} ${url}`.toLowerCase();
  if (lower.includes("prefix")) {
    return "prefix";
  }
  if (lower.includes("suffix")) {
    return "suffix";
  }

  let hash = 0;
  for (let index = 0; index < lower.length; index += 1) {
    hash += lower.charCodeAt(index);
  }
  return hash % 2 === 0 ? "prefix" : "suffix";
};

const inferTier = (name: string): number => {
  const tierMatch = name.match(/(?:^|\s)t(?:ier)?\s*([1-5])(?:\s|$)/i);
  if (tierMatch?.[1]) {
    return Number.parseInt(tierMatch[1], 10);
  }
  return 1;
};

const inferWeight = (name: string): number => {
  const lower = name.toLowerCase();
  if (lower.includes("rare")) {
    return 8;
  }
  if (lower.includes("common")) {
    return 20;
  }
  return 12;
};

const toKey = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const isModifierCandidate = (params: { kind: string; url: string; name: string }): boolean => {
  if (params.kind === "modifier") {
    return true;
  }

  const lower = `${params.url} ${params.name}`.toLowerCase();
  if (lower.includes("modifier")) {
    return true;
  }
  if (lower.includes("mod")) {
    return true;
  }
  return false;
};

export const toOptimizerModPoolFromPoe2Db = (
  importResult: IPoe2DbImportResultType
): IModDefinition[] => {
  const dedupe = new Set<string>();
  const candidates = importResult.entities.filter((entity) => {
    return isModifierCandidate({
      kind: entity.kind,
      url: entity.url,
      name: entity.name,
    });
  });

  const modPool: IModDefinition[] = [];
  for (const candidate of candidates) {
    const modKey = `poe2db_${toKey(candidate.key || candidate.name)}`;
    if (dedupe.has(modKey)) {
      continue;
    }
    dedupe.add(modKey);

    modPool.push({
      modKey,
      displayName: candidate.name,
      tier: inferTier(candidate.name),
      modType: inferModType(candidate.name, candidate.url),
      weight: inferWeight(candidate.name),
    });
  }

  return modPool;
};
