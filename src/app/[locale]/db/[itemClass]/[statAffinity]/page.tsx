import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { DbItemClassWorkspace } from "@/components/organisms/views/DbItemClassWorkspace";
import { parseDbItemClassRouteParam } from "@/lib/poe2db/dbItemClassRoute";
import {
  parseDbStatAffinityRouteParam,
  subTypeUsesPoe2DbStatAffinityPages,
} from "@/lib/poe2db/poe2dbStatAffinityPages";

type DbItemClassStatPagePropsType = {
  params: Promise<{ locale: string; itemClass: string; statAffinity: string }>;
};

const DbItemClassStatPage = async ({
  params,
}: DbItemClassStatPagePropsType): Promise<ReactElement> => {
  const { locale, itemClass: rawItemClass, statAffinity: rawStat } = await params;
  setRequestLocale(locale);
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
    <DbItemClassWorkspace
      key={`${itemClass}-${statAffinity}`}
      itemClass={itemClass}
      statAffinity={statAffinity}
    />
  );
};

export default DbItemClassStatPage;
