"use client";

import type { ReactElement } from "react";

import { DbItemClassWorkspace } from "@/features/db/components/DbItemClassWorkspace";

export type DbItemClassPageContainerPropsType = {
  itemClass: IBaseItemSubTypeType;
  statAffinity?: DbArmourStatAffinityRouteType;
};

export const DbItemClassPageContainer = ({
  itemClass,
  statAffinity,
}: DbItemClassPageContainerPropsType): ReactElement => {
  return (
    <DbItemClassWorkspace
      key={`${itemClass}-${statAffinity ?? "all"}`}
      itemClass={itemClass}
      statAffinity={statAffinity}
    />
  );
};
