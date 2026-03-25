"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Provider } from "react-redux";

import type { AbstractIntlMessages } from "next-intl";

import type { AppLocaleType } from "@/lib/i18n/routing";
import { makeStore } from "@/store/store";

type StoreProviderPropsType = {
  children: ReactNode;
  initialLocale: AppLocaleType;
  initialMessages: AbstractIntlMessages;
};

const StoreProvider = ({ children, initialLocale, initialMessages }: StoreProviderPropsType) => {
  const [store] = useState(() => makeStore({ initialLocale, initialMessages }));

  return <Provider store={store}>{children}</Provider>;
};

export { StoreProvider };

