"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { SimulatorModTemplateText } from "@/components/organisms/SimulatorModTemplateText";

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
          mods.map((modDefinition, modIndex) => {
            const isDesired =
              desiredModKeys?.has(modDefinition.modKey) ?? false;
            const isFractured = modDefinition.isFractured === true;
            const contentTone =
              isFractured && isDesired
                ? "text-amber-900/75 dark:text-amber-400/65"
                : isFractured
                  ? "text-zinc-600 dark:text-zinc-500"
                  : isDesired
                    ? "text-amber-800 dark:text-amber-300"
                    : "text-zinc-800 dark:text-zinc-200";
            return (
              <li
                key={`${modDefinition.modKey}-${String(modIndex)}`}
                className={`flex items-start gap-2 rounded-md px-2 py-1 text-sm -mx-2 transition-colors ${
                  isDesired && !isFractured
                    ? "bg-amber-50 dark:bg-amber-900/20"
                    : isDesired && isFractured
                      ? "bg-amber-50/80 dark:bg-amber-900/15"
                      : ""
                }`}
                aria-label={
                  isDesired
                    ? t("resultModList.matchedDesiredRow", {
                        tier: modDefinition.tier,
                      })
                    : undefined
                }
              >
                <span
                  className="shrink-0 w-8 pt-0.5 text-left text-[10px] font-medium tabular-nums text-zinc-500 dark:text-zinc-600"
                  aria-hidden
                >
                  T{modDefinition.tier}
                </span>
                <div
                  className={`min-w-0 flex flex-1 justify-center px-1 ${contentTone}`}
                >
                  <div className="flex max-w-full flex-wrap items-center justify-center gap-2 text-center">
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
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};
