import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactElement } from "react";
import { OptimizerContainer } from "@/features/optimizer/containers/OptimizerContainer";

type OptimizerPagePropsType = {
  params: Promise<{ locale: string }>;
};

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "simulator.optimizerView" });
  return {
    title: t("title"),
    description: t("intro"),
  };
};

const OptimizerPage = async ({ params }: OptimizerPagePropsType): Promise<ReactElement> => {
  const { locale } = await params;
  setRequestLocale(locale);
  return <OptimizerContainer />;
};

export default OptimizerPage;
