/**
 * `messages/{locale}/simulator/{basename}.json` 조각 목록.
 * 새 파일 추가 시: 각 로케일 폴더에 동일 basename JSON,
 * 그리고 `simulatorFragmentModules.ts`의 정적 import 맵을 함께 갱신합니다.
 */
export const SIMULATOR_MESSAGE_FRAGMENT_BASENAMES = [
  "shell",
  "panels",
  "form",
  "rarity",
  "result",
  "mods",
  "catalog",
  "craftLab",
  "desiredModsPanel",
  "itemSimulatorCatalog",
  "itemSimulatorWorkspace",
  "strategyView",
  "rlView",
  "optimizerView",
] as const;

export type SimulatorMessageFragmentBasenameType =
  (typeof SIMULATOR_MESSAGE_FRAGMENT_BASENAMES)[number];
