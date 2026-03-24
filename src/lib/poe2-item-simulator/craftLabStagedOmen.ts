import type { CraftLabAbyssOmenIdType } from "@/lib/poe2-item-simulator/abyss/abyssCrafting";
import { isCraftLabAbyssOmenId } from "@/lib/poe2-item-simulator/abyss/abyssCrafting";
import type { CraftLabRitualOmenIdType } from "@/lib/poe2-item-simulator/ritual/ritualCrafting";
import { isCraftLabRitualOmenId } from "@/lib/poe2-item-simulator/ritual/ritualCrafting";

/** 크래프트 랩에서 활성화 가능한 징조(심연·의식). */
export type CraftLabStagedOmenIdType =
  | CraftLabAbyssOmenIdType
  | CraftLabRitualOmenIdType;

export const isCraftLabStagedOmenId = (
  id: string,
): id is CraftLabStagedOmenIdType => {
  return isCraftLabAbyssOmenId(id) || isCraftLabRitualOmenId(id);
};

/** 보존된 뼈는 심연 징조만 소비 대상으로 사용. */
export const toAbyssOmenForBone = (
  id: CraftLabStagedOmenIdType | null,
): CraftLabAbyssOmenIdType | null => {
  if (id === null) {
    return null;
  }
  return isCraftLabAbyssOmenId(id) ? id : null;
};

/**
 * 심연 징조 중 보존된 뼈 1회에 **소모·적용**되는 대상이 아닌 것(다른 행동 전용).
 * 빛의 징조는 소멸(미공개 타락만) 경로에서만 쓰이므로 뼈에는 붙이지 않는다.
 */
const ABYSS_OMEN_IDS_EXCLUDED_FROM_PRESERVED_BONE: ReadonlySet<CraftLabAbyssOmenIdType> =
  new Set(["omen_light"]);

const FAMILY_DESECRATION_OMEN_IDS: ReadonlySet<CraftLabAbyssOmenIdType> =
  new Set([
    "omen_blackblooded",
    "omen_liege",
    "omen_sovereign",
  ]);

const NECROMANCY_SLOT_OMEN_IDS: ReadonlySet<CraftLabAbyssOmenIdType> = new Set([
  "omen_sinistral_necromancy",
  "omen_dextral_necromancy",
]);

/**
 * 활성 징조 목록에서 **보존된 뼈 한 번**에 실제로 전달할 심연 징조를 하나만 고른다.
 *
 * - 의식(Ritual) 징조는 여기서 제외(카오스·기타 전용).
 * - `omen_light`는 뼈 소모 대상에서 제외(소멸 전용).
 * - 부패(Putrefaction)는 다른 타락 보조 징조보다 우선(동시 스테이징 시 하나의 뼈에 하나만 적용).
 * - 가문(Blackblooded / Liege / Sovereign)은 동시에 둘 이상 의미 없음 → **스테이징 순서상 먼저** 것만.
 * - 시니스트럴/덱스트럴은 같은 뼈에 동시 적용 불가 → **스테이징 순서상 먼저** 것만.
 */
export const resolveStagedAbyssOmenForPreservedBone = (
  activeStagedOmenIds: readonly CraftLabStagedOmenIdType[],
): CraftLabAbyssOmenIdType | null => {
  const candidates: CraftLabAbyssOmenIdType[] = [];
  for (const id of activeStagedOmenIds) {
    const abyss = toAbyssOmenForBone(id);
    if (
      abyss !== null &&
      !ABYSS_OMEN_IDS_EXCLUDED_FROM_PRESERVED_BONE.has(abyss)
    ) {
      candidates.push(abyss);
    }
  }
  if (candidates.length === 0) {
    return null;
  }
  if (candidates.includes("omen_putrefaction")) {
    return "omen_putrefaction";
  }
  for (const id of activeStagedOmenIds) {
    const abyss = toAbyssOmenForBone(id);
    if (abyss !== null && FAMILY_DESECRATION_OMEN_IDS.has(abyss)) {
      return abyss;
    }
  }
  for (const id of activeStagedOmenIds) {
    const abyss = toAbyssOmenForBone(id);
    if (abyss !== null && NECROMANCY_SLOT_OMEN_IDS.has(abyss)) {
      return abyss;
    }
  }
  for (const id of activeStagedOmenIds) {
    const abyss = toAbyssOmenForBone(id);
    if (
      abyss !== null &&
      !ABYSS_OMEN_IDS_EXCLUDED_FROM_PRESERVED_BONE.has(abyss)
    ) {
      return abyss;
    }
  }
  return null;
};
