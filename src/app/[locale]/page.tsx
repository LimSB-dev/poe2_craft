import { setRequestLocale } from "next-intl/server";
import type { ReactElement } from "react";
import { ItemSimulatorWorkspace } from "@/components/item-simulator/ItemSimulatorWorkspace";

type HomePagePropsType = {
  params: Promise<{ locale: string }>;
};

const HomePage = async ({ params }: HomePagePropsType): Promise<ReactElement> => {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ItemSimulatorWorkspace />;
};

export default HomePage;
