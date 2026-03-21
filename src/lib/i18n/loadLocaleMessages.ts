import type { AppLocaleType } from "./routing";
import { loadSimulatorFragmentModule } from "./simulatorFragmentModules";
import { SIMULATOR_MESSAGE_FRAGMENT_BASENAMES } from "./simulatorMessageFragments";

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

const loadSimulatorFragments = async (locale: AppLocaleType) => {
  const modules = await Promise.all(
    SIMULATOR_MESSAGE_FRAGMENT_BASENAMES.map((basename) => {
      return loadSimulatorFragmentModule(locale, basename);
    })
  );

  return modules.reduce<Record<string, unknown>>((accumulator, mod) => {
    return deepMergeRecords(accumulator, mod.default as Record<string, unknown>);
  }, {});
};

export const loadLocaleMessages = async (locale: AppLocaleType) => {
  const [metadataMod, simulator] = await Promise.all([
    import(`../../../messages/${locale}/metadata.json`),
    loadSimulatorFragments(locale),
  ]);

  return {
    metadata: metadataMod.default,
    simulator,
  };
};
