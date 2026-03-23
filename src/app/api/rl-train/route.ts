import { NextResponse } from "next/server";

import {
  getRlCraftingActionCostsExalt,
} from "@/lib/poe2-item-simulator/currency/currencyExaltExchangeRates";
import {
  normalizeRlTrainDesiredMods,
  parseRlTrainBaseItemKey,
} from "@/lib/rl/normalizeRlTrainDesiredMods";

type ITrainRequestType = {
  desiredGoodMods?: number;
  budget?: number;
  episodes?: number;
  baseItemKey?: unknown;
  desiredMods?: unknown;
};

type IEnvStateType = {
  goodMods: number;
  totalAffixes: number;
  avgTierBucket: number;
  chaosUsed: number;
  usedEssence: number;
  /** 누적 엑잘 비용 (행동당 `getRlCraftingActionCostsExalt`). */
  totalCost: number;
  stepCount: number;
};

type IStepResultType = {
  nextState: IEnvStateType;
  reward: number;
  done: boolean;
};

type ITrainSummaryType = {
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

const ACTION_CHAOS: number = 0;
const ACTION_ESSENCE: number = 1;
const ACTION_STOP: number = 2;

const MIN_GOOD_MODS: number = 1;
const MAX_GOOD_MODS: number = 6;
const MIN_BUDGET: number = 1;
const MAX_BUDGET: number = 200;
const MIN_EPISODES: number = 200;
const MAX_EPISODES: number = 20000;

const GOOD_TIER_MAX_INCLUSIVE: number = 2;
const MAX_STEPS: number = 120;

const clampInt = (value: unknown, fallback: number, min: number, max: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  const parsed = Math.trunc(value);
  return Math.max(min, Math.min(max, parsed));
};

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const createInitialState = (): IEnvStateType => {
  return {
    goodMods: 0,
    totalAffixes: 0,
    avgTierBucket: 4,
    chaosUsed: 0,
    usedEssence: 0,
    totalCost: 0,
    stepCount: 0,
  };
};

const stateKey = (state: IEnvStateType, budget: number): string => {
  const budgetLeft = Math.max(0, budget - state.chaosUsed);
  return [
    state.goodMods,
    state.totalAffixes,
    state.avgTierBucket,
    budgetLeft,
    state.usedEssence,
  ].join("|");
};

const rollItem = (forceEssenceTier: boolean): {
  goodMods: number;
  totalAffixes: number;
  avgTierBucket: number;
} => {
  const totalAffixes = randomInt(4, 6);
  const tiers: number[] = [];
  for (let i = 0; i < totalAffixes; i += 1) {
    tiers.push(randomInt(1, 5));
  }

  if (forceEssenceTier) {
    const forcedIdx = randomInt(0, totalAffixes - 1);
    tiers[forcedIdx] = randomInt(1, 3);
  }

  let goodMods = 0;
  let tierSum = 0;
  for (const tier of tiers) {
    tierSum += tier;
    if (tier <= GOOD_TIER_MAX_INCLUSIVE) {
      goodMods += 1;
    }
  }
  const averageTier = tierSum / tiers.length;
  const avgTierBucket = Math.min(4, Math.max(0, Math.round(averageTier) - 1));

  return { goodMods, totalAffixes, avgTierBucket };
};

const quality = (state: IEnvStateType, desiredGoodMods: number): number => {
  const tierScore = 5 - state.avgTierBucket;
  const targetBonus = state.goodMods >= desiredGoodMods ? 2 : 0;
  return (2.2 * state.goodMods) + (0.4 * state.totalAffixes) + (0.6 * tierScore) + targetBonus;
};

/** 종료 시: 아이템 품질 − 누적 엑잘 소모 (엑잘을 적게 쓸수록 보상↑). */
const terminalReward = (state: IEnvStateType, desiredGoodMods: number): number => {
  return quality(state, desiredGoodMods) - state.totalCost;
};

const step = (
  state: IEnvStateType,
  action: number,
  desiredGoodMods: number,
  budget: number,
  costsExalt: { chaosOrb: number; essence: number }
): IStepResultType => {
  if (state.chaosUsed >= budget) {
    return {
      nextState: state,
      reward: terminalReward(state, desiredGoodMods),
      done: true,
    };
  }

  if (action === ACTION_STOP) {
    return {
      nextState: {
        ...state,
        stepCount: state.stepCount + 1,
      },
      reward: terminalReward(state, desiredGoodMods),
      done: true,
    };
  }

  if (action === ACTION_CHAOS) {
    const rolled = rollItem(false);
    const nextState: IEnvStateType = {
      ...state,
      goodMods: rolled.goodMods,
      totalAffixes: rolled.totalAffixes,
      avgTierBucket: rolled.avgTierBucket,
      chaosUsed: state.chaosUsed + 1,
      totalCost: state.totalCost + costsExalt.chaosOrb,
      stepCount: state.stepCount + 1,
    };
    const done = nextState.chaosUsed >= budget || nextState.stepCount >= MAX_STEPS;
    return {
      nextState,
      reward: done ? terminalReward(nextState, desiredGoodMods) : 0,
      done,
    };
  }

  const rolled = rollItem(true);
  const nextState: IEnvStateType = {
    ...state,
    goodMods: rolled.goodMods,
    totalAffixes: rolled.totalAffixes,
    avgTierBucket: rolled.avgTierBucket,
    usedEssence: 1,
    totalCost: state.totalCost + costsExalt.essence,
    stepCount: state.stepCount + 1,
  };
  const done = nextState.stepCount >= MAX_STEPS;
  return {
    nextState,
    reward: done ? terminalReward(nextState, desiredGoodMods) : 0,
    done,
  };
};

const argMax = (values: ReadonlyArray<number>): number => {
  let bestIdx = 0;
  let bestValue = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < values.length; i += 1) {
    if (values[i] > bestValue) {
      bestValue = values[i];
      bestIdx = i;
    }
  }
  return bestIdx;
};

const actionLabel = (action: number): "chaos" | "essence" | "stop" => {
  if (action === ACTION_CHAOS) {
    return "chaos";
  }
  if (action === ACTION_ESSENCE) {
    return "essence";
  }
  return "stop";
};

const trainAgent = (
  desiredGoodMods: number,
  budget: number,
  episodes: number
): ITrainSummaryType => {
  const costsExalt = getRlCraftingActionCostsExalt();
  const qTable = new Map<string, [number, number, number]>();
  const learningRate = 0.1;
  const gamma = 0.95;
  let epsilon = 1.0;
  const epsilonEnd = 0.05;
  const epsilonDecay = 0.999;

  const episodeRewards: number[] = [];
  const actionCounts = [0, 0, 0];

  for (let episode = 0; episode < episodes; episode += 1) {
    let state = createInitialState();
    let done = false;
    let totalReward = 0;

    while (!done) {
      const key = stateKey(state, budget);
      const currentQ = qTable.get(key) ?? [0, 0, 0];
      if (!qTable.has(key)) {
        qTable.set(key, currentQ);
      }

      let action: number;
      if (Math.random() < epsilon) {
        action = randomInt(0, 2);
      } else {
        action = argMax(currentQ);
      }

      actionCounts[action] += 1;
      const { nextState, reward, done: episodeDone } = step(
        state,
        action,
        desiredGoodMods,
        budget,
        costsExalt
      );
      const nextKey = stateKey(nextState, budget);
      const nextQ = qTable.get(nextKey) ?? [0, 0, 0];
      if (!qTable.has(nextKey)) {
        qTable.set(nextKey, nextQ);
      }

      const tdTarget = reward + (episodeDone ? 0 : gamma * Math.max(...nextQ));
      const tdError = tdTarget - currentQ[action];
      currentQ[action] += learningRate * tdError;

      state = nextState;
      done = episodeDone;
      totalReward += reward;
    }

    episodeRewards.push(totalReward);
    epsilon = Math.max(epsilonEnd, epsilon * epsilonDecay);
  }

  const startState = createInitialState();
  const startQ = qTable.get(stateKey(startState, budget)) ?? [0, 0, 0];
  const bestInitialAction = actionLabel(argMax(startQ));
  const rewardSum = episodeRewards.reduce((a, b) => a + b, 0);
  const meanReward = rewardSum / Math.max(1, episodeRewards.length);
  const last10 = episodeRewards.slice(-10);
  const last10AverageReward =
    last10.reduce((acc, value) => acc + value, 0) / Math.max(1, last10.length);
  const actionSum = actionCounts.reduce((a, b) => a + b, 0);

  return {
    meanReward,
    last10AverageReward,
    actionRatio: {
      chaos: actionCounts[ACTION_CHAOS] / Math.max(1, actionSum),
      essence: actionCounts[ACTION_ESSENCE] / Math.max(1, actionSum),
      stop: actionCounts[ACTION_STOP] / Math.max(1, actionSum),
    },
    bestInitialAction,
    costsExaltPerAction: costsExalt,
  };
};

export const POST = async (request: Request): Promise<Response> => {
  const body = (await request.json()) as ITrainRequestType;

  const desiredModsPayload = normalizeRlTrainDesiredMods(body.desiredMods);
  const baseItemKey = parseRlTrainBaseItemKey(body.baseItemKey);
  const desiredGoodMods =
    desiredModsPayload.length > 0
      ? clampInt(desiredModsPayload.length, 3, MIN_GOOD_MODS, MAX_GOOD_MODS)
      : clampInt(body.desiredGoodMods, 3, MIN_GOOD_MODS, MAX_GOOD_MODS);
  const budget = clampInt(body.budget, 80, MIN_BUDGET, MAX_BUDGET);
  const episodes = clampInt(body.episodes, 3000, MIN_EPISODES, MAX_EPISODES);

  const summary = trainAgent(desiredGoodMods, budget, episodes);
  return NextResponse.json({
    params: {
      desiredGoodMods,
      budget,
      episodes,
      baseItemKey,
      desiredMods: desiredModsPayload,
    },
    summary: {
      meanReward: Number(summary.meanReward.toFixed(4)),
      last10AverageReward: Number(summary.last10AverageReward.toFixed(4)),
      actionRatio: {
        chaos: Number(summary.actionRatio.chaos.toFixed(4)),
        essence: Number(summary.actionRatio.essence.toFixed(4)),
        stop: Number(summary.actionRatio.stop.toFixed(4)),
      },
      bestInitialAction: summary.bestInitialAction,
      costsExaltPerAction: {
        chaosOrb: Number(summary.costsExaltPerAction.chaosOrb.toFixed(6)),
        essence: Number(summary.costsExaltPerAction.essence.toFixed(6)),
      },
    },
  });
};
