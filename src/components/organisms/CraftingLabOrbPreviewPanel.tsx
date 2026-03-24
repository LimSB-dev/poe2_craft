"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { SimulatorModTemplateText } from "@/components/organisms/SimulatorModTemplateText";
import type { CraftLabOrbPreviewResultType } from "@/lib/crafting-lab/craftLabOrbPreview";

type CraftingLabOrbPreviewPanelPropsType = {
  orbLabel: string;
  preview: CraftLabOrbPreviewResultType;
  onClose: () => void;
};

export const CraftingLabOrbPreviewPanel = ({
  orbLabel,
  preview,
  onClose,
}: CraftingLabOrbPreviewPanelPropsType): ReactElement => {
  const t = useTranslations("simulator.craftLab");
  const format = useFormatter();

  return (
    <div
      className="rounded-lg border border-amber-900/40 bg-zinc-950/90 p-3 text-sm shadow-lg"
      role="region"
      aria-labelledby="craft-lab-preview-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h4
          id="craft-lab-preview-heading"
          className="font-sc font-semibold text-amber-100 text-sm pr-2"
        >
          {preview.status === "unavailable"
            ? t("previewUnavailable")
            : t("previewTitle", { orb: orbLabel })}
        </h4>
        <button
          type="button"
          onClick={() => {
            onClose();
          }}
          className="shrink-0 rounded border border-zinc-600 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          {t("previewClose")}
        </button>
      </div>

      {preview.status === "unavailable" ? (
        <p className="text-xs text-zinc-500">{t("previewUnavailableDetail")}</p>
      ) : (
        <>
          {preview.noteKeys !== undefined
            ? preview.noteKeys.map((key) => {
                return (
                  <p
                    key={key}
                    className="text-xs text-zinc-400 mb-2 leading-snug"
                  >
                    {t(key)}
                  </p>
                );
              })
            : null}
          {preview.sections.map((section) => {
            return (
              <div key={section.headingKey} className="mb-3 last:mb-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">
                  {t(section.headingKey)}
                </p>
                {section.rows.length === 0 ? (
                  <p className="text-xs text-zinc-500">{t("previewEmptySection")}</p>
                ) : (
                  <div className="max-h-52 overflow-auto rounded border border-zinc-800/90">
                    <table className="w-full min-w-[280px] text-left text-xs text-zinc-200">
                      <thead className="sticky top-0 bg-zinc-900/95 text-[10px] uppercase text-zinc-500">
                        <tr>
                          <th className="px-2 py-1.5 font-medium">
                            {t("previewModCol")}
                          </th>
                          <th className="w-10 px-1 py-1.5 font-medium text-center">
                            {t("previewTierCol")}
                          </th>
                          <th className="w-16 px-1 py-1.5 font-medium text-right">
                            {t("previewProbCol")}
                          </th>
                          <th className="w-14 px-1 py-1.5 font-medium text-right">
                            {t("previewWeightCol")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows.map((row) => {
                          return (
                            <tr
                              key={`${section.headingKey}-${row.modKey}`}
                              className="border-t border-zinc-800/80"
                            >
                              <td className="px-2 py-1 align-top">
                                <SimulatorModTemplateText
                                  nameTemplateKey={row.nameTemplateKey}
                                />
                              </td>
                              <td className="px-1 py-1 text-center tabular-nums text-zinc-400">
                                {row.tier}
                              </td>
                              <td className="px-1 py-1 text-right tabular-nums text-amber-200/95">
                                {format.number(row.probability, {
                                  style: "percent",
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-1 py-1 text-right tabular-nums text-zinc-500">
                                {row.weight > 0 ? row.weight : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};
