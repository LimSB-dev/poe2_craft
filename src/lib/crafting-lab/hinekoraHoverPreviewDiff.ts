import type { IItemRoll, IModDefinition } from "@/lib/poe2-item-simulator/types";

const modSignature = (mod: IModDefinition): string => {
  return [
    mod.modKey,
    String(mod.tier),
    mod.displayName,
    mod.modType,
    mod.isFractured === true ? "1" : "0",
  ].join("\u0001");
};

/**
 * 히네코라 예견 호버: 미리보기 롤의 각 접두/접미 슬롯이 베이스라인과 비교해
 * 새로 생기거나 바뀐 옵션인지(멀티셋 매칭) 판별한다.
 */
export const buildHinekoraExplicitSlotHighlights = (
  preview: IItemRoll,
  baseline: IItemRoll,
): { prefix: boolean[]; suffix: boolean[] } => {
  const counts = new Map<string, number>();
  const bump = (mod: IModDefinition, delta: number): void => {
    const sig = modSignature(mod);
    const next = (counts.get(sig) ?? 0) + delta;
    if (next <= 0) {
      counts.delete(sig);
      return;
    }
    counts.set(sig, next);
  };
  for (const m of baseline.prefixes) {
    bump(m, 1);
  }
  for (const m of baseline.suffixes) {
    bump(m, 1);
  }

  const markSlot = (mod: IModDefinition | undefined): boolean => {
    if (mod === undefined) {
      return false;
    }
    const sig = modSignature(mod);
    const c = counts.get(sig) ?? 0;
    if (c > 0) {
      bump(mod, -1);
      return false;
    }
    return true;
  };

  return {
    prefix: [0, 1, 2].map((i) => {
      return markSlot(preview.prefixes[i]);
    }),
    suffix: [0, 1, 2].map((i) => {
      return markSlot(preview.suffixes[i]);
    }),
  };
};
