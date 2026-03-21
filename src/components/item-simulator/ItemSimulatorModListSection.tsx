"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { SimulatorModTemplateText } from "@/components/item-simulator/i18n/SimulatorModTemplateText";
import type { IModDefinition } from "@/lib/poe2-item-simulator/types";

type ItemSimulatorModListSectionPropsType = {
  title: string;
  mods: ReadonlyArray<IModDefinition>;
  emptyLabel: string;
  desiredModKeys?: ReadonlySet<string>;
};

export const ItemSimulatorModListSection = ({
  title,
  mods,
  emptyLabel,
  desiredModKeys,
}: ItemSimulatorModListSectionPropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorWorkspace");

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold font-sc uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h3>
      <ul className="flex flex-col gap-1">
        {mods.length === 0 ? (
          <li className="text-sm text-zinc-500 dark:text-zinc-500">
            {emptyLabel}
          </li>
        ) : (
          mods.map((modDefinition) => {
            const isDesired =
              desiredModKeys?.has(modDefinition.modKey) ?? false;
            return (
              <li
                key={modDefinition.modKey}
                className={`text-sm flex flex-wrap items-center gap-2 rounded-md px-2 py-1 -mx-2 transition-colors ${
                  isDesired
                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300"
                    : "text-zinc-800 dark:text-zinc-200"
                }`}
                aria-label={
                  isDesired
                    ? t("resultModList.matchedDesiredRow", {
                        tier: modDefinition.tier,
                      })
                    : undefined
                }
              >
                {isDesired && (
                  <span
                    className="text-amber-500 dark:text-amber-400 text-xs"
                    aria-hidden="true"
                  >
                    ★
                  </span>
                )}
                <span>
                  <SimulatorModTemplateText
                    nameTemplateKey={modDefinition.displayName}
                  />
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isDesired
                      ? "bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300"
                      : "bg-zinc-100 dark:bg-zinc-800"
                  }`}
                >
                  T{modDefinition.tier}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};
