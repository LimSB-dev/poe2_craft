"use client";

import type { ReactElement } from "react";

import { ItemSimulatorModTypeBadge } from "@/components/atoms/badge/ItemSimulatorModTypeBadge";
import { SimulatorModTemplateText } from "@/components/organisms/display/SimulatorModTemplateText";

type ItemSimulatorDesiredModListItemPropsType = {
  mod: IDesiredModEntryType;
  typeBadgeLabel: string;
  removeAriaLabel: string;
  onRemove: (id: string) => void;
};

export const ItemSimulatorDesiredModListItem = ({
  mod,
  typeBadgeLabel,
  removeAriaLabel,
  onRemove,
}: ItemSimulatorDesiredModListItemPropsType): ReactElement => {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/50">
      <ItemSimulatorModTypeBadge
        modType={mod.modType as ModTypeType}
        label={typeBadgeLabel}
      />
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-800 dark:text-zinc-200">
        <SimulatorModTemplateText nameTemplateKey={mod.nameTemplateKey} />
      </span>
      <button
        type="button"
        onClick={() => {
          onRemove(mod.id);
        }}
        aria-label={removeAriaLabel}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
      >
        ✕
      </button>
    </li>
  );
};
