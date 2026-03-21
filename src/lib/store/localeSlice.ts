import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AbstractIntlMessages } from "next-intl";
import type { AppLocaleType } from "@/lib/i18n/routing";

type LocaleStateType = {
  locale: AppLocaleType;
  messages: AbstractIntlMessages;
};

const createInitialLocaleState = (
  initialLocale: AppLocaleType,
  initialMessages: AbstractIntlMessages
): LocaleStateType => {
  return {
    locale: initialLocale,
    messages: initialMessages,
  };
};

const localeSlice = createSlice({
  name: "locale",
  initialState: createInitialLocaleState("ko", {}),
  reducers: {
    setLocaleState: (_state, action: PayloadAction<LocaleStateType>) => {
      return action.payload;
    },
  },
});

const localeReducer = localeSlice.reducer;
const { setLocaleState } = localeSlice.actions;

export { createInitialLocaleState, localeReducer, setLocaleState };
export type { LocaleStateType };
