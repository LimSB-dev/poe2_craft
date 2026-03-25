import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { HtmlLangSetter } from "@/components/atoms/i18n/HtmlLangSetter";
import { routing } from "@/lib/i18n/routing";
import { StoreProvider } from "@/store/StoreProvider";

type LocaleLayoutPropsType = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

const generateStaticParams = (): Array<{ locale: string }> => {
  return routing.locales.map((locale) => ({ locale }));
};

const generateMetadata = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
};

const LocaleLayout = async ({ children, params }: LocaleLayoutPropsType) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <>
      <HtmlLangSetter locale={locale} />
      <StoreProvider key={locale} initialLocale={locale} initialMessages={messages}>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </StoreProvider>
    </>
  );
};

export { generateMetadata, generateStaticParams };
export default LocaleLayout;
