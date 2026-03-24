import type { IBaseItemDbRecordType } from "@/lib/poe2-item-simulator/baseItemDb";
import {
  getAttributeRequirementPrefix,
  getLevelRequirementLabel,
} from "@/lib/poe2-item-simulator/coreAttributeLabels";

/**
 * Lv → STR → DEX → INT 순, 값이 0이면 제외.
 * 문구는 `data/coreAttributeLabels.json` + `coreAttributeLabels.ts`(로케일별)를 따른다.
 */
export const buildBaseItemRequirementLineParts = (
  record: IBaseItemDbRecordType,
  locale: string,
): string[] => {
  const parts: string[] = [];
  if (record.levelRequirement > 0) {
    parts.push(
      `${getLevelRequirementLabel(locale)} ${record.levelRequirement}`,
    );
  }
  if (record.requiredStrength > 0) {
    parts.push(
      `${getAttributeRequirementPrefix("str", locale)} ${record.requiredStrength}`,
    );
  }
  if (record.requiredDexterity > 0) {
    parts.push(
      `${getAttributeRequirementPrefix("dex", locale)} ${record.requiredDexterity}`,
    );
  }
  if (record.requiredIntelligence > 0) {
    parts.push(
      `${getAttributeRequirementPrefix("int", locale)} ${record.requiredIntelligence}`,
    );
  }
  return parts;
};
