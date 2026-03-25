export {};

declare global {
  type IRlTrainDesiredModPayloadType = {
    id: string;
    modKey: string;
    nameTemplateKey: string;
    modType: ModTypeType;
  };

  type IRlTrainResponseType = {
    params: {
      desiredGoodMods: number;
      budget: number;
      episodes: number;
      baseItemKey: string | null;
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
}

