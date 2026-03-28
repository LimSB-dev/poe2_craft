import type { ReactElement } from "react";

import { StrategyComparisonContainer } from "@/containers";
import { SitePageShell } from "@/components/organisms";

export const StrategyComparisonPage = (): ReactElement => {
  return (
    <SitePageShell>
      <StrategyComparisonContainer />
    </SitePageShell>
  );
};
