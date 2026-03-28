import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";

import { CraftingLabPage as CraftingLabScreen } from "@/components/pages";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("simulator.craftLab");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
};

const CraftingLabPage = async (): Promise<ReactElement> => {
  return <CraftingLabScreen />;
};

export default CraftingLabPage;
