import type { ReactElement } from "react";
import { rollItem } from "@/lib/poe2-item-simulator/roller";
import type { IItemRoll, IModDefinition, ItemRarityType } from "@/lib/poe2-item-simulator/types";

const formatRarityForDisplay = (rarity: ItemRarityType): string => {
  if (rarity === "magic") {
    return "Magic";
  }
  return "Rare";
};

const formatModForDisplay = (modDefinition: IModDefinition): {
  name: string;
  tier: number;
  modKey: string;
  modType: "prefix" | "suffix";
} => {
  return {
    name: modDefinition.displayName,
    tier: modDefinition.tier,
    modKey: modDefinition.modKey,
    modType: modDefinition.modType,
  };
};

const ItemSection = ({
  title,
  mods,
}: {
  title: string;
  mods: ReadonlyArray<IModDefinition>;
}): ReactElement => {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      <ul className="flex flex-col gap-1">
        {mods.length === 0 ? (
          <li className="text-sm text-zinc-600 dark:text-zinc-400">None</li>
        ) : (
          mods.map((modDefinition) => {
            const formattedMod = formatModForDisplay(modDefinition);
            return (
              <li
                key={formattedMod.modKey}
                className="text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-2"
              >
                <span className="font-medium">{formattedMod.name}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  T{formattedMod.tier}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};

export default function Home(): ReactElement {
  const itemRolls = Array.from({ length: 10 }, () => rollItem());

  console.log("[poe2-item-simulator] Generated 10 items:", itemRolls);

  return (
    <div className="flex min-h-full flex-col items-center bg-zinc-50 dark:bg-black px-6 py-10">
      <main className="w-full max-w-4xl flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">
            Path of Exile 2 Item Simulator
          </h1>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Generates 10 random items (prefix/suffix limits respected) and logs the result on the server console.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          {itemRolls.map((itemRoll: IItemRoll, index: number) => {
            return (
              <article
                key={`${itemRoll.rarity}-${index}`}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                      Item #{index + 1}
                    </h2>
                    <div className="text-sm text-zinc-700 dark:text-zinc-300">
                      Rarity: {formatRarityForDisplay(itemRoll.rarity)}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    Prefixes: {itemRoll.prefixes.length}/3 · Suffixes: {itemRoll.suffixes.length}/3
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ItemSection title="Prefixes" mods={itemRoll.prefixes} />
                  <ItemSection title="Suffixes" mods={itemRoll.suffixes} />
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
