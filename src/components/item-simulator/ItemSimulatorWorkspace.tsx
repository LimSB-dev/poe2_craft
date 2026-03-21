"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { Link } from "@/lib/i18n/navigation";
import { BASE_ITEMS } from "@/lib/poe2-item-simulator/baseItems";
import { resolveSimulationCounts, rollSimulation } from "@/lib/poe2-item-simulator/roller";
import type {
  IBaseItemDefinition,
  IItemSimulationResultType,
  IModDefinition,
  ItemRarityType,
} from "@/lib/poe2-item-simulator/types";

const ModListSection = ({
  title,
  mods,
  emptyLabel,
}: {
  title: string;
  mods: ReadonlyArray<IModDefinition>;
  emptyLabel: string;
}): ReactElement => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h3>
      <ul className="flex flex-col gap-1">
        {mods.length === 0 ? (
          <li className="text-sm text-zinc-500 dark:text-zinc-500">{emptyLabel}</li>
        ) : (
          mods.map((modDefinition) => (
            <li
              key={modDefinition.modKey}
              className="text-sm text-zinc-800 dark:text-zinc-200 flex flex-wrap items-center gap-2"
            >
              <span>{modDefinition.displayName}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                T{modDefinition.tier}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

const PanelShell = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}): ReactElement => {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm">
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      </header>
      {children}
    </section>
  );
};

export const ItemSimulatorWorkspace = (): ReactElement => {
  const t = useTranslations("simulator");
  const tPanels = useTranslations("simulator.panels");
  const tOptions = useTranslations("simulator.options");
  const tMods = useTranslations("simulator.mods");

  const firstBaseItem: IBaseItemDefinition | undefined = BASE_ITEMS[0];
  const [selectedBaseItemKey, setSelectedBaseItemKey] = useState<string>(
    firstBaseItem ? firstBaseItem.baseItemKey : ""
  );
  const [rarity, setRarity] = useState<ItemRarityType>("rare");
  const [desiredPrefixCount, setDesiredPrefixCount] = useState<number>(2);
  const [desiredSuffixCount, setDesiredSuffixCount] = useState<number>(2);
  const [simulationResult, setSimulationResult] = useState<IItemSimulationResultType | null>(null);

  const selectedBaseItem: IBaseItemDefinition | undefined = BASE_ITEMS.find(
    (baseItem) => baseItem.baseItemKey === selectedBaseItemKey
  );

  const effectiveCounts = resolveSimulationCounts(rarity, desiredPrefixCount, desiredSuffixCount);

  const handleRarityChange = (nextRarity: ItemRarityType): void => {
    setRarity(nextRarity);
    if (nextRarity === "magic") {
      setDesiredPrefixCount(1);
      setDesiredSuffixCount(0);
    } else {
      setDesiredPrefixCount(2);
      setDesiredSuffixCount(2);
    }
  };

  const handleSimulate = (): void => {
    if (!selectedBaseItem) {
      return;
    }
    const roll = rollSimulation({
      rarity,
      desiredPrefixCount,
      desiredSuffixCount,
    });
    setSimulationResult({
      baseItem: selectedBaseItem,
      roll,
    });
  };

  const prefixOptions = rarity === "magic" ? [0, 1] : [0, 1, 2, 3];
  const suffixOptions = rarity === "magic" ? [0, 1] : [0, 1, 2, 3];

  const baseName = (baseItem: IBaseItemDefinition): string => {
    return t(`baseItems.${baseItem.baseItemKey}.name`);
  };

  const itemClassLabel = (baseItem: IBaseItemDefinition): string => {
    return t(`itemClass.${baseItem.itemClassKey}`);
  };

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 dark:bg-black px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-6xl flex flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{t("title")}</h1>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 max-w-2xl">{t("intro")}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <LocaleSwitcher />
            <Link
              href="/strategy"
              className="text-sm font-medium text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
            >
              {t("strategyView.navLabel")}
            </Link>
            <Link
              href="/rl"
              className="text-sm font-medium text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
            >
              {t("rlView.navLabel")}
            </Link>
            <Link
              href="/optimizer"
              className="text-sm font-medium text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline"
            >
              {t("optimizerView.navLabel")}
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          <PanelShell
            title={tPanels("baseItem.title")}
            description={tPanels("baseItem.description")}
          >
            <div className="flex flex-col gap-2">
              {BASE_ITEMS.map((baseItem) => {
                const isSelected = baseItem.baseItemKey === selectedBaseItemKey;
                return (
                  <button
                    key={baseItem.baseItemKey}
                    type="button"
                    onClick={() => {
                      setSelectedBaseItemKey(baseItem.baseItemKey);
                    }}
                    className={`text-left rounded-xl border px-4 py-3 text-sm transition-colors ${
                      isSelected
                        ? "border-amber-500/80 bg-amber-50 dark:bg-amber-950/30 text-zinc-950 dark:text-zinc-50"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div className="font-medium">{baseName(baseItem)}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {itemClassLabel(baseItem)}
                    </div>
                  </button>
                );
              })}
            </div>
          </PanelShell>

          <PanelShell
            title={tPanels("options.title")}
            description={tPanels("options.description")}
          >
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {tOptions("targetRarity")}
                </span>
                <select
                  value={rarity}
                  onChange={(event) => {
                    const value = event.target.value as ItemRarityType;
                    if (value === "magic" || value === "rare") {
                      handleRarityChange(value);
                    }
                  }}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                >
                  <option value="magic">{t("rarity.magic")}</option>
                  <option value="rare">{t("rarity.rare")}</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {tOptions("prefixes")}
                  </span>
                  <select
                    value={desiredPrefixCount}
                    onChange={(event) => {
                      setDesiredPrefixCount(Number.parseInt(event.target.value, 10));
                    }}
                    className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                  >
                    {prefixOptions.map((count) => (
                      <option key={`prefix-${count}`} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {tOptions("suffixes")}
                  </span>
                  <select
                    value={desiredSuffixCount}
                    onChange={(event) => {
                      setDesiredSuffixCount(Number.parseInt(event.target.value, 10));
                    }}
                    className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                  >
                    {suffixOptions.map((count) => (
                      <option key={`suffix-${count}`} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                {tOptions("effectiveRoll", {
                  prefixCount: effectiveCounts.prefixCount,
                  suffixCount: effectiveCounts.suffixCount,
                  hint: tOptions("effectiveRollHint"),
                })}
              </p>

              <button
                type="button"
                onClick={() => {
                  handleSimulate();
                }}
                disabled={!selectedBaseItem}
                className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-3 text-sm font-semibold text-white dark:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              >
                {tOptions("rollPreview")}
              </button>
            </div>
          </PanelShell>

          <PanelShell
            title={tPanels("result.title")}
            description={tPanels("result.description")}
          >
            {!simulationResult ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("result.empty")}</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 px-4 py-3">
                  <div className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                    {baseName(simulationResult.baseItem)}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    {itemClassLabel(simulationResult.baseItem)}
                  </div>
                  <div className="text-sm text-zinc-700 dark:text-zinc-300 mt-2">
                    {t(`rarity.${simulationResult.roll.rarity}`)}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ModListSection
                    title={tMods("prefixes")}
                    mods={simulationResult.roll.prefixes}
                    emptyLabel={tMods("empty")}
                  />
                  <ModListSection
                    title={tMods("suffixes")}
                    mods={simulationResult.roll.suffixes}
                    emptyLabel={tMods("empty")}
                  />
                </div>
              </div>
            )}
          </PanelShell>
        </div>
      </div>
    </div>
  );
};
