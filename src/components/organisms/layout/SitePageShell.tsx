import type { ReactElement, ReactNode } from "react";

type SitePageShellPropsType = {
  children: ReactNode;
};

/**
 * Shared page chrome: centered column, consistent horizontal padding, background, and vertical rhythm.
 */
export const SitePageShell = ({ children }: SitePageShellPropsType): ReactElement => {
  return (
    <div className="flex min-h-full w-full flex-col items-center bg-zinc-50 px-4 py-8 sm:px-6 sm:py-10 dark:bg-black">
      <main className="flex w-full max-w-7xl flex-col gap-8">{children}</main>
    </div>
  );
};
