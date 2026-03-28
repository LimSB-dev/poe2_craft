"use client";

import { useTranslations } from "next-intl";
import { useId, type ReactElement } from "react";

import {
  BASE_ITEM_ITEM_LEVEL_MAX,
  BASE_ITEM_ITEM_LEVEL_MIN,
  clampBaseItemItemLevel,
} from "@/lib/poe2-item-simulator/baseItemItemLevel";

export type BaseItemItemLevelControlPropsType = {
  value: number;
  onChange: (next: number) => void;
};

export const BaseItemItemLevelControl = (
  props: BaseItemItemLevelControlPropsType,
): ReactElement => {
  const { value, onChange } = props;
  const t = useTranslations("simulator.itemSimulatorWorkspace");
  const labelId = useId();
  const sliderId = useId();
  const inputId = useId();

  const clamped = clampBaseItemItemLevel(value);

  return (
    <div className="flex flex-col gap-1.5">
      <span
        id={labelId}
        className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
      >
        {t("baseFilter.itemLevel")}
      </span>
      <div
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
        role="group"
        aria-labelledby={labelId}
      >
        <input
          id={sliderId}
          type="range"
          min={BASE_ITEM_ITEM_LEVEL_MIN}
          max={BASE_ITEM_ITEM_LEVEL_MAX}
          value={clamped}
          aria-label={t("baseFilter.itemLevelSlider")}
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10);
            if (Number.isFinite(next)) {
              onChange(clampBaseItemItemLevel(next));
            }
          }}
          className="h-2 w-full cursor-pointer accent-zinc-600 dark:accent-zinc-400 sm:flex-1"
        />
        <input
          id={inputId}
          type="number"
          min={BASE_ITEM_ITEM_LEVEL_MIN}
          max={BASE_ITEM_ITEM_LEVEL_MAX}
          value={clamped}
          aria-label={t("baseFilter.itemLevelInput")}
          onFocus={(event) => {
            event.target.select();
          }}
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10);
            if (Number.isFinite(next)) {
              onChange(clampBaseItemItemLevel(next));
            }
          }}
          className="w-full shrink-0 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-center text-xs tabular-nums dark:border-zinc-700 dark:bg-zinc-900 sm:w-16"
        />
      </div>
    </div>
  );
};
