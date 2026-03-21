import type { IBaseItemDbRecordType } from "@/lib/poe2-item-simulator/baseItemDb";

/** Lv → STR → DEX → INT 순, 값이 0이면 제외 */
export const buildBaseItemRequirementLineParts = (
  record: IBaseItemDbRecordType,
  translate: (key: string) => string,
): string[] => {
  const parts: string[] = [];
  if (record.levelRequirement > 0) {
    parts.push(
      `${translate("baseFilter.requiredLevel")} ${record.levelRequirement}`,
    );
  }
  if (record.requiredStrength > 0) {
    parts.push(
      `${translate("baseFilter.requiredStr")} ${record.requiredStrength}`,
    );
  }
  if (record.requiredDexterity > 0) {
    parts.push(
      `${translate("baseFilter.requiredDex")} ${record.requiredDexterity}`,
    );
  }
  if (record.requiredIntelligence > 0) {
    parts.push(
      `${translate("baseFilter.requiredInt")} ${record.requiredIntelligence}`,
    );
  }
  return parts;
};
