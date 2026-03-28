import type { ReactElement } from "react";

import { ItemWorkbenchContainer } from "@/containers";
import { SitePageShell } from "@/components/organisms";

export const ItemWorkbenchPage = (): ReactElement => {
  return (
    <SitePageShell>
      <ItemWorkbenchContainer />
    </SitePageShell>
  );
};
