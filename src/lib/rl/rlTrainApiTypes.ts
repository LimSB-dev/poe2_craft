import type { ModTypeType } from "@/lib/poe2-item-simulator/types";

/** 시뮬레이터에서 `/api/rl-train`으로 보내는 목표 속성 한 줄. */
export type IRlTrainDesiredModPayloadType = {
  id: string;
  modKey: string;
  nameTemplateKey: string;
  modType: ModTypeType;
};

export type IRlTrainResponseType = {
  params: {
    desiredGoodMods: number;
    budget: number;
    episodes: number;
    /** 시뮬레이터가 보낸 베이스 키(없으면 null). */
    baseItemKey: string | null;
    /** 검증·상한 적용 후 서버가 받은 목표 속성 목록(RL 페이지 단독 호출 시 []). */
    desiredMods: ReadonlyArray<IRlTrainDesiredModPayloadType>;
  };
  summary: {
    meanReward: number;
    last10AverageReward: number;
    actionRatio: {
      chaos: number;
      essence: number;
      stop: number;
    };
    bestInitialAction: "chaos" | "essence" | "stop";
    costsExaltPerAction: {
      chaosOrb: number;
      essence: number;
    };
  };
};
