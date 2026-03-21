import type { ReactNode } from "react";

type RootLayoutPropsType = {
  children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutPropsType) => {
  return children;
};

export default RootLayout;
