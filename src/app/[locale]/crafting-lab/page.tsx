import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { CraftingLabWorkspace } from "@/components/crafting-lab/CraftingLabWorkspace";

type CraftingLabPagePropsType = {
  params: Promise<{ locale: string }>;
};

const generateMetadata = async ({
  params,
}: CraftingLabPagePropsType): Promise<Metadata> => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "simulator.craftLab" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
};

const CraftingLabPage = async ({
  params,
}: CraftingLabPagePropsType): Promise<ReactElement> => {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CraftingLabWorkspace />;
};

export { generateMetadata };
export default CraftingLabPage;
