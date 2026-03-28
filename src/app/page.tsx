import type { ReactElement } from "react";

import { ItemWorkbenchPage } from "@/components/pages";

const HomePage = async (): Promise<ReactElement> => {
  return <ItemWorkbenchPage />;
};

export default HomePage;
