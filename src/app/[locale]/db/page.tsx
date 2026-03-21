import { setRequestLocale } from "next-intl/server";
import type { ReactElement } from "react";
import { DbWorkspace } from "@/components/db/DbWorkspace";

type DbPagePropsType = {
  params: Promise<{ locale: string }>;
};

const DbPage = async ({ params }: DbPagePropsType): Promise<ReactElement> => {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DbWorkspace />;
};

export default DbPage;
