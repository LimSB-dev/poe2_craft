import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";

import { RlTrainerPage } from "@/components/pages";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("simulator.rlView");
  return {
    title: t("title"),
    description: t("title"),
  };
};

const RlPage = async (): Promise<ReactElement> => {
  return <RlTrainerPage />;
};

export default RlPage;
