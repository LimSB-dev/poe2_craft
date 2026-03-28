import type { ReactElement } from "react";

import { DbItemClassHubContainer } from "@/containers";
import { SitePageShell } from "@/components/organisms";

export const DbItemClassHubPage = (): ReactElement => {
  return (
    <SitePageShell>
      <DbItemClassHubContainer />
    </SitePageShell>
  );
};
