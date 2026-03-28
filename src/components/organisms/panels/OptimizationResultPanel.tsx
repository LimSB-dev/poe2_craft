"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { ReservedStatusRegion } from "@/components/atoms";
import {
  ActionMixBarRow,
  SelectedBaseItemSummaryCard,
  StatCalloutCard,
} from "@/components/molecules";
import { PanelShell } from "@/components/molecules/panels";

type OptimizationResultPanelPropsType = {
  selectedBaseItem: IBaseItemDefinition | null;
  desiredMods: ReadonlyArray<IDesiredModEntryType>;
  rlTrainResponse: IRlTrainResponseType | null;
  isRlTraining: boolean;
  rlError: string | null;
  onRunOptimizationExplore: () => void;
};

const toPercent = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

export const OptimizationResultPanel = ({
  selectedBaseItem,
  desiredMods,
  rlTrainResponse,
  isRlTraining,
  rlError,
  onRunOptimizationExplore,
}: OptimizationResultPanelPropsType): ReactElement => {
  const t = useTranslations("simulator");

  const actionLabel = (action: "chaos" | "essence" | "stop"): string => {
    return t(`rlView.actions.${action}`);
  };

  return (
    <PanelShell
      title={t("itemSimulatorWorkspace.panels.result.title")}
      description={t("itemSimulatorWorkspace.panels.result.description")}
    >
      <button
        type="button"
        onClick={() => {
          onRunOptimizationExplore();
        }}
        disabled={!selectedBaseItem || isRlTraining}
        aria-busy={isRlTraining}
        className="w-full sm:w-auto rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 disabled:pointer-events-none disabled:opacity-50"
      >
        {isRlTraining
          ? t("rlView.inputs.training")
          : t("itemSimulatorWorkspace.optimizationExplore.runButton")}
      </button>

      {!selectedBaseItem ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("itemSimulatorWorkspace.optimizationExplore.emptyNeedBase")}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <SelectedBaseItemSummaryCard selectedBaseItem={selectedBaseItem} />

          <ReservedStatusRegion
            minHeightClass="min-h-[3.25rem]"
            isEmpty={rlError === null}
            placeholderTextClassName="text-sm leading-snug"
          >
            {rlError !== null ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {rlError}
              </p>
            ) : null}
          </ReservedStatusRegion>

          {!rlTrainResponse ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("itemSimulatorWorkspace.optimizationExplore.emptyPrompt")}
            </p>
          ) : (
            <section
              className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2.5"
              aria-labelledby="optimization-explore-heading"
            >
              <h3
                id="optimization-explore-heading"
                className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
              >
                {t("rlView.result.title")}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {t("itemSimulatorWorkspace.optimizationExplore.paramsSummary", {
                  desiredGoodMods: rlTrainResponse.params.desiredGoodMods,
                  budget: rlTrainResponse.params.budget,
                  episodes: rlTrainResponse.params.episodes,
                })}
              </p>
              {rlTrainResponse.params.baseItemKey !== null ? (
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 break-all">
                  {t("itemSimulatorWorkspace.optimizationExplore.payloadEchoBase", {
                    baseItemKey: rlTrainResponse.params.baseItemKey,
                  })}
                </p>
              ) : null}
              {rlTrainResponse.params.desiredMods.length > 0 ? (
                <div className="mt-2">
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {t("itemSimulatorWorkspace.optimizationExplore.payloadEchoModsHeading")}
                  </p>
                  <ul className="mt-1 list-disc list-inside space-y-0.5 text-xs text-zinc-600 dark:text-zinc-400 break-all">
                    {rlTrainResponse.params.desiredMods.map((row) => {
                      return (
                        <li key={row.id}>
                          {t("itemSimulatorWorkspace.optimizationExplore.payloadEchoModLine", {
                            modKey: row.modKey,
                            modType: row.modType,
                          })}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
              {desiredMods.length > 0 ? (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                  {t("itemSimulatorWorkspace.optimizationExplore.desiredModsHint", {
                    count: desiredMods.length,
                  })}
                </p>
              ) : (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                  {t("itemSimulatorWorkspace.optimizationExplore.defaultDesiredModsHint")}
                </p>
              )}
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500 tabular-nums">
                {t("itemSimulatorWorkspace.optimizationExplore.costsLine", {
                  chaos:
                    rlTrainResponse.summary.costsExaltPerAction.chaosOrb.toFixed(
                      4,
                    ),
                  essence:
                    rlTrainResponse.summary.costsExaltPerAction.essence.toFixed(
                      4,
                    ),
                })}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCalloutCard
                  label={t("rlView.result.meanReward")}
                  value={rlTrainResponse.summary.meanReward.toFixed(4)}
                />
                <StatCalloutCard
                  label={t("rlView.result.last10Reward")}
                  value={rlTrainResponse.summary.last10AverageReward.toFixed(4)}
                />
                <StatCalloutCard
                  label={t("rlView.result.bestInitialAction")}
                  value={actionLabel(rlTrainResponse.summary.bestInitialAction)}
                />
              </div>

              <h4 className="mt-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {t("rlView.result.actionRatio")}
              </h4>
              <div className="mt-2 space-y-3">
                {(
                  [
                    {
                      key: "chaos",
                      value: rlTrainResponse.summary.actionRatio.chaos,
                    },
                    {
                      key: "essence",
                      value: rlTrainResponse.summary.actionRatio.essence,
                    },
                    {
                      key: "stop",
                      value: rlTrainResponse.summary.actionRatio.stop,
                    },
                  ] as const
                ).map((row) => (
                  <ActionMixBarRow
                    key={row.key}
                    label={t(`rlView.actions.${row.key}`)}
                    percentText={toPercent(row.value)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PanelShell>
  );
};
