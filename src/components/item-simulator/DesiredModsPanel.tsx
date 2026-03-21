"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { DesiredModsModPickerList } from "@/components/item-simulator/DesiredModsModPickerList";
import { SimulatorModTemplateText } from "@/components/item-simulator/i18n/SimulatorModTemplateText";
import { getModPool } from "@/lib/poe2-item-simulator/modPool";
import type {
  IBaseItemStatTagType,
  IBaseItemSubTypeType,
} from "@/lib/poe2-item-simulator/baseItemDb";
import type {
  IDesiredModEntryType,
  ModTypeType,
} from "@/lib/poe2-item-simulator/types";

interface DesiredModsPanelPropsType {
  subType?: IBaseItemSubTypeType;
  /** Stat tags of the selected base item. Used to filter out mods whose requiredItemTags the item doesn't satisfy. */
  statTags?: ReadonlyArray<IBaseItemStatTagType>;
  desiredMods: ReadonlyArray<IDesiredModEntryType>;
  onAdd: (entry: IDesiredModEntryType) => void;
  onRemove: (id: string) => void;
}

const MAX_PREFIX_SLOTS = 3;
const MAX_SUFFIX_SLOTS = 3;

const isPrefixType = (modType: ModTypeType): boolean =>
  modType === "prefix" || modType === "corruptedPrefix";

const MOD_TYPE_BADGE_CLASSES: Record<ModTypeType, string> = {
  prefix: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  suffix:
    "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  corruptedPrefix:
    "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  corruptedSuffix:
    "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
};

export const DesiredModsPanel = ({
  subType,
  statTags,
  desiredMods,
  onAdd,
  onRemove,
}: DesiredModsPanelPropsType): ReactElement => {
  const t = useTranslations("simulator.desiredModsPanel");

  const itemStatTagSet = new Set<IBaseItemStatTagType>(statTags ?? []);
  const availableMods = getModPool(subType).filter((mod) => {
    if (mod.requiredItemTags.length === 0) {
      return true;
    }
    return mod.requiredItemTags.every((tag) => itemStatTagSet.has(tag));
  });

  const alreadyAddedKeys = new Set(desiredMods.map((m) => m.modKey));

  const prefixSlotsUsed = desiredMods.filter((m) =>
    isPrefixType(m.modType),
  ).length;
  const suffixSlotsUsed = desiredMods.filter(
    (m) => !isPrefixType(m.modType),
  ).length;

  const isSlotFull = (modType: ModTypeType): boolean =>
    isPrefixType(modType)
      ? prefixSlotsUsed >= MAX_PREFIX_SLOTS
      : suffixSlotsUsed >= MAX_SUFFIX_SLOTS;

  const handleAdd = (
    modKey: string,
    nameTemplateKey: string,
    modType: ModTypeType,
  ): void => {
    if (alreadyAddedKeys.has(modKey) || isSlotFull(modType)) {
      return;
    }
    onAdd({
      id: `${modKey}-${crypto.randomUUID()}`,
      modKey,
      nameTemplateKey,
      modType,
    });
  };

  const typeBadgeLabels: Record<ModTypeType, string> = {
    prefix: t("typePrefix"),
    suffix: t("typeSuffix"),
    corruptedPrefix: t("typeCorruptedPrefix"),
    corruptedSuffix: t("typeCorruptedSuffix"),
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="min-h-[216px] flex flex-col justify-start">
        {desiredMods.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 py-1">
            {t("emptyState")}
          </p>
        ) : (
          <ul
            className="flex flex-col gap-1"
            aria-label={t("addedTitle")}
          >
            {desiredMods.map((mod) => {
              return (
                <li
                  key={mod.id}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-1.5"
                >
                  <span
                    className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${MOD_TYPE_BADGE_CLASSES[mod.modType]}`}
                  >
                    {typeBadgeLabels[mod.modType]}
                  </span>
                  <span className="flex-1 min-w-0 text-sm text-zinc-800 dark:text-zinc-200 truncate">
                    <SimulatorModTemplateText nameTemplateKey={mod.nameTemplateKey} />
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(mod.id)}
                    aria-label={t("removeAriaLabel", {
                      name: mod.nameTemplateKey,
                    })}
                    className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-xs"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <DesiredModsModPickerList
        availableMods={availableMods}
        alreadyAddedKeys={alreadyAddedKeys}
        typeBadgeLabels={typeBadgeLabels}
        searchPlaceholder={t("searchPlaceholder")}
        searchAriaLabel={t("searchPlaceholder")}
        listAriaLabel={t("sectionTitle")}
        noResultsLabel={t("noResults")}
        slotFullLabel={t("slotFull")}
        isSlotFull={isSlotFull}
        onAdd={handleAdd}
      />

      <div className="flex gap-3 text-xs font-medium justify-end">
        <span
          className={
            prefixSlotsUsed >= MAX_PREFIX_SLOTS
              ? "text-red-500 dark:text-red-400"
              : "text-zinc-500 dark:text-zinc-400"
          }
        >
          {t("typePrefix")} {prefixSlotsUsed}/{MAX_PREFIX_SLOTS}
        </span>
        <span
          className={
            suffixSlotsUsed >= MAX_SUFFIX_SLOTS
              ? "text-red-500 dark:text-red-400"
              : "text-zinc-500 dark:text-zinc-400"
          }
        >
          {t("typeSuffix")} {suffixSlotsUsed}/{MAX_SUFFIX_SLOTS}
        </span>
      </div>
    </div>
  );
};
