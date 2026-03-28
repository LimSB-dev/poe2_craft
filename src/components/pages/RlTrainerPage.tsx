import type { ReactElement } from "react";

import { RlTrainerContainer } from "@/containers";
import { SitePageShell } from "@/components/organisms";

export const RlTrainerPage = (): ReactElement => {
  return (
    <SitePageShell>
      <RlTrainerContainer />
    </SitePageShell>
  );
};
