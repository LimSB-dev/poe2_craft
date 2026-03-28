import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";

import { OptimizerPage as OptimizerScreen } from "@/components/pages";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("simulator.optimizerView");
  return {
    title: t("title"),
    description: t("title"),
  };
};

const OptimizerPage = async (): Promise<ReactElement> => {
  return <OptimizerScreen />;
};

export default OptimizerPage;
