import type { CraftLabPreviewRowType } from "@/lib/crafting-lab/craftLabOrbPreview";
import type { CraftLabPreviewSortModeType } from "@/lib/crafting-lab/sortCraftLabPreviewRows";

export type CraftLabPreviewFamilyGroupType = {
  nameTemplateKey: string;
  representativeModKey: string;
  tierCount: number;
  /** Sum of tier-level probabilities within this family (mutually exclusive tiers). */
  totalProbability: number;
  /** `poolFraction` 합(해당 접두/접미 풀에서 이 패밀리가 차지하는 비중). */
  totalPoolFraction: number;
  /** 동일 속성 티어 행들의 가중치 합(헤더 카드 가중치 열). */
  totalWeightSum: number;
  rows: CraftLabPreviewRowType[];
};

const maxProbabilityInGroup = (group: readonly CraftLabPreviewRowType[]): number => {
  return Math.max(
    ...group.map((r) => {
      return r.probability;
    }),
  );
};

const sortRowsInFamily = (
  group: CraftLabPreviewRowType[],
  mode: CraftLabPreviewSortModeType,
): CraftLabPreviewRowType[] => {
  const copy = [...group];
  if (mode === "family" || mode === "probability") {
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

/**
 * Groups preview rows by `nameTemplateKey` (display template), ordered by `sortMode` at the **family** level.
 * Tier rows inside each family follow the same mode.
 */
export const buildCraftLabPreviewFamilyGroups = (
  rows: readonly CraftLabPreviewRowType[],
  mode: CraftLabPreviewSortModeType,
): CraftLabPreviewFamilyGroupType[] => {
  const byFamily = new Map<string, CraftLabPreviewRowType[]>();
  for (const row of rows) {
    const k = row.nameTemplateKey;
    const list = byFamily.get(k);
    if (list === undefined) {
      byFamily.set(k, [row]);
    } else {
      list.push(row);
    }
  }

  const groups: CraftLabPreviewFamilyGroupType[] = [...byFamily.entries()].map(
    ([nameTemplateKey, groupRows]) => {
      const sorted = sortRowsInFamily(groupRows, mode);
      /** UI: 티어 숫자 큰 쪽(약한 롤)부터 위로 — Path of Crafting식 역순 스텝. */
      const rowsTierDescending = [...sorted].sort((a, b) => {
        if (b.tier !== a.tier) {
          return b.tier - a.tier;
        }
        return b.probability - a.probability;
      });
      const totalProbability = sorted.reduce((sum, r) => {
        return sum + r.probability;
      }, 0);
      const totalPoolFraction = sorted.reduce((sum, r) => {
        const pf = r.poolFraction;
        return sum + (pf !== undefined ? pf : 0);
      }, 0);
      const totalWeightSum = rowsTierDescending.reduce((sum, r) => {
        return sum + r.weight;
      }, 0);
      return {
        nameTemplateKey,
        representativeModKey: rowsTierDescending[0]?.modKey ?? "",
        tierCount: rowsTierDescending.length,
        totalProbability,
        totalPoolFraction,
        totalWeightSum,
        rows: rowsTierDescending,
      };
    },
  );

  groups.sort((a, b) => {
    if (mode === "family") {
      return maxProbabilityInGroup(b.rows) - maxProbabilityInGroup(a.rows);
    }
    if (mode === "probability") {
      return b.totalProbability - a.totalProbability;
    }
    if (mode === "tier") {
      const minA = Math.min(
        ...a.rows.map((r) => {
          return r.tier;
        }),
      );
      const minB = Math.min(
        ...b.rows.map((r) => {
          return r.tier;
        }),
      );
      return minA - minB;
    }
    const maxWA = Math.max(
      ...a.rows.map((r) => {
        return r.weight;
      }),
    );
    const maxWB = Math.max(
      ...b.rows.map((r) => {
        return r.weight;
      }),
    );
    return maxWB - maxWA;
  });

  return groups;
};
