"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { ItemSimulatorCatalogBaseName } from "@/components/item-simulator/i18n/ItemSimulatorCatalogBaseName";
import type { IBaseItemDbRecordType } from "@/lib/poe2-item-simulator/baseItemDb";
import { buildBaseItemRequirementLineParts } from "@/lib/poe2-item-simulator/buildBaseItemRequirementLineParts";

type ItemSimulatorBaseItemTooltipCardPropsType = {
  record: IBaseItemDbRecordType;
  baseItemKey: string;
};

export const ItemSimulatorBaseItemTooltipCard = ({
  record,
  baseItemKey,
}: ItemSimulatorBaseItemTooltipCardPropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorWorkspace");

  const requirementParts = buildBaseItemRequirementLineParts(record, t);

  return (
    <div className="rounded border border-[#7a5c1e] bg-[#0f0c07] overflow-hidden flex">
      <div className="shrink-0 w-20 bg-[#0a0806] border-r border-[#3d2e10] flex items-center justify-center p-2">
        <div className="w-14 h-14 border border-dashed border-[#3d2e10] flex items-center justify-center">
          <span className="text-[10px] text-[#4a3c20] select-none">img</span>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col items-center py-2 px-3 text-center">
        <p className="font-sc text-[#c8a55a] text-sm leading-snug w-full">
          <ItemSimulatorCatalogBaseName baseItemKey={baseItemKey} />
        </p>
        <p className="text-xs mt-0.5 mb-2 w-full">
          <span className="text-[#a38d6d]">{t("baseFilter.quality")}</span>
          <span className="text-[#c8c8c8]"> 0%</span>
        </p>

        <div className="w-full border-t border-[#3d2e10] mb-2" />

        {(record.armour !== undefined ||
          record.evasion !== undefined ||
          record.energyShield !== undefined) && (
          <>
            <div className="flex flex-col gap-1 tabular-nums mb-2 w-full">
              {record.armour !== undefined && (
                <p className="text-xs">
                  <span className="text-[#a38d6d]">{t("baseFilter.armour")}</span>
                  <span className="text-[#c8c8c8]"> {record.armour}</span>
                </p>
              )}
              {record.evasion !== undefined && (
                <p className="text-xs">
                  <span className="text-[#a38d6d]">{t("baseFilter.evasion")}</span>
                  <span className="text-[#c8c8c8]"> {record.evasion}</span>
                </p>
              )}
              {record.energyShield !== undefined && (
                <p className="text-xs">
                  <span className="text-[#a38d6d]">
                    {t("baseFilter.energyShield")}
                  </span>
                  <span className="text-[#c8c8c8]"> {record.energyShield}</span>
                </p>
              )}
            </div>
            <div className="w-full border-t border-[#3d2e10] mb-2" />
          </>
        )}

        {requirementParts.length > 0 && (
          <p className="text-xs text-[#a38d6d] tabular-nums w-full mb-2">
            {requirementParts.join(" / ")}
          </p>
        )}

        <div
          className="w-full border-t border-[#3d2e10] pt-2 pb-1 min-h-[1.35rem]"
          aria-hidden="true"
        />
      </div>
    </div>
  );
};
