import type { AppLocaleType } from "./routing";
import {
  SIMULATOR_MESSAGE_FRAGMENT_BASENAMES,
  type SimulatorMessageFragmentBasenameType,
} from "./simulatorMessageFragments";

type FragmentJsonModuleType = { default: Record<string, unknown> };

type LocaleFragmentLoadersType = Record<
  SimulatorMessageFragmentBasenameType,
  () => Promise<FragmentJsonModuleType>
>;

/**
 * Static import paths so Turbopack/Webpack enumerate every locale+fragment JSON.
 * Fully dynamic `import(\`.../${locale}/.../${basename}.json\`)` can omit chunks.
 */
const SIMULATOR_FRAGMENT_MODULES: Record<AppLocaleType, LocaleFragmentLoadersType> =
  {
    en: {
      shell: () => import("../../../messages/en/simulator/shell.json"),
      panels: () => import("../../../messages/en/simulator/panels.json"),
      form: () => import("../../../messages/en/simulator/form.json"),
      rarity: () => import("../../../messages/en/simulator/rarity.json"),
      result: () => import("../../../messages/en/simulator/result.json"),
      mods: () => import("../../../messages/en/simulator/mods.json"),
      catalog: () => import("../../../messages/en/simulator/catalog.json"),
      craftLab: () => import("../../../messages/en/simulator/craftLab.json"),
      desiredModsPanel: () =>
        import("../../../messages/en/simulator/desiredModsPanel.json"),
      itemSimulatorCatalog: () =>
        import("../../../messages/en/simulator/itemSimulatorCatalog.json"),
      itemSimulatorWorkspace: () =>
        import("../../../messages/en/simulator/itemSimulatorWorkspace.json"),
      strategyView: () => import("../../../messages/en/simulator/strategyView.json"),
      rlView: () => import("../../../messages/en/simulator/rlView.json"),
      optimizerView: () =>
        import("../../../messages/en/simulator/optimizerView.json"),
    },
    ko: {
      shell: () => import("../../../messages/ko/simulator/shell.json"),
      panels: () => import("../../../messages/ko/simulator/panels.json"),
      form: () => import("../../../messages/ko/simulator/form.json"),
      rarity: () => import("../../../messages/ko/simulator/rarity.json"),
      result: () => import("../../../messages/ko/simulator/result.json"),
      mods: () => import("../../../messages/ko/simulator/mods.json"),
      catalog: () => import("../../../messages/ko/simulator/catalog.json"),
      craftLab: () => import("../../../messages/ko/simulator/craftLab.json"),
      desiredModsPanel: () =>
        import("../../../messages/ko/simulator/desiredModsPanel.json"),
      itemSimulatorCatalog: () =>
        import("../../../messages/ko/simulator/itemSimulatorCatalog.json"),
      itemSimulatorWorkspace: () =>
        import("../../../messages/ko/simulator/itemSimulatorWorkspace.json"),
      strategyView: () => import("../../../messages/ko/simulator/strategyView.json"),
      rlView: () => import("../../../messages/ko/simulator/rlView.json"),
      optimizerView: () =>
        import("../../../messages/ko/simulator/optimizerView.json"),
    },
    ja: {
      shell: () => import("../../../messages/ja/simulator/shell.json"),
      panels: () => import("../../../messages/ja/simulator/panels.json"),
      form: () => import("../../../messages/ja/simulator/form.json"),
      rarity: () => import("../../../messages/ja/simulator/rarity.json"),
      result: () => import("../../../messages/ja/simulator/result.json"),
      mods: () => import("../../../messages/ja/simulator/mods.json"),
      catalog: () => import("../../../messages/ja/simulator/catalog.json"),
      craftLab: () => import("../../../messages/ja/simulator/craftLab.json"),
      desiredModsPanel: () =>
        import("../../../messages/ja/simulator/desiredModsPanel.json"),
      itemSimulatorCatalog: () =>
        import("../../../messages/ja/simulator/itemSimulatorCatalog.json"),
      itemSimulatorWorkspace: () =>
        import("../../../messages/ja/simulator/itemSimulatorWorkspace.json"),
      strategyView: () => import("../../../messages/ja/simulator/strategyView.json"),
      rlView: () => import("../../../messages/ja/simulator/rlView.json"),
      optimizerView: () =>
        import("../../../messages/ja/simulator/optimizerView.json"),
    },
    "zh-CN": {
      shell: () => import("../../../messages/zh-CN/simulator/shell.json"),
      panels: () => import("../../../messages/zh-CN/simulator/panels.json"),
      form: () => import("../../../messages/zh-CN/simulator/form.json"),
      rarity: () => import("../../../messages/zh-CN/simulator/rarity.json"),
      result: () => import("../../../messages/zh-CN/simulator/result.json"),
      mods: () => import("../../../messages/zh-CN/simulator/mods.json"),
      catalog: () => import("../../../messages/zh-CN/simulator/catalog.json"),
      craftLab: () => import("../../../messages/zh-CN/simulator/craftLab.json"),
      desiredModsPanel: () =>
        import("../../../messages/zh-CN/simulator/desiredModsPanel.json"),
      itemSimulatorCatalog: () =>
        import("../../../messages/zh-CN/simulator/itemSimulatorCatalog.json"),
      itemSimulatorWorkspace: () =>
        import("../../../messages/zh-CN/simulator/itemSimulatorWorkspace.json"),
      strategyView: () =>
        import("../../../messages/zh-CN/simulator/strategyView.json"),
      rlView: () => import("../../../messages/zh-CN/simulator/rlView.json"),
      optimizerView: () =>
        import("../../../messages/zh-CN/simulator/optimizerView.json"),
    },
  };

const assertFragmentsMatchExports = (): void => {
  const exported = [...SIMULATOR_MESSAGE_FRAGMENT_BASENAMES].sort();
  for (const locale of Object.keys(SIMULATOR_FRAGMENT_MODULES) as AppLocaleType[]) {
    const keys = Object.keys(SIMULATOR_FRAGMENT_MODULES[locale]).sort();
    if (JSON.stringify(keys) !== JSON.stringify(exported)) {
      throw new Error(
        `simulatorFragmentModules: ${locale} keys do not match SIMULATOR_MESSAGE_FRAGMENT_BASENAMES`,
      );
    }
  }
};

assertFragmentsMatchExports();

export const loadSimulatorFragmentModule = async (
  locale: AppLocaleType,
  basename: SimulatorMessageFragmentBasenameType
): Promise<FragmentJsonModuleType> => {
  return SIMULATOR_FRAGMENT_MODULES[locale][basename]();
};
