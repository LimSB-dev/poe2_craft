import type { CraftLabPreviewRowType } from "@/lib/crafting-lab/craftLabOrbPreview";

export type CraftLabPreviewSortModeType = "family" | "probability" | "tier" | "weight";

const maxProbabilityInGroup = (group: readonly CraftLabPreviewRowType[]): number => {
  return Math.max(...group.map((r) => {
    return r.probability;
  }));
};

/**
 * 기본(패밀리): 같은 `nameTemplateKey`(표시용 한 줄)끼리 묶고, 패밀리 순서는 패밀리 내 최대 확률 내림차순, 패밀리 안에서는 확률 내림차순.
 */
export const sortCraftLabPreviewRows = (
  rows: readonly CraftLabPreviewRowType[],
  mode: CraftLabPreviewSortModeType,
): CraftLabPreviewRowType[] => {
  const copy = [...rows];
  if (mode === "family") {
    const byFamily = new Map<string, CraftLabPreviewRowType[]>();
    for (const row of copy) {
      const k = row.nameTemplateKey;
      const list = byFamily.get(k);
      if (list === undefined) {
        byFamily.set(k, [row]);
      } else {
        list.push(row);
      }
    }
    const families = [...byFamily.values()].sort((a, b) => {
      return maxProbabilityInGroup(b) - maxProbabilityInGroup(a);
    });
    const out: CraftLabPreviewRowType[] = [];
    for (const group of families) {
      const sorted = [...group].sort((a, b) => {
        return b.probability - a.probability;
      });
      out.push(...sorted);
    }
    return out;
  }
  if (mode === "probability") {
    return copy.sort((a, b) => {
      return b.probability - a.probability;
    });
  }
  if (mode === "tier") {
    return copy.sort((a, b) => {
      return a.tier - b.tier;
    });
  }
  return copy.sort((a, b) => {
    return b.weight - a.weight;
  });
};
