import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { DbItemClassWorkspacePage } from "@/components/pages";
import { parseDbItemClassRouteParam } from "@/lib/poe2db/dbItemClassRoute";
import {
  parseDbStatAffinityRouteParam,
  subTypeUsesPoe2DbStatAffinityPages,
} from "@/lib/poe2db/poe2dbStatAffinityPages";

type DbItemClassStatPagePropsType = {
  params: Promise<{ itemClass: string; statAffinity: string }>;
};

const DbItemClassStatPage = async ({
  params,
}: DbItemClassStatPagePropsType): Promise<ReactElement> => {
  const { itemClass: rawItemClass, statAffinity: rawStat } = await params;
  const itemClass = parseDbItemClassRouteParam(rawItemClass);
  const statAffinity = parseDbStatAffinityRouteParam(rawStat);
  if (
    itemClass === null ||
    statAffinity === null ||
    !subTypeUsesPoe2DbStatAffinityPages(itemClass)
  ) {
    notFound();
  }
  return (
    <DbItemClassWorkspacePage
      key={`${itemClass}-${statAffinity}`}
      itemClass={itemClass}
      statAffinity={statAffinity}
    />
  );
};

export default DbItemClassStatPage;
