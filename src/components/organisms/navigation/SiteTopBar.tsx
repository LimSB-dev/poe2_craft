"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";

import { LocaleSwitcher } from "./LocaleSwitcher";
import { Link, usePathname } from "@/lib/i18n/navigation";

type SiteTopBarPropsType = {
  /**
   * Visible `<h1>` on the same row as primary nav (DB sub-routes, strategy, RL, optimizer).
   * Home, crafting lab, and DB hub omit this; nav link text matches those page titles and a screen-reader-only h1 is used.
   */
  pageHeading?: string;
};

const navLinkInactiveClass =
  "text-sm font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-400";

const navLinkActiveClass =
  "font-sc text-base font-bold text-zinc-950 underline-offset-2 dark:text-zinc-50 sm:text-lg";

export const SiteTopBar = ({ pageHeading }: SiteTopBarPropsType): ReactElement => {
  const tSim = useTranslations("simulator.itemSimulatorWorkspace");
  const tCraft = useTranslations("simulator.craftLab");
  const tRoot = useTranslations("simulator");
  const pathname = usePathname();

  const isMainActive = pathname === "/";
  const isCraftingLabActive = pathname === "/crafting-lab" || pathname.startsWith("/crafting-lab/");
  const isDbHubExact = pathname === "/db";
  const isDbSectionActive = pathname === "/db" || pathname.startsWith("/db/");

  const mainLabel = tSim("title");
  const craftLabel = tCraft("title");
  const dbLabel = tRoot("dbView.hubTitle");

  const useSrOnlyDocumentH1 =
    pageHeading === undefined &&
    (isMainActive || isCraftingLabActive || isDbHubExact);

  const srOnlyDocumentTitle = isMainActive
    ? mainLabel
    : isCraftingLabActive
      ? craftLabel
      : isDbHubExact
        ? dbLabel
        : "";

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
      {useSrOnlyDocumentH1 && srOnlyDocumentTitle.length > 0 ? (
        <h1 className="sr-only">{srOnlyDocumentTitle}</h1>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
        <nav
          className="flex flex-wrap items-center gap-x-4 gap-y-1"
          aria-label={tSim("topNavAria")}
        >
          <Link
            href="/"
            className={isMainActive ? navLinkActiveClass : navLinkInactiveClass}
            aria-current={isMainActive ? "page" : undefined}
          >
            {mainLabel}
          </Link>
          <Link
            href="/crafting-lab"
            className={isCraftingLabActive ? navLinkActiveClass : navLinkInactiveClass}
            aria-current={isCraftingLabActive ? "page" : undefined}
          >
            {craftLabel}
          </Link>
          <Link
            href="/db"
            className={isDbSectionActive ? navLinkActiveClass : navLinkInactiveClass}
            aria-current={isDbSectionActive ? "page" : undefined}
          >
            {dbLabel}
          </Link>
        </nav>
        {pageHeading !== undefined && pageHeading.length > 0 ? (
          <h1 className="font-sc text-xl font-bold text-zinc-950 dark:text-zinc-50 sm:text-2xl">
            {pageHeading}
          </h1>
        ) : null}
      </div>
      <div className="shrink-0">
        <LocaleSwitcher />
      </div>
    </div>
  );
};
