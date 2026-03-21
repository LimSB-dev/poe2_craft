import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactElement } from "react";
import { StrategyComparisonView } from "@/components/strategy/StrategyComparisonView";

type StrategyPagePropsType = {
  params: Promise<{ locale: string }>;
};

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "simulator.strategyView" });
  return {
    title: t("title"),
    description: t("intro"),
  };
};

const StrategyPage = async ({ params }: StrategyPagePropsType): Promise<ReactElement> => {
  const { locale } = await params;
  setRequestLocale(locale);
  return <StrategyComparisonView />;
};

export default StrategyPage;
