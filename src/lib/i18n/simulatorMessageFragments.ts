/**
 * `messages/{locale}/simulator/{basename}.json` 조각 목록.
 * 새 파일 추가 시 여기와 각 로케일 폴더에 동일 basename JSON을 넣습니다.
 */
export const SIMULATOR_MESSAGE_FRAGMENT_BASENAMES = [
  "shell",
  "panels",
  "form",
  "rarity",
  "result",
  "mods",
  "catalog",
  "desiredModsPanel",
  "itemSimulatorCatalog",
  "itemSimulatorWorkspace",
  "strategyView",
  "rlView",
  "optimizerView",
] as const;

export type SimulatorMessageFragmentBasenameType =
  (typeof SIMULATOR_MESSAGE_FRAGMENT_BASENAMES)[number];
