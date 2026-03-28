import type { ReactElement, ReactNode } from "react";

import { PanelHeader } from "@/components/atoms";

type PanelShellPropsType = {
  title: string;
  description: string;
  children: ReactNode;
};

export const PanelShell = ({
  title,
  description,
  children,
}: PanelShellPropsType): ReactElement => {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm">
      <PanelHeader title={title} description={description} />
      {children}
    </section>
  );
};
