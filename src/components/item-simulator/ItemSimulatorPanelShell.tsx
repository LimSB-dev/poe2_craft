import type { ReactElement, ReactNode } from "react";

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
      <header className="flex flex-col gap-1">
        <h2 className="font-sc text-base font-semibold text-zinc-950 dark:text-zinc-50">
          {title}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </header>
      {children}
    </section>
  );
};
