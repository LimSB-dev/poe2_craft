import type { ModTypeType } from "@/lib/poe2-item-simulator/types";

import type { IRlTrainDesiredModPayloadType } from "./rlTrainApiTypes";

const MOD_TYPES: ReadonlySet<string> = new Set([
  "prefix",
  "suffix",
  "corruptedPrefix",
  "corruptedSuffix",
]);

const MAX_DESIRED_MODS_IN_REQUEST: number = 6;
const MAX_STRING_LEN: number = 512;

const truncate = (value: string, max: number): string => {
  if (value.length <= max) {
    return value;
  }
  return value.slice(0, max);
};

/**
 * Validates and caps simulator → RL API `desiredMods` payload (DevTools / 서버 로그용).
 */
export const normalizeRlTrainDesiredMods = (raw: unknown): IRlTrainDesiredModPayloadType[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: IRlTrainDesiredModPayloadType[] = [];
  for (const item of raw) {
    if (out.length >= MAX_DESIRED_MODS_IN_REQUEST) {
      break;
    }
    if (!item || typeof item !== "object") {
      continue;
    }
    const rec = item as Record<string, unknown>;
    const id = typeof rec.id === "string" ? rec.id.trim() : "";
    const modKey = typeof rec.modKey === "string" ? rec.modKey.trim() : "";
    const nameTemplateKey =
      typeof rec.nameTemplateKey === "string" ? rec.nameTemplateKey.trim() : "";
    const modTypeRaw = rec.modType;
    if (
      id.length === 0 ||
      modKey.length === 0 ||
      typeof modTypeRaw !== "string" ||
      !MOD_TYPES.has(modTypeRaw)
    ) {
      continue;
    }
    out.push({
      id: truncate(id, MAX_STRING_LEN),
      modKey: truncate(modKey, MAX_STRING_LEN),
      nameTemplateKey: truncate(nameTemplateKey, MAX_STRING_LEN),
      modType: modTypeRaw as ModTypeType,
    });
  }
  return out;
};

export const parseRlTrainBaseItemKey = (raw: unknown): string | null => {
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 200) {
    return null;
  }
  if (!/^[\w-]+$/.test(trimmed)) {
    return null;
  }
  return trimmed;
};
