import type { IDesiredModEntryType } from "./types";

/**
 * Ordered UI steps for “cheapest exalted spend first” heuristic (PoE2-style).
 * Copy stays in i18n; keys are stable across locales.
 */
export type IEfficientPlanStepType =
  | { key: "selectTargetsFirst" }
  | { key: "alchemyNormalMagic" }
  | { key: "essenceEachDesired"; desiredCount: number }
  | { key: "chaosUntilTargets" }
  | { key: "exaltTopUp" }
  | { key: "annulOptional" };

export type IEfficientCraftingPlanType = {
  steps: ReadonlyArray<IEfficientPlanStepType>;
};

/**
 * Heuristic plan: 연금술로 저렴한 레어 진입 → 목표마다 에센스 앵커 → 카오스로 슬롯 조정 → 남은 슬롯 엑잘 → 필요 시 소멸.
 * 강화학습 보상(엑잘 절감)과 같은 축에서 설명한다.
 */
export const buildEfficientCraftingPlan = (
  desiredMods: ReadonlyArray<IDesiredModEntryType>
): IEfficientCraftingPlanType => {
  if (desiredMods.length === 0) {
    return { steps: [{ key: "selectTargetsFirst" }] };
  }

  return {
    steps: [
      { key: "alchemyNormalMagic" },
      { key: "essenceEachDesired", desiredCount: desiredMods.length },
      { key: "chaosUntilTargets" },
      { key: "exaltTopUp" },
      { key: "annulOptional" },
    ],
  };
};
