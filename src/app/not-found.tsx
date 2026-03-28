import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";

import { SitePageShell, SiteTopBar } from "@/components/organisms";
import { Link } from "@/lib/i18n/navigation";

const NotFound = async (): Promise<ReactElement> => {
  const t = await getTranslations("metadata");

  return (
    <SitePageShell>
      <header>
        <SiteTopBar />
      </header>

      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p
          className="font-sc text-6xl font-bold text-zinc-400 dark:text-zinc-600"
          aria-hidden="true"
        >
          404
        </p>
        <h1 className="font-sc text-2xl font-bold text-zinc-950 dark:text-zinc-50">
          {t("notFound.title")}
        </h1>
        <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          {t("notFound.description")}
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-400"
        >
          {t("notFound.backHome")}
        </Link>
      </div>
    </SitePageShell>
  );
};

export default NotFound;
