import type { AppLocaleType } from "@/lib/i18n/routing";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

/** Shallow merge drops nested keys when two fragments share a top-level key; deep-merge preserves both. */
const deepMergeRecords = (
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = result[key];
    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key] = deepMergeRecords(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  }
  return result;
};

export const loadLocaleMessages = async (locale: AppLocaleType) => {
  const [metadataMod, simulatorLocale] = await Promise.all([
    import(`../../i18n/${locale}/metadata.json`),
    import(`../../i18n/${locale}/simulator.json`),
  ]);

  /** 비영어 로케일에서 새 키가 아직 없으면 `en` 시뮬레이터 조각을 베이스로 깊게 합쳐 누락을 방지한다. */
  let simulator: Record<string, unknown> = simulatorLocale.default as Record<string, unknown>;
  if (locale !== "en") {
    const simulatorEn = await import("../../i18n/en/simulator.json");
    simulator = deepMergeRecords(
      simulatorEn.default as Record<string, unknown>,
      simulatorLocale.default as Record<string, unknown>,
    );
  }

  const simulatorFragmentImporters = [
    () => import(`../../i18n/${locale}/simulator-itemSimulatorWorkspace.json`),
    () => import(`../../i18n/${locale}/simulator-desiredModsPanel.json`),
  ];
  for (const importFragment of simulatorFragmentImporters) {
    try {
      const fragmentModule = await importFragment();
      simulator = deepMergeRecords(
        simulator,
        fragmentModule.default as Record<string, unknown>,
      );
    } catch {
      // Optional fragment: skip when not provided for this locale.
    }
  }

  return {
    metadata: metadataMod.default,
    simulator,
  };
};
