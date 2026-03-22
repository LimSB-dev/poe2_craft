import type { CraftLabAbyssOmenIdType } from "@/lib/poe2-item-simulator/abyssCrafting";
import { isCraftLabAbyssOmenId } from "@/lib/poe2-item-simulator/abyssCrafting";
import type { CraftLabRitualOmenIdType } from "@/lib/poe2-item-simulator/ritualCrafting";
import { isCraftLabRitualOmenId } from "@/lib/poe2-item-simulator/ritualCrafting";

/** 크래프트 랩에서 한 번에 하나만 선택되는 징조(심연·의식). */
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
