import type { ReactElement } from "react";

import {
  DbItemClassContainer,
  type DbItemClassContainerPropsType,
} from "@/containers";
import { SitePageShell } from "@/components/organisms";

export const DbItemClassWorkspacePage = (
  props: DbItemClassContainerPropsType,
): ReactElement => {
  return (
    <SitePageShell>
      <DbItemClassContainer {...props} />
    </SitePageShell>
  );
};
