import type {
  IBaseItemEquipmentTypeType,
  IBaseItemSubTypeType,
} from "@/lib/poe2-item-simulator/baseItemDb";

export type ItemSimulatorEquipmentFilterType =
  | "all"
  | IBaseItemEquipmentTypeType;

export type ItemSimulatorSubTypeFilterType = "all" | IBaseItemSubTypeType;
