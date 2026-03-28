"use client";

import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { BaseItemFilterRangeFieldsPropsType } from "@/components/organisms/filters";
import { BASE_ITEMS } from "@/lib/poe2-item-simulator/baseItems";
import {
  BASE_ITEM_DB,
  BASE_ITEM_SUB_TYPES_BY_EQUIPMENT,
} from "@/lib/poe2-item-simulator/baseItemDb";

export type UseBaseItemWorkspaceStateReturnType = {
  selectedBaseItemKey: string;
  setSelectedBaseItemKey: (key: string) => void;
  equipmentTypeFilter: BaseItemEquipmentFilterType;
  setSubTypeFilter: (value: BaseItemSubTypeFilterType) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
  availableSubTypes: IBaseItemSubTypeType[];
  normalizedSubTypeFilter: BaseItemSubTypeFilterType;
  filteredBaseItemRecords: ReadonlyArray<IBaseItemDbRecordType>;
  effectiveSelectedBaseItemKey: string;
  selectedBaseItem: IBaseItemDefinition | undefined;
  selectedBaseItemRecord: IBaseItemDbRecordType | undefined;
  rangeFieldsProps: BaseItemFilterRangeFieldsPropsType;
  handleEquipmentTypeChange: (value: BaseItemEquipmentFilterType) => void;
};

export const useBaseItemWorkspaceState =
  (): UseBaseItemWorkspaceStateReturnType => {
    const firstBaseItem: IBaseItemDefinition | undefined = BASE_ITEMS[0];
    const baseItemRecords: ReadonlyArray<IBaseItemDbRecordType> =
      BASE_ITEM_DB.records;
    const [selectedBaseItemKey, setSelectedBaseItemKey] = useState<string>(
      firstBaseItem ? firstBaseItem.baseItemKey : "",
    );
    const [equipmentTypeFilter, setEquipmentTypeFilter] =
      useState<BaseItemEquipmentFilterType>("all");
    const [subTypeFilter, setSubTypeFilter] =
      useState<BaseItemSubTypeFilterType>("all");
    const [minimumRequiredStrength, setMinimumRequiredStrength] =
      useState<number>(0);
    const [maximumRequiredStrength, setMaximumRequiredStrength] =
      useState<number>(999);
    const [minimumRequiredDexterity, setMinimumRequiredDexterity] =
      useState<number>(0);
    const [maximumRequiredDexterity, setMaximumRequiredDexterity] =
      useState<number>(999);
    const [minimumRequiredIntelligence, setMinimumRequiredIntelligence] =
      useState<number>(0);
    const [maximumRequiredIntelligence, setMaximumRequiredIntelligence] =
      useState<number>(999);
    const [minimumRequiredLevel, setMinimumRequiredLevel] = useState<number>(1);
    const [maximumRequiredLevel, setMaximumRequiredLevel] =
      useState<number>(100);
    const [minimumArmour, setMinimumArmour] = useState<number>(0);
    const [maximumArmour, setMaximumArmour] = useState<number>(9999);
    const [minimumEvasion, setMinimumEvasion] = useState<number>(0);
    const [maximumEvasion, setMaximumEvasion] = useState<number>(9999);
    const [minimumEnergyShield, setMinimumEnergyShield] = useState<number>(0);
    const [maximumEnergyShield, setMaximumEnergyShield] =
      useState<number>(9999);
    const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

    const availableSubTypes = useMemo(() => {
      if (equipmentTypeFilter === "all") {
        const dedupe = new Set<IBaseItemSubTypeType>();
        for (const subTypes of Object.values(
          BASE_ITEM_SUB_TYPES_BY_EQUIPMENT,
        )) {
          for (const subType of subTypes) {
            dedupe.add(subType);
          }
        }
        return Array.from(dedupe);
      }
      return [...BASE_ITEM_SUB_TYPES_BY_EQUIPMENT[equipmentTypeFilter]];
    }, [equipmentTypeFilter]);

    const normalizedSubTypeFilter: BaseItemSubTypeFilterType =
      subTypeFilter === "all" || availableSubTypes.includes(subTypeFilter)
        ? subTypeFilter
        : "all";

    const filteredBaseItemRecords = useMemo(() => {
      return baseItemRecords.filter((record) => {
        if (
          equipmentTypeFilter !== "all" &&
          record.equipmentType !== equipmentTypeFilter
        ) {
          return false;
        }
        if (
          normalizedSubTypeFilter !== "all" &&
          record.subType !== normalizedSubTypeFilter
        ) {
          return false;
        }
        if (record.requiredStrength < minimumRequiredStrength) {
          return false;
        }
        if (record.requiredStrength > maximumRequiredStrength) {
          return false;
        }
        if (record.requiredDexterity < minimumRequiredDexterity) {
          return false;
        }
        if (record.requiredDexterity > maximumRequiredDexterity) {
          return false;
        }
        if (record.requiredIntelligence < minimumRequiredIntelligence) {
          return false;
        }
        if (record.requiredIntelligence > maximumRequiredIntelligence) {
          return false;
        }
        if (record.levelRequirement < minimumRequiredLevel) {
          return false;
        }
        if (record.levelRequirement > maximumRequiredLevel) {
          return false;
        }
        const armour = record.armour ?? 0;
        if (armour < minimumArmour || armour > maximumArmour) {
          return false;
        }
        const evasion = record.evasion ?? 0;
        if (evasion < minimumEvasion || evasion > maximumEvasion) {
          return false;
        }
        const energyShield = record.energyShield ?? 0;
        if (
          energyShield < minimumEnergyShield ||
          energyShield > maximumEnergyShield
        ) {
          return false;
        }
        return true;
      });
    }, [
      baseItemRecords,
      equipmentTypeFilter,
      normalizedSubTypeFilter,
      minimumRequiredStrength,
      maximumRequiredStrength,
      minimumRequiredDexterity,
      maximumRequiredDexterity,
      minimumRequiredIntelligence,
      maximumRequiredIntelligence,
      minimumRequiredLevel,
      maximumRequiredLevel,
      minimumArmour,
      maximumArmour,
      minimumEvasion,
      maximumEvasion,
      minimumEnergyShield,
      maximumEnergyShield,
    ]);

    const effectiveSelectedBaseItemKey = useMemo(() => {
      const exists = filteredBaseItemRecords.some(
        (record) => record.baseItemKey === selectedBaseItemKey,
      );
      if (exists) {
        return selectedBaseItemKey;
      }
      const first = filteredBaseItemRecords[0];
      return first ? first.baseItemKey : "";
    }, [filteredBaseItemRecords, selectedBaseItemKey]);

    const selectedBaseItem: IBaseItemDefinition | undefined = BASE_ITEMS.find(
      (baseItem) => {
        return baseItem.baseItemKey === effectiveSelectedBaseItemKey;
      },
    );
    const selectedBaseItemRecord: IBaseItemDbRecordType | undefined =
      filteredBaseItemRecords.find((record) => {
        if (!selectedBaseItem) {
          return false;
        }
        return record.baseItemKey === selectedBaseItem.baseItemKey;
      });

    const rangeFieldsProps: BaseItemFilterRangeFieldsPropsType = {
      minimumRequiredLevel,
      maximumRequiredLevel,
      setMinimumRequiredLevel: (value: number): void => {
        setMinimumRequiredLevel(
          Math.max(1, Math.min(value, maximumRequiredLevel)),
        );
      },
      setMaximumRequiredLevel: (value: number): void => {
        setMaximumRequiredLevel(
          Math.max(minimumRequiredLevel, Math.min(100, value)),
        );
      },
      minimumArmour,
      maximumArmour,
      setMinimumArmour: (value: number): void => {
        setMinimumArmour(Math.max(0, Math.min(value, maximumArmour)));
      },
      setMaximumArmour: (value: number): void => {
        setMaximumArmour(Math.max(minimumArmour, Math.min(9999, value)));
      },
      minimumEvasion,
      maximumEvasion,
      setMinimumEvasion: (value: number): void => {
        setMinimumEvasion(Math.max(0, Math.min(value, maximumEvasion)));
      },
      setMaximumEvasion: (value: number): void => {
        setMaximumEvasion(Math.max(minimumEvasion, Math.min(9999, value)));
      },
      minimumEnergyShield,
      maximumEnergyShield,
      setMinimumEnergyShield: (value: number): void => {
        setMinimumEnergyShield(
          Math.max(0, Math.min(value, maximumEnergyShield)),
        );
      },
      setMaximumEnergyShield: (value: number): void => {
        setMaximumEnergyShield(
          Math.max(minimumEnergyShield, Math.min(9999, value)),
        );
      },
      minimumRequiredStrength,
      maximumRequiredStrength,
      setMinimumRequiredStrength: (value: number): void => {
        setMinimumRequiredStrength(
          Math.max(0, Math.min(value, maximumRequiredStrength)),
        );
      },
      setMaximumRequiredStrength: (value: number): void => {
        setMaximumRequiredStrength(
          Math.max(minimumRequiredStrength, Math.min(999, value)),
        );
      },
      minimumRequiredDexterity,
      maximumRequiredDexterity,
      setMinimumRequiredDexterity: (value: number): void => {
        setMinimumRequiredDexterity(
          Math.max(0, Math.min(value, maximumRequiredDexterity)),
        );
      },
      setMaximumRequiredDexterity: (value: number): void => {
        setMaximumRequiredDexterity(
          Math.max(minimumRequiredDexterity, Math.min(999, value)),
        );
      },
      minimumRequiredIntelligence,
      maximumRequiredIntelligence,
      setMinimumRequiredIntelligence: (value: number): void => {
        setMinimumRequiredIntelligence(
          Math.max(0, Math.min(value, maximumRequiredIntelligence)),
        );
      },
      setMaximumRequiredIntelligence: (value: number): void => {
        setMaximumRequiredIntelligence(
          Math.max(minimumRequiredIntelligence, Math.min(999, value)),
        );
      },
    };

    const handleEquipmentTypeChange = (
      value: BaseItemEquipmentFilterType,
    ): void => {
      setEquipmentTypeFilter(value);
      setSubTypeFilter("all");
    };

    return {
      selectedBaseItemKey,
      setSelectedBaseItemKey,
      equipmentTypeFilter,
      setSubTypeFilter,
      isFilterOpen,
      setIsFilterOpen,
      availableSubTypes,
      normalizedSubTypeFilter,
      filteredBaseItemRecords,
      effectiveSelectedBaseItemKey,
      selectedBaseItem,
      selectedBaseItemRecord,
      rangeFieldsProps,
      handleEquipmentTypeChange,
    };
  };
