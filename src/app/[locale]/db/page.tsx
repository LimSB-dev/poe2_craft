import { setRequestLocale } from "next-intl/server";
import type { ReactElement } from "react";
import { DbContainer } from "@/features/db/containers/DbContainer";

type DbPagePropsType = {
  params: Promise<{ locale: string }>;
};

const DbPage = async ({ params }: DbPagePropsType): Promise<ReactElement> => {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DbContainer />;
};

export default DbPage;
