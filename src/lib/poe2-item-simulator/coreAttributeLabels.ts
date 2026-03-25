import {
  resolveAppSupportedLocale,
  type AppSupportedLocaleType,
} from "@/lib/i18n/appLocales";

import coreAttributeLabelsJson from "./data/coreAttributeLabels.json";

export type CoreAttributeLocaleRowType = {
  requirementPrefix: string;
  displayName: string;
};

export type CoreAttributeLabelsFileType = {
  version: string;
  reference: string;
  levelRequirementLabel: Record<AppSupportedLocaleType, string>;
  attributes: Record<
    IBaseItemStatTagType,
    Record<AppSupportedLocaleType, CoreAttributeLocaleRowType>
  >;
};

const FILE = coreAttributeLabelsJson as CoreAttributeLabelsFileType;

const DEFAULT_LOCALE: AppSupportedLocaleType = "en";

export const CORE_ATTRIBUTE_LABELS_VERSION: string = FILE.version;

export const getLevelRequirementLabel = (locale: string): string => {
  const loc = resolveAppSupportedLocale(locale);
  const label = FILE.levelRequirementLabel[loc];
  if (label !== undefined && label.length > 0) {
    return label;
  }
  return FILE.levelRequirementLabel[DEFAULT_LOCALE] ?? "Lv";
};

export const getAttributeRequirementPrefix = (
  attr: IBaseItemStatTagType,
  locale: string,
): string => {
  const loc = resolveAppSupportedLocale(locale);
  const row = FILE.attributes[attr]?.[loc];
  if (row !== undefined && row.requirementPrefix.length > 0) {
    return row.requirementPrefix;
  }
  return FILE.attributes[attr]?.[DEFAULT_LOCALE]?.requirementPrefix ?? attr.toUpperCase();
};

export const getAttributeDisplayName = (
  attr: IBaseItemStatTagType,
  locale: string,
): string => {
  const loc = resolveAppSupportedLocale(locale);
  const row = FILE.attributes[attr]?.[loc];
  if (row !== undefined && row.displayName.length > 0) {
    return row.displayName;
  }
  return FILE.attributes[attr]?.[DEFAULT_LOCALE]?.displayName ?? attr.toUpperCase();
};

/**
 * Single-line summary for tables: STR/DEX/INT (localized) · level (localized label).
 */
export const formatBaseItemRequirementSummary = (
  record: Pick<
    IBaseItemDbRecordType,
    | "requiredStrength"
    | "requiredDexterity"
    | "requiredIntelligence"
    | "levelRequirement"
  >,
  locale: string,
): string => {
  const loc = resolveAppSupportedLocale(locale);
  const sep = " · ";
  const parts: string[] = [];
  if (record.requiredStrength > 0) {
    parts.push(
      `${getAttributeRequirementPrefix("str", loc)} ${record.requiredStrength}`,
    );
  }
  if (record.requiredDexterity > 0) {
    parts.push(
      `${getAttributeRequirementPrefix("dex", loc)} ${record.requiredDexterity}`,
    );
  }
  if (record.requiredIntelligence > 0) {
    parts.push(
      `${getAttributeRequirementPrefix("int", loc)} ${record.requiredIntelligence}`,
    );
  }
  parts.push(`${getLevelRequirementLabel(loc)} ${record.levelRequirement}`);
  return parts.join(sep);
};
