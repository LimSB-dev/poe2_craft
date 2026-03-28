import type { ReactElement } from "react";

import {
  DbStatAffinityHubContainer,
  type DbStatAffinityHubContainerPropsType,
} from "@/containers";
import { SitePageShell } from "@/components/organisms";

export const DbStatAffinityHubPage = (
  props: DbStatAffinityHubContainerPropsType,
): ReactElement => {
  return (
    <SitePageShell>
      <DbStatAffinityHubContainer {...props} />
    </SitePageShell>
  );
};
