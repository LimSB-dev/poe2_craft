import "./globals.css";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { HtmlLangSetter } from "@/components/atoms";
import type { AppLocaleType } from "@/lib/i18n/routing";
import { StoreProvider } from "@/store/StoreProvider";

const fontin = localFont({
  src: [
    { path: "./fonts/Fontin-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/Fontin-Italic.otf", weight: "400", style: "italic" },
    { path: "./fonts/Fontin-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-fontin",
  display: "swap",
});

const fontinSmallCaps = localFont({
  src: [
    { path: "./fonts/Fontin-SmallCaps.otf", weight: "400", style: "normal" },
  ],
  variable: "--font-fontin-sc",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
};

type RootLayoutPropsType = {
  children: ReactNode;
};

const RootLayout = async ({ children }: RootLayoutPropsType) => {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      suppressHydrationWarning
      className={`${fontin.className} ${fontin.variable} ${fontinSmallCaps.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <HtmlLangSetter locale={locale} />
        <StoreProvider
          key={locale}
          initialLocale={locale as AppLocaleType}
          initialMessages={messages}
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </StoreProvider>
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
