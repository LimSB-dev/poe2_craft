import type { AppLocaleType } from "./routing";
import { SIMULATOR_MESSAGE_FRAGMENT_BASENAMES } from "./simulatorMessageFragments";

const loadSimulatorFragments = async (locale: AppLocaleType) => {
  const modules = await Promise.all(
    SIMULATOR_MESSAGE_FRAGMENT_BASENAMES.map((basename) => {
      return import(`../../../messages/${locale}/simulator/${basename}.json`);
    })
  );

  return modules.reduce<Record<string, unknown>>((accumulator, mod) => {
    return { ...accumulator, ...mod.default };
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
