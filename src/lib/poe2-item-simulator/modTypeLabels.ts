import {
  resolveAppSupportedLocale,
  type AppSupportedLocaleType,
} from "@/lib/i18n/appLocales";

import modTypeLabelsJson from "@/lib/poe2-item-simulator/data/modTypeLabels.json";

export type ModTypeLabelRowType = {
  displayName: string;
};

export type ModTypeLabelsFileType = {
  version: string;
  reference: string;
  labels: Record<ModTypeType, Record<AppSupportedLocaleType, ModTypeLabelRowType>>;
};

const FILE = modTypeLabelsJson as ModTypeLabelsFileType;

const DEFAULT_LOCALE: AppSupportedLocaleType = "en";

export const MOD_TYPE_LABELS_VERSION: string = FILE.version;

/**
 * Localized label for a simulator `ModTypeType` (standard vs corrupted prefix/suffix).
 * Source: `data/modTypeLabels.json`.
 */
export const getModTypeDisplayName = (
  modType: ModTypeType,
  locale: string,
): string => {
  const loc = resolveAppSupportedLocale(locale);
  const row = FILE.labels[modType]?.[loc];
  if (row !== undefined && row.displayName.length > 0) {
    return row.displayName;
  }
  const fallback = FILE.labels[modType]?.[DEFAULT_LOCALE]?.displayName;
  if (fallback !== undefined && fallback.length > 0) {
    return fallback;
  }
  return modType;
};
