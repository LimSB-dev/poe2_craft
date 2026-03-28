"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { DesiredModsPanel } from "@/components/organisms/filters";
import { PanelShell } from "@/components/molecules/panels";

type DesiredModsPanelSectionPropsType = {
  subType: IBaseItemSubTypeType | undefined;
  statTags: ReadonlyArray<IBaseItemStatTagType> | undefined;
  desiredMods: ReadonlyArray<IDesiredModEntryType>;
  onAdd: (entry: IDesiredModEntryType) => void;
  onRemove: (id: string) => void;
};

export const DesiredModsPanelSection = ({
  subType,
  statTags,
  desiredMods,
  onAdd,
  onRemove,
}: DesiredModsPanelSectionPropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorWorkspace");

  return (
    <PanelShell
      title={t("panels.desiredMods.title")}
      description={t("panels.desiredMods.description")}
    >
      <DesiredModsPanel
        subType={subType}
        statTags={statTags}
        desiredMods={desiredMods}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    </PanelShell>
  );
};
