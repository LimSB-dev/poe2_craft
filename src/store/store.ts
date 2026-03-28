import { configureStore } from "@reduxjs/toolkit";
import { createInitialLocaleState, localeReducer } from "@/store/localeSlice";
import type { AppLocaleType } from "@/lib/i18n/routing";
import type { AbstractIntlMessages } from "next-intl";

type MakeStoreArgsType = {
  initialLocale: AppLocaleType;
  initialMessages: AbstractIntlMessages;
};

const makeStore = (args: MakeStoreArgsType) => {
  return configureStore({
    reducer: {
      locale: localeReducer,
    },
    preloadedState: {
      locale: createInitialLocaleState(args.initialLocale, args.initialMessages),
    },
  });
};

type AppStoreType = ReturnType<typeof makeStore>;
type RootStateType = ReturnType<AppStoreType["getState"]>;
type AppDispatchType = AppStoreType["dispatch"];

export { makeStore };
export type { AppDispatchType, AppStoreType, RootStateType };

