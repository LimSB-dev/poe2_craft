"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { DesiredModsPanel } from "@/components/organisms/DesiredModsPanel";
import { ItemSimulatorPanelShell } from "@/components/organisms/ItemSimulatorPanelShell";
import type {
  IBaseItemStatTagType,
  IBaseItemSubTypeType,
} from "@/lib/poe2-item-simulator/baseItemDb";
import type { IDesiredModEntryType } from "@/types/poe2-item-simulator";

type ItemSimulatorDesiredModsPanelSectionPropsType = {
  subType: IBaseItemSubTypeType | undefined;
  statTags: ReadonlyArray<IBaseItemStatTagType> | undefined;
  desiredMods: ReadonlyArray<IDesiredModEntryType>;
  onAdd: (entry: IDesiredModEntryType) => void;
  onRemove: (id: string) => void;
};

export const ItemSimulatorDesiredModsPanelSection = ({
  subType,
  statTags,
  desiredMods,
  onAdd,
  onRemove,
}: ItemSimulatorDesiredModsPanelSectionPropsType): ReactElement => {
  const t = useTranslations("simulator.itemSimulatorWorkspace");

  return (
    <ItemSimulatorPanelShell
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
    </ItemSimulatorPanelShell>
  );
};
