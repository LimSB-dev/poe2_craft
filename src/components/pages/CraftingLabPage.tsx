import type { ReactElement } from "react";

import { CraftingLabContainer } from "@/containers";
import { SitePageShell } from "@/components/organisms";

export const CraftingLabPage = (): ReactElement => {
  return (
    <SitePageShell>
      <CraftingLabContainer />
    </SitePageShell>
  );
};
