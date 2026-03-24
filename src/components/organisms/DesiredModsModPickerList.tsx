"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";

import type { IModDbRecordType } from "@/lib/poe2-item-simulator/modDb";
import type { ModTypeType } from "@/types/poe2-item-simulator";

const MOD_TYPE_BADGE_CLASSES: Record<ModTypeType, string> = {
  prefix: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  suffix:
    "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  corruptedPrefix:
    "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  corruptedSuffix:
    "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
};

type DesiredModsModPickerListPropsType = {
  availableMods: ReadonlyArray<IModDbRecordType>;
  alreadyAddedKeys: ReadonlySet<string>;
  typeBadgeLabels: Record<ModTypeType, string>;
  searchPlaceholder: string;
  searchAriaLabel: string;
  listAriaLabel: string;
  noResultsLabel: string;
  slotFullLabel: string;
  isSlotFull: (modType: ModTypeType) => boolean;
  onAdd: (
    modKey: string,
    nameTemplateKey: string,
    modType: ModTypeType,
  ) => void;
};

/**
 * 속성 검색·목록 — `simulator.mods.{nameTemplateKey}` (i18n).
 */
export const DesiredModsModPickerList = ({
  availableMods,
  alreadyAddedKeys,
  typeBadgeLabels,
  searchPlaceholder,
  searchAriaLabel,
  listAriaLabel,
  noResultsLabel,
  slotFullLabel,
  isSlotFull,
  onAdd,
}: DesiredModsModPickerListPropsType): ReactElement => {
  const t = useTranslations("simulator");
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = query.trim().toLowerCase();

  const modLine = useCallback(
    (nameTemplateKey: string): string => {
      try {
        return t(`mods.${nameTemplateKey}` as never);
      } catch {
        return nameTemplateKey;
      }
    },
    [t],
  );

  const filteredMods = useMemo(() => {
    return availableMods.filter((mod) => {
      if (trimmedQuery.length === 0) {
        return true;
      }
      const label = modLine(mod.nameTemplateKey);
      return label.toLowerCase().includes(trimmedQuery);
    });
  }, [availableMods, trimmedQuery, modLine]);

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      <input
        type="search"
        aria-label={searchAriaLabel}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
        onFocus={() => {
          setIsOpen(true);
        }}
        onBlur={(event) => {
          if (!containerRef.current?.contains(event.relatedTarget)) {
            setIsOpen(false);
            setQuery("");
          }
        }}
        placeholder={searchPlaceholder}
        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      />

      {isOpen && (
        <ul
          role="listbox"
          aria-label={listAriaLabel}
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 max-h-52 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800"
        >
          {filteredMods.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-zinc-400 dark:text-zinc-500">
              {noResultsLabel}
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
                      onAdd(mod.modKey, mod.nameTemplateKey, mod.modType);
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
                      {typeBadgeLabels[mod.modType]}
                    </span>
                    <span className="flex-1 min-w-0 truncate text-zinc-800 dark:text-zinc-200">
                      {modLine(mod.nameTemplateKey)}
                    </span>
                    {isAdded && (
                      <span className="shrink-0 text-xs text-zinc-400">✓</span>
                    )}
                    {isFull && (
                      <span className="shrink-0 text-xs text-red-400">
                        {slotFullLabel}
                      </span>
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
