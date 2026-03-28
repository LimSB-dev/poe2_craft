import type { ReactElement } from "react";

import { OptimizerContainer } from "@/containers";
import { SitePageShell } from "@/components/organisms";

export const OptimizerPage = (): ReactElement => {
  return (
    <SitePageShell>
      <OptimizerContainer />
    </SitePageShell>
  );
};
