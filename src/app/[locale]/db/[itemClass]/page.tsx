import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { DbStatAffinityHub } from "@/components/organisms/views/DbStatAffinityHub";
import { DbItemClassWorkspace } from "@/components/organisms/views/DbItemClassWorkspace";
import { parseDbItemClassRouteParam } from "@/lib/poe2db/dbItemClassRoute";
import { subTypeUsesPoe2DbStatAffinityPages } from "@/lib/poe2db/poe2dbStatAffinityPages";

type DbItemClassPagePropsType = {
  params: Promise<{ locale: string; itemClass: string }>;
};

const DbItemClassPage = async ({ params }: DbItemClassPagePropsType): Promise<ReactElement> => {
  const { locale, itemClass: rawSegment } = await params;
  setRequestLocale(locale);
  const itemClass = parseDbItemClassRouteParam(rawSegment);
  if (itemClass === null) {
    notFound();
  }
  if (subTypeUsesPoe2DbStatAffinityPages(itemClass)) {
    return <DbStatAffinityHub itemClass={itemClass} />;
  }
  return <DbItemClassWorkspace key={`${itemClass}-all`} itemClass={itemClass} />;
};

export default DbItemClassPage;
