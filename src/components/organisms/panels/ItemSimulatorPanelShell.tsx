import type { ReactElement, ReactNode } from "react";

import { ItemSimulatorPanelHeader } from "@/components/atoms/typography/ItemSimulatorPanelHeader";

type ItemSimulatorPanelShellPropsType = {
  title: string;
  description: string;
  children: ReactNode;
};

export const ItemSimulatorPanelShell = ({
  title,
  description,
  children,
}: ItemSimulatorPanelShellPropsType): ReactElement => {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm">
      <ItemSimulatorPanelHeader title={title} description={description} />
      {children}
    </section>
  );
};
