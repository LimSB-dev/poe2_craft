"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { ReactElement } from "react";

import { BASE_ITEMS } from "@/lib/poe2-item-simulator/baseItems";

type ItemSimulatorBaseItemSearchBlockPropsType = {
  filteredBaseItemRecords: ReadonlyArray<IBaseItemDbRecordType>;
  effectiveSelectedBaseItemKey: string;
  onSelectBaseItemKey: (baseItemKey: string) => void;
  searchPlaceholder: string;
  ariaLabelBaseItem: string;
  noResultsLabel: string;
};

/**
 * 베이스 아이템 검색·드롭다운 — 베이스 표시명은 전체 목록이 있는 `simulator.baseItems`를 사용한다.
 */
export const ItemSimulatorBaseItemSearchBlock = ({
  filteredBaseItemRecords,
  effectiveSelectedBaseItemKey,
  onSelectBaseItemKey,
  searchPlaceholder,
  ariaLabelBaseItem,
  noResultsLabel,
}: ItemSimulatorBaseItemSearchBlockPropsType): ReactElement => {
  const tBaseNames = useTranslations("simulator");
  const [baseItemQuery, setBaseItemQuery] = useState("");
  const [isBaseItemDropdownOpen, setIsBaseItemDropdownOpen] = useState(false);
  const baseItemContainerRef = useRef<HTMLDivElement>(null);

  const resolveLabel = (baseItemKey: string): string => {
    const def = BASE_ITEMS.find((b) => b.baseItemKey === baseItemKey);
    if (!def) {
      return baseItemKey;
    }
    try {
      return tBaseNames(`baseItems.${def.baseItemKey}.name`);
    } catch {
      return baseItemKey;
    }
  };

  const trimmed = baseItemQuery.trim().toLowerCase();
  const matched = filteredBaseItemRecords.filter((record) => {
    if (trimmed.length === 0) {
      return true;
    }
    const label = resolveLabel(record.baseItemKey);
    return label.toLowerCase().includes(trimmed);
  });
  const selectedRecord = matched.find((record) => {
    return record.baseItemKey === effectiveSelectedBaseItemKey;
  });
  const dropdownItems =
    selectedRecord !== undefined
      ? [
          selectedRecord,
          ...matched.filter((record) => {
            return record.baseItemKey !== effectiveSelectedBaseItemKey;
          }),
        ]
      : matched;

  return (
    <div ref={baseItemContainerRef} className="flex flex-col gap-2">
      <input
        type="search"
        aria-label={ariaLabelBaseItem}
        value={baseItemQuery}
        onChange={(event) => {
          setBaseItemQuery(event.target.value);
        }}
        onFocus={() => {
          setIsBaseItemDropdownOpen(true);
        }}
        onBlur={(event) => {
          if (!baseItemContainerRef.current?.contains(event.relatedTarget)) {
            setIsBaseItemDropdownOpen(false);
            setBaseItemQuery("");
          }
        }}
        placeholder={searchPlaceholder}
        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      />

      {isBaseItemDropdownOpen && (
        <ul
          role="listbox"
          aria-label={ariaLabelBaseItem}
          className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 max-h-52 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800"
        >
          {dropdownItems.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-zinc-400 dark:text-zinc-500">
              {noResultsLabel}
            </li>
          ) : (
            dropdownItems.map((record) => {
              const label = resolveLabel(record.baseItemKey);
              const isSelected =
                record.baseItemKey === effectiveSelectedBaseItemKey;
              return (
                <li
                  key={record.baseItemKey}
                  role="option"
                  aria-selected={isSelected}
                >
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onSelectBaseItemKey(record.baseItemKey);
                      setIsBaseItemDropdownOpen(false);
                      setBaseItemQuery("");
                    }}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                      isSelected
                        ? "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    <span className="flex-1 truncate">{label}</span>
                    {isSelected && (
                      <span className="shrink-0 text-xs text-amber-500">
                        ✓
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
