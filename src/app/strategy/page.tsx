import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";

import { StrategyComparisonPage } from "@/components/pages";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("simulator.strategyView");
  return {
    title: t("title"),
    description: t("title"),
  };
};

const StrategyPage = async (): Promise<ReactElement> => {
  return <StrategyComparisonPage />;
};

export default StrategyPage;
