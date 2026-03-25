import { setRequestLocale } from "next-intl/server";
import type { ReactElement } from "react";
import { DbItemClassHub } from "@/components/organisms/views/DbItemClassHub";

type DbPagePropsType = {
  params: Promise<{ locale: string }>;
};

const DbPage = async ({ params }: DbPagePropsType): Promise<ReactElement> => {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DbItemClassHub />;
};

export default DbPage;
