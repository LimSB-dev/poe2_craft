"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { ItemSimulatorCatalogBaseName } from "@/components/item-simulator/i18n/ItemSimulatorCatalogBaseName";
import { ItemSimulatorExplicitModLine } from "@/components/item-simulator/ItemSimulatorExplicitModLine";
import { buildHinekoraExplicitSlotHighlights } from "@/lib/crafting-lab/hinekoraHoverPreviewDiff";
import type { IBaseItemDbRecordType } from "@/lib/poe2-item-simulator/baseItemDb";
import { buildBaseItemRequirementLineParts } from "@/lib/poe2-item-simulator/buildBaseItemRequirementLineParts";
import type { IItemRoll, ItemRarityType } from "@/lib/poe2-item-simulator/types";

type TooltipRarityStyleType = {
  outerBorder: string;
  leftColumnBorder: string;
  leftThumbBorder: string;
  name: string;
  divider: string;
};

const TOOLTIP_RARITY_STYLE: Record<ItemRarityType, TooltipRarityStyleType> = {
  normal: {
    outerBorder: "border-white/45",
    leftColumnBorder: "border-r-white/25",
    leftThumbBorder: "border-white/20",
    name: "text-zinc-100",
    divider: "border-t-white/20",
  },
  magic: {
    outerBorder: "border-sky-500/80",
    leftColumnBorder: "border-r-sky-600/45",
    leftThumbBorder: "border-sky-600/40",
    name: "text-sky-400",
    divider: "border-t-sky-700/35",
  },
  rare: {
    outerBorder: "border-amber-500/90",
    leftColumnBorder: "border-r-amber-600/45",
    leftThumbBorder: "border-amber-700/40",
    name: "text-amber-300",
    divider: "border-t-amber-800/40",
  },
};

type UnrevealedDesecratedClickPayloadType = {
  affixKind: "prefix" | "suffix";
  slotIndex: number;
};

type ItemSimulatorBaseItemTooltipCardPropsType = {
  record: IBaseItemDbRecordType;
  baseItemKey: string;
  /** 크래프트 랩 등: 툴팁 안에 접두·접미를 표시할 때 전달 */
  explicitItemRoll?: IItemRoll | null;
  /**
   * 히네코라 잠금 후 화폐 호버 시: 적용 직후 롤 미리보기.
   * {@link explicitItemRoll}은 현재 상태(비교 베이스라인), 본 props는 예상 결과.
   */
  previewExplicitItemRoll?: IItemRoll | null;
  /** 미공개 타락 줄 클릭 — 영혼의 우물 후보 선택 등 */
  onUnrevealedDesecratedModClick?: (
    payload: UnrevealedDesecratedClickPayloadType,
  ) => void;
  /** 히네코라·에센스 호버 미리보기 중에는 클릭 비활성 */
  soulWellInteractionDisabled?: boolean;
};

export const ItemSimulatorBaseItemTooltipCard = ({
  record,
  baseItemKey,
  explicitItemRoll,
  previewExplicitItemRoll,
  onUnrevealedDesecratedModClick,
  soulWellInteractionDisabled = false,
}: ItemSimulatorBaseItemTooltipCardPropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorWorkspace");
  const tSim = useTranslations("simulator");

  const requirementParts = buildBaseItemRequirementLineParts(record, t);
  const implicitKeys = record.implicitMods ?? [];
  const hasImplicits = implicitKeys.length > 0;
  const showExplicitSection = explicitItemRoll !== undefined && explicitItemRoll !== null;
  const hasBottomContent = hasImplicits || showExplicitSection;

  const displayExplicitRoll =
    previewExplicitItemRoll !== undefined && previewExplicitItemRoll !== null
      ? previewExplicitItemRoll
      : explicitItemRoll;
  const soulWellLineDisabled =
    soulWellInteractionDisabled ||
    (previewExplicitItemRoll !== undefined && previewExplicitItemRoll !== null);
  const hinekoraPreviewHighlight =
    previewExplicitItemRoll !== undefined &&
    previewExplicitItemRoll !== null &&
    explicitItemRoll !== undefined &&
    explicitItemRoll !== null
      ? buildHinekoraExplicitSlotHighlights(previewExplicitItemRoll, explicitItemRoll)
      : null;

  const rollRarity: ItemRarityType = displayExplicitRoll?.rarity ?? "normal";
  const rc = TOOLTIP_RARITY_STYLE[rollRarity];

  return (
    <div
      className={`rounded border bg-[#0f0c07] overflow-hidden flex ${rc.outerBorder}`}
    >
      <div
        className={`shrink-0 w-20 bg-[#0a0806] flex items-center justify-center p-2 ${rc.leftColumnBorder}`}
      >
        <div
          className={`w-14 h-14 border border-dashed flex items-center justify-center ${rc.leftThumbBorder}`}
        >
          <span className="text-[10px] text-zinc-600 select-none">img</span>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col items-center py-2 px-3 text-center">
        <p className={`font-sc text-sm leading-snug w-full ${rc.name}`}>
          <ItemSimulatorCatalogBaseName baseItemKey={baseItemKey} />
        </p>
        <p className="text-xs mt-0.5 mb-2 w-full">
          <span className="text-[#a38d6d]">{t("baseFilter.quality")}</span>
          <span className="text-[#c8c8c8]"> 0%</span>
        </p>

        <div className={`w-full border-t mb-2 ${rc.divider}`} />

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
            <div className={`w-full border-t mb-2 ${rc.divider}`} />
          </>
        )}

        {requirementParts.length > 0 && (
          <p className="text-xs text-[#a38d6d] tabular-nums w-full mb-2">
            {requirementParts.join(" / ")}
          </p>
        )}

        {hasBottomContent ? (
          <div
            className={`w-full border-t pt-2 pb-1 flex flex-col gap-3 text-center ${rc.divider}`}
          >
            {hasImplicits ? (
              <div className="w-full">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9a8a70] mb-1">
                  {t("tooltipCard.implicitHeading")}
                </p>
                <ul className="flex flex-col gap-1 list-none m-0 p-0">
                  {implicitKeys.map((implicitKey) => {
                    let implicitLine: string;
                    try {
                      implicitLine = tSim(`baseItemImplicits.${implicitKey}`);
                    } catch {
                      implicitLine = implicitKey;
                    }
                    return (
                      <li
                        key={implicitKey}
                        className="text-xs text-[#c8c8c8] leading-snug"
                      >
                        {implicitLine}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {showExplicitSection ? (
              <ul className="m-0 flex w-full list-none flex-col gap-0.5 p-0">
                {[0, 1, 2].map((index) => {
                  const mod = displayExplicitRoll?.prefixes[index];
                  const highlight =
                    hinekoraPreviewHighlight !== null
                      ? hinekoraPreviewHighlight.prefix[index]
                      : false;
                  return (
                    <li
                      key={`explicit-prefix-${String(index)}`}
                      className="flex min-h-[1.15rem] items-start gap-2 text-xs leading-snug"
                    >
                      {mod !== undefined ? (
                        <>
                          <span
                            className={[
                              "w-8 shrink-0 pt-0.5 text-left text-[10px] font-medium tabular-nums",
                              highlight
                                ? "text-amber-300/95"
                                : "text-[#3d3d3d]",
                            ].join(" ")}
                            aria-hidden
                          >
                            T{mod.tier}
                          </span>
                          <div
                            className={`flex min-w-0 flex-1 justify-center ${
                              highlight
                                ? mod.isFractured === true
                                  ? "text-amber-300/70"
                                  : "text-amber-300"
                                : mod.isFractured === true
                                  ? "text-sky-200/45"
                                  : "text-sky-200/90"
                            }`}
                          >
                            <div className="text-center">
                              <ItemSimulatorExplicitModLine
                                modDefinition={mod}
                                onUnrevealedDesecratedActivate={
                                  onUnrevealedDesecratedModClick !== undefined &&
                                  !soulWellLineDisabled
                                    ? () => {
                                        onUnrevealedDesecratedModClick({
                                          affixKind: "prefix",
                                          slotIndex: index,
                                        });
                                      }
                                    : undefined
                                }
                              />
                            </div>
                          </div>
                        </>
                      ) : null}
                    </li>
                  );
                })}
                {[0, 1, 2].map((index) => {
                  const mod = displayExplicitRoll?.suffixes[index];
                  const highlight =
                    hinekoraPreviewHighlight !== null
                      ? hinekoraPreviewHighlight.suffix[index]
                      : false;
                  return (
                    <li
                      key={`explicit-suffix-${String(index)}`}
                      className="flex min-h-[1.15rem] items-start gap-2 text-xs leading-snug"
                    >
                      {mod !== undefined ? (
                        <>
                          <span
                            className={[
                              "w-8 shrink-0 pt-0.5 text-left text-[10px] font-medium tabular-nums",
                              highlight
                                ? "text-amber-300/95"
                                : "text-[#3d3d3d]",
                            ].join(" ")}
                            aria-hidden
                          >
                            T{mod.tier}
                          </span>
                          <div
                            className={`flex min-w-0 flex-1 justify-center ${
                              highlight
                                ? mod.isFractured === true
                                  ? "text-amber-300/70"
                                  : "text-amber-300"
                                : mod.isFractured === true
                                  ? "text-rose-200/45"
                                  : "text-rose-200/90"
                            }`}
                          >
                            <div className="text-center">
                              <ItemSimulatorExplicitModLine
                                modDefinition={mod}
                                onUnrevealedDesecratedActivate={
                                  onUnrevealedDesecratedModClick !== undefined &&
                                  !soulWellLineDisabled
                                    ? () => {
                                        onUnrevealedDesecratedModClick({
                                          affixKind: "suffix",
                                          slotIndex: index,
                                        });
                                      }
                                    : undefined
                                }
                              />
                            </div>
                          </div>
                        </>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        ) : (
          <div
            className={`w-full border-t pt-2 pb-1 min-h-[1.35rem] ${rc.divider}`}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
};
