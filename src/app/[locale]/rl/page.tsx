import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactElement } from "react";
import { RlTrainerView } from "@/components/rl/RlTrainerView";

type RlPagePropsType = {
  params: Promise<{ locale: string }>;
};

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "simulator.rlView" });
  return {
    title: t("title"),
    description: t("intro"),
  };
};

const RlPage = async ({ params }: RlPagePropsType): Promise<ReactElement> => {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RlTrainerView />;
};

export default RlPage;
