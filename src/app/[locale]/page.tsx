import { setRequestLocale } from "next-intl/server";
import type { ReactElement } from "react";
import { ItemSimulatorContainer } from "@/features/crafting/containers/ItemSimulatorContainer";

type HomePagePropsType = {
  params: Promise<{ locale: string }>;
};

const HomePage = async ({ params }: HomePagePropsType): Promise<ReactElement> => {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ItemSimulatorContainer />;
};

export default HomePage;
