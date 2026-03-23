import type {
  IBaseItemEquipmentTypeType,
  IBaseItemSubTypeType,
} from "@/lib/poe2-item-simulator/baseItemDb";

import baseItemImageMeta from "../../../data/generated/base-item-image-meta.json";

const BASE_ITEM_IMAGE_ROOT_PATH: string = "/images/items";

type BaseItemImageMetaRowType = {
  englishDisplayName: string;
  poe2dbSlug: string;
};

type BaseItemImageMetaFileType = Record<string, BaseItemImageMetaRowType>;

const BASE_ITEM_IMAGE_META = baseItemImageMeta as BaseItemImageMetaFileType;

const sanitizeImageNameToken = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * 아이템 영문명을 파일명 slug로 변환한다. 예) "Orb of Annulment" -> "orb-of-annulment"
 */
export const toBaseItemImageFileSlug = (itemEnglishName: string): string => {
  return sanitizeImageNameToken(itemEnglishName);
};

export const getBaseItemImageEnglishName = (baseItemKey: string): string | undefined => {
  return BASE_ITEM_IMAGE_META[baseItemKey]?.englishDisplayName;
};

type BaseItemImagePathParamsType = {
  baseItemKey: string;
  equipmentType: IBaseItemEquipmentTypeType;
  subType: IBaseItemSubTypeType;
  /**
   * 메타(`data/generated/base-item-image-meta.json`)보다 우선한다.
   * 크래프트 랩 등에서 별도 영문명을 알고 있을 때만 사용.
   */
  itemEnglishName?: string;
};

/**
 * public 하이라키 규칙:
 * /public/images/items/{equipmentType}/{subType}/{item-english-name-slug}.webp
 *
 * 영문 표기는 PoE2DB 동기화 스크립트가 생성한 메타를 우선한다.
 */
export const getBaseItemImageUrl = ({
  baseItemKey,
  equipmentType,
  subType,
  itemEnglishName,
}: BaseItemImagePathParamsType): string => {
  const metaEnglish = BASE_ITEM_IMAGE_META[baseItemKey]?.englishDisplayName;
  const trimmedOverride = itemEnglishName?.trim();
  const resolvedEnglish =
    trimmedOverride && trimmedOverride.length > 0
      ? trimmedOverride
      : (metaEnglish ?? baseItemKey);
  const slug = toBaseItemImageFileSlug(resolvedEnglish);
  return `${BASE_ITEM_IMAGE_ROOT_PATH}/${equipmentType}/${subType}/${slug}.webp`;
};
