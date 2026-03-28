import type { ReactElement } from "react";

import { SitePageShell } from "@/components/organisms";
import { ItemWorkbenchContainer } from "@/containers";

/**
 * 아이템 시뮬레이터(워크벤치) 루트 뷰.
 * {@link ItemWorkbenchPage}와 동일한 셸·컨테이너 구성.
 */
export const ItemSimulatorWorkspace = (): ReactElement => {
  return (
    <SitePageShell>
      <ItemWorkbenchContainer />
    </SitePageShell>
  );
};

export default ItemSimulatorWorkspace;
