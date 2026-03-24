"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";

import {
  getAttributeRequirementPrefix,
  getLevelRequirementLabel,
} from "@/lib/poe2-item-simulator/coreAttributeLabels";

export type ItemSimulatorBaseItemFilterRangeFieldsPropsType = {
  minimumRequiredLevel: number;
  maximumRequiredLevel: number;
  setMinimumRequiredLevel: (value: number) => void;
  setMaximumRequiredLevel: (value: number) => void;
  minimumArmour: number;
  maximumArmour: number;
  setMinimumArmour: (value: number) => void;
  setMaximumArmour: (value: number) => void;
  minimumEvasion: number;
  maximumEvasion: number;
  setMinimumEvasion: (value: number) => void;
  setMaximumEvasion: (value: number) => void;
  minimumEnergyShield: number;
  maximumEnergyShield: number;
  setMinimumEnergyShield: (value: number) => void;
  setMaximumEnergyShield: (value: number) => void;
  minimumRequiredStrength: number;
  maximumRequiredStrength: number;
  setMinimumRequiredStrength: (value: number) => void;
  setMaximumRequiredStrength: (value: number) => void;
  minimumRequiredDexterity: number;
  maximumRequiredDexterity: number;
  setMinimumRequiredDexterity: (value: number) => void;
  setMaximumRequiredDexterity: (value: number) => void;
  minimumRequiredIntelligence: number;
  maximumRequiredIntelligence: number;
  setMinimumRequiredIntelligence: (value: number) => void;
  setMaximumRequiredIntelligence: (value: number) => void;
};

export const ItemSimulatorBaseItemFilterRangeFields = (
  props: ItemSimulatorBaseItemFilterRangeFieldsPropsType,
): ReactElement => {
  const locale = useLocale();
  const t = useTranslations("simulator.itemSimulatorWorkspace");

  const stats = [
    {
      id: "level",
      label: getLevelRequirementLabel(locale),
      minValue: props.minimumRequiredLevel,
      maxValue: props.maximumRequiredLevel,
      onMinChange: props.setMinimumRequiredLevel,
      onMaxChange: props.setMaximumRequiredLevel,
      absMin: 1,
      absMax: 100,
    },
    {
      id: "armour",
      label: t("baseFilter.armour"),
      minValue: props.minimumArmour,
      maxValue: props.maximumArmour,
      onMinChange: props.setMinimumArmour,
      onMaxChange: props.setMaximumArmour,
      absMin: 0,
      absMax: 9999,
    },
    {
      id: "evasion",
      label: t("baseFilter.evasion"),
      minValue: props.minimumEvasion,
      maxValue: props.maximumEvasion,
      onMinChange: props.setMinimumEvasion,
      onMaxChange: props.setMaximumEvasion,
      absMin: 0,
      absMax: 9999,
    },
    {
      id: "energyShield",
      label: t("baseFilter.energyShield"),
      minValue: props.minimumEnergyShield,
      maxValue: props.maximumEnergyShield,
      onMinChange: props.setMinimumEnergyShield,
      onMaxChange: props.setMaximumEnergyShield,
      absMin: 0,
      absMax: 9999,
    },
    {
      id: "str",
      label: getAttributeRequirementPrefix("str", locale),
      minValue: props.minimumRequiredStrength,
      maxValue: props.maximumRequiredStrength,
      onMinChange: props.setMinimumRequiredStrength,
      onMaxChange: props.setMaximumRequiredStrength,
      absMin: 0,
      absMax: 999,
    },
    {
      id: "dex",
      label: getAttributeRequirementPrefix("dex", locale),
      minValue: props.minimumRequiredDexterity,
      maxValue: props.maximumRequiredDexterity,
      onMinChange: props.setMinimumRequiredDexterity,
      onMaxChange: props.setMaximumRequiredDexterity,
      absMin: 0,
      absMax: 999,
    },
    {
      id: "int",
      label: getAttributeRequirementPrefix("int", locale),
      minValue: props.minimumRequiredIntelligence,
      maxValue: props.maximumRequiredIntelligence,
      onMinChange: props.setMinimumRequiredIntelligence,
      onMaxChange: props.setMaximumRequiredIntelligence,
      absMin: 0,
      absMax: 999,
    },
  ] as const;

  return (
    <div className="flex flex-col gap-2">
      {stats.map((stat) => (
        <div key={stat.id} className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {stat.label}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={stat.absMin}
              max={stat.absMax}
              value={stat.minValue}
              onFocus={(event) => {
                event.target.select();
              }}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                if (Number.isFinite(next)) {
                  stat.onMinChange(next);
                }
              }}
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs text-center"
            />
            <span className="shrink-0 text-xs text-zinc-400">~</span>
            <input
              type="number"
              min={stat.absMin}
              max={stat.absMax}
              value={stat.maxValue}
              onFocus={(event) => {
                event.target.select();
              }}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                if (Number.isFinite(next)) {
                  stat.onMaxChange(next);
                }
              }}
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs text-center"
            />
          </div>
        </div>
      ))}
    </div>
  );
};
