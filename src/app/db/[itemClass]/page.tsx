import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { DbItemClassWorkspacePage, DbStatAffinityHubPage } from "@/components/pages";
import { parseDbItemClassRouteParam } from "@/lib/poe2db/dbItemClassRoute";
import { subTypeUsesPoe2DbStatAffinityPages } from "@/lib/poe2db/poe2dbStatAffinityPages";

type DbItemClassPagePropsType = {
  params: Promise<{ itemClass: string }>;
};

const DbItemClassPage = async ({ params }: DbItemClassPagePropsType): Promise<ReactElement> => {
  const { itemClass: rawSegment } = await params;
  const itemClass = parseDbItemClassRouteParam(rawSegment);
  if (itemClass === null) {
    notFound();
  }
  if (subTypeUsesPoe2DbStatAffinityPages(itemClass)) {
    return <DbStatAffinityHubPage itemClass={itemClass} />;
  }
  return <DbItemClassWorkspacePage key={`${itemClass}-all`} itemClass={itemClass} />;
};

export default DbItemClassPage;
