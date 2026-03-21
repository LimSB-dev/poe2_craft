"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { ReactElement } from "react";

import { getModPool } from "@/lib/poe2-item-simulator/modPool";
import type { IBaseItemStatTagType, IBaseItemSubTypeType } from "@/lib/poe2-item-simulator/baseItemDb";
import type { IDesiredModEntryType, ModTypeType } from "@/lib/poe2-item-simulator/types";

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
  suffix: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  corruptedPrefix: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  corruptedSuffix: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
};

const modTypeLabelKey: Record<ModTypeType, string> = {
  prefix: "desiredMods.typePrefix",
  suffix: "desiredMods.typeSuffix",
  corruptedPrefix: "desiredMods.typeCorruptedPrefix",
  corruptedSuffix: "desiredMods.typeCorruptedSuffix",
};

export const DesiredModsPanel = ({
  subType,
  statTags,
  desiredMods,
  onAdd,
  onRemove,
}: DesiredModsPanelPropsType): ReactElement => {
  const tMods = useTranslations("simulator.mods");
  const tForm = useTranslations("simulator");

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const itemStatTagSet = new Set<IBaseItemStatTagType>(statTags ?? []);
  const availableMods = getModPool(subType).filter((mod) => {
    if (mod.requiredItemTags.length === 0) {
      return true;
    }
    return mod.requiredItemTags.every((tag) => itemStatTagSet.has(tag));
  });

  const alreadyAddedKeys = new Set(desiredMods.map((m) => m.modKey));
  const trimmedQuery = query.trim().toLowerCase();

  const filteredMods = availableMods.filter((mod) => {
    if (trimmedQuery.length === 0) {
      return true;
    }
    return tMods(mod.nameTemplateKey).toLowerCase().includes(trimmedQuery);
  });

  const prefixSlotsUsed = desiredMods.filter((m) => isPrefixType(m.modType)).length;
  const suffixSlotsUsed = desiredMods.filter((m) => !isPrefixType(m.modType)).length;

  const isSlotFull = (modType: ModTypeType): boolean =>
    isPrefixType(modType) ? prefixSlotsUsed >= MAX_PREFIX_SLOTS : suffixSlotsUsed >= MAX_SUFFIX_SLOTS;

  const handleAdd = (modKey: string, nameTemplateKey: string, modType: ModTypeType): void => {
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
    <div ref={containerRef} className="flex flex-col gap-3">
      {/* 1. 추가된 속성 목록 — 항상 최상단, 6개 분량 고정 높이로 레이아웃 안정 */}
      <div className="min-h-[216px] flex flex-col justify-start">
        {desiredMods.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 py-1">
            {tForm("desiredMods.emptyState")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1" aria-label={tForm("desiredMods.addedTitle")}>
            {desiredMods.map((mod) => {
            const modName = tMods(mod.nameTemplateKey);
            return (
              <li
                key={mod.id}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-1.5"
              >
                <span
                  className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${MOD_TYPE_BADGE_CLASSES[mod.modType]}`}
                >
                  {tForm(modTypeLabelKey[mod.modType])}
                </span>
                <span className="flex-1 min-w-0 text-sm text-zinc-800 dark:text-zinc-200 truncate">
                  {modName}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(mod.id)}
                  aria-label={tForm("desiredMods.removeAriaLabel", { name: modName })}
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

      {/* 2. 검색 입력 + 슬롯 카운터 + 결과 — 목록 아래 */}
      <input
        type="search"
        aria-label={tForm("desiredMods.searchPlaceholder")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={(event) => {
          if (!containerRef.current?.contains(event.relatedTarget)) {
            setIsOpen(false);
            setQuery("");
          }
        }}
        placeholder={tForm("desiredMods.searchPlaceholder")}
        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      />

      {/* 슬롯 카운터 — 검색 입력 하단 우측 */}
      <div className="flex gap-3 text-xs font-medium justify-end">
        <span className={prefixSlotsUsed >= MAX_PREFIX_SLOTS ? "text-red-500 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}>
          {tForm("desiredMods.typePrefix")} {prefixSlotsUsed}/{MAX_PREFIX_SLOTS}
        </span>
        <span className={suffixSlotsUsed >= MAX_SUFFIX_SLOTS ? "text-red-500 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}>
          {tForm("desiredMods.typeSuffix")} {suffixSlotsUsed}/{MAX_SUFFIX_SLOTS}
        </span>
      </div>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={tForm("desiredMods.sectionTitle")}
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 max-h-52 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800"
        >
          {filteredMods.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-zinc-400 dark:text-zinc-500">
              {tForm("desiredMods.noResults")}
            </li>
          ) : (
            filteredMods.map((mod) => {
              const isAdded = alreadyAddedKeys.has(mod.modKey);
              const isFull = !isAdded && isSlotFull(mod.modType);
              const isDisabled = isAdded || isFull;
              return (
                <li key={mod.modKey} role="option" aria-selected={isAdded}>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleAdd(mod.modKey, mod.nameTemplateKey, mod.modType);
                    }}
                    disabled={isDisabled}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                      isDisabled
                        ? "opacity-40 cursor-default"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                    }`}
                  >
                    <span
                      className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${MOD_TYPE_BADGE_CLASSES[mod.modType]}`}
                    >
                      {tForm(modTypeLabelKey[mod.modType])}
                    </span>
                    <span className="flex-1 min-w-0 truncate text-zinc-800 dark:text-zinc-200">
                      {tMods(mod.nameTemplateKey)}
                    </span>
                    {isAdded && (
                      <span className="shrink-0 text-xs text-zinc-400">✓</span>
                    )}
                    {isFull && (
                      <span className="shrink-0 text-xs text-red-400">{tForm("desiredMods.slotFull")}</span>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};
