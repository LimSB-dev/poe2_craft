"use client";

import { useTranslations } from "next-intl";
import { useMemo, type ReactElement } from "react";

import { EmptyStateText } from "@/components/atoms";
import { DesiredModListItem } from "@/components/molecules";
import { DesiredModsModPickerList } from "./DesiredModsModPickerList";
import { getModPool } from "@/lib/poe2-item-simulator/modPool";
import { getModTypeDisplayName } from "@/lib/poe2-item-simulator/modTypeLabels";
import { useAppSelector } from "@/store/hooks";

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

export const DesiredModsPanel = ({
  subType,
  statTags,
  desiredMods,
  onAdd,
  onRemove,
}: DesiredModsPanelPropsType): ReactElement => {
  const locale = useAppSelector((state) => state.locale.locale);
  const t = useTranslations("simulator.desiredModsPanel");

  const typeBadgeLabels = useMemo((): Record<ModTypeType, string> => {
    return {
      prefix: getModTypeDisplayName("prefix", locale),
      suffix: getModTypeDisplayName("suffix", locale),
      corruptedPrefix: getModTypeDisplayName("corruptedPrefix", locale),
      corruptedSuffix: getModTypeDisplayName("corruptedSuffix", locale),
    };
  }, [locale]);

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

  return (
    <div className="flex flex-col gap-3">
      <div className="min-h-[280px] flex flex-col justify-start">
        {desiredMods.length === 0 ? (
          <EmptyStateText>{t("emptyState")}</EmptyStateText>
        ) : (
          <ul
            className="flex flex-col gap-1"
            aria-label={t("addedTitle")}
          >
            {desiredMods.map((mod) => {
              return (
                <DesiredModListItem
                  key={mod.id}
                  mod={mod}
                  typeBadgeLabel={typeBadgeLabels[mod.modType]}
                  removeAriaLabel={t("removeAriaLabel", {
                    name: mod.nameTemplateKey,
                  })}
                  onRemove={onRemove}
                />
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
          {getModTypeDisplayName("prefix", locale)} {prefixSlotsUsed}/
          {MAX_PREFIX_SLOTS}
        </span>
        <span
          className={
            suffixSlotsUsed >= MAX_SUFFIX_SLOTS
              ? "text-red-500 dark:text-red-400"
              : "text-zinc-500 dark:text-zinc-400"
          }
        >
          {getModTypeDisplayName("suffix", locale)} {suffixSlotsUsed}/
          {MAX_SUFFIX_SLOTS}
        </span>
      </div>
    </div>
  );
};
