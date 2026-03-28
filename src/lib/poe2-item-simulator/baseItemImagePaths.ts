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

/**
 * `poe2dbBaseItems` 레코드의 `sourceUrl` 마지막 경로 조각(예: `Stocky_Mitts`)을
 * 파일 slug 계산에 쓰일 영문 라벨로 변환한다. PoE2DB 슬러그는 대체로 `_`로 단어가 구분된다.
 */
export const englishLabelGuessFromPoe2DbSourceUrl = (sourceUrl: string | undefined): string | undefined => {
  if (sourceUrl === undefined || sourceUrl.trim() === "") {
    return undefined;
  }
  try {
    const url = new URL(sourceUrl);
    const segments = url.pathname.split("/").filter((segment) => {
      return segment.length > 0;
    });
    const rawSlug = segments[segments.length - 1];
    if (rawSlug === undefined || rawSlug.length === 0) {
      return undefined;
    }
    return decodeURIComponent(rawSlug).replace(/_/g, " ");
  } catch {
    return undefined;
  }
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
  /** PoE2DB 상세 URL — 메타 키가 옛 스키마일 때 이미지 파일명과 맞추기 위한 fallback. */
  sourceUrl?: string;
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
  sourceUrl,
}: BaseItemImagePathParamsType): string => {
  const metaEnglish = BASE_ITEM_IMAGE_META[baseItemKey]?.englishDisplayName;
  const trimmedOverride = itemEnglishName?.trim();
  const fromSourceUrl = englishLabelGuessFromPoe2DbSourceUrl(sourceUrl);
  const resolvedEnglish =
    trimmedOverride && trimmedOverride.length > 0
      ? trimmedOverride
      : (metaEnglish ?? fromSourceUrl ?? baseItemKey);
  const slug = toBaseItemImageFileSlug(resolvedEnglish);
  return `${BASE_ITEM_IMAGE_ROOT_PATH}/${equipmentType}/${subType}/${slug}.webp`;
};
