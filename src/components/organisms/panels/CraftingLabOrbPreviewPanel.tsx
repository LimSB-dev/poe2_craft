"use client";

import { useFormatter, useTranslations } from "next-intl";
import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { ModTemplateText } from "@/components/atoms/catalog";
import {
  buildCraftLabPreviewFamilyGroups,
  type CraftLabPreviewFamilyGroupType,
} from "@/lib/crafting-lab/craftLabPreviewFamilies";
import {
  craftLabPreviewTagChipClassName,
  getCraftLabPreviewTagLabelsForModKey,
} from "@/lib/crafting-lab/craftLabPreviewModTags";
import type {
  CraftLabOrbPreviewResultType,
  CraftLabPreviewRowType,
  CraftLabPreviewSectionType,
} from "@/lib/crafting-lab/craftLabOrbPreview";

type CraftingLabOrbPreviewPanelPropsType = {
  orbLabel: string;
  preview: CraftLabOrbPreviewResultType;
  onClose: () => void;
};

const PREFIX_HEADING_KEYS = new Set<string>([
  "previewSectionPrefix50",
  "previewAlchemyPrefixPool",
]);

const SUFFIX_HEADING_KEYS = new Set<string>([
  "previewSectionSuffix50",
  "previewAlchemySuffixPool",
]);

type PreviewTabIdType = "prefix" | "suffix" | "other";

const splitPreviewSections = (
  sections: readonly CraftLabPreviewSectionType[],
): {
  prefixSections: CraftLabPreviewSectionType[];
  suffixSections: CraftLabPreviewSectionType[];
  otherSections: CraftLabPreviewSectionType[];
  showAffixTabs: boolean;
} => {
  const prefixSections: CraftLabPreviewSectionType[] = [];
  const suffixSections: CraftLabPreviewSectionType[] = [];
  const otherSections: CraftLabPreviewSectionType[] = [];
  for (const s of sections) {
    if (PREFIX_HEADING_KEYS.has(s.headingKey)) {
      prefixSections.push(s);
    } else if (SUFFIX_HEADING_KEYS.has(s.headingKey)) {
      suffixSections.push(s);
    } else {
      otherSections.push(s);
    }
  }
  const showAffixTabs = prefixSections.length > 0 || suffixSections.length > 0;
  return { prefixSections, suffixSections, otherSections, showAffixTabs };
};

const PreviewSectionList = ({
  sections,
}: {
  sections: readonly CraftLabPreviewSectionType[];
}): ReactElement => {
  const t = useTranslations("simulator.craftLab");
  return (
    <>
      {sections.map((section) => {
        return (
          <div key={section.headingKey} className="mb-3 last:mb-0">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {t(section.headingKey)}
            </p>
            {section.rows.length === 0 ? (
              <p className="text-xs text-zinc-500">{t("previewEmptySection")}</p>
            ) : (
              <CraftLabPreviewSectionTable section={section} />
            )}
          </div>
        );
      })}
    </>
  );
};

export type CraftingLabOrbPreviewModalPropsType = {
  children: ReactNode;
  onClose: () => void;
};

/**
 * 시뮬레이션 오브·에센스 등 확률 미리보기를 창고 아래가 아닌 오버레이로 표시.
 */
export const CraftingLabOrbPreviewModal = ({
  children,
  onClose,
}: CraftingLabOrbPreviewModalPropsType): ReactElement | null => {
  const t = useTranslations("simulator.craftLab");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label={t("previewModalBackdropClose")}
        onClick={() => {
          onClose();
        }}
      />
      <div
        className="relative z-[101] flex max-h-[min(92vh,880px)] min-h-0 w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-amber-900/45 bg-zinc-950 shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={t("previewModalAriaLabel")}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

type CraftLabPreviewSectionTablePropsType = {
  section: CraftLabPreviewSectionType;
};

/** 패밀리 헤더·티어 행: 속성 | T | 풀 비중 | 최종 확률 | 가중 */
const PREVIEW_FAMILY_GRID_COLS =
  "grid w-full grid-cols-[minmax(0,1fr)_2.5rem_3.25rem_3.75rem_3.25rem] items-start gap-x-0";

const CraftPreviewTagChips = ({
  labels,
  className = "",
}: {
  labels: readonly string[];
  /** 상위에서 줄 간격을 맞출 때 `mt-0` 등 */
  className?: string;
}): ReactElement | null => {
  if (labels.length === 0) {
    return null;
  }
  return (
    <div className={`flex flex-wrap gap-1 ${className}`.trim()}>
      {labels.map((tag) => {
        return (
          <span
            key={tag}
            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none ${craftLabPreviewTagChipClassName(tag)}`}
          >
            {tag}
          </span>
        );
      })}
    </div>
  );
};

const PreviewTierRow = ({ row }: { row: CraftLabPreviewRowType }): ReactElement => {
  const format = useFormatter();
  const t = useTranslations("simulator.craftLab");
  const poolFraction = row.poolFraction;
  return (
    <div
      className={`${PREVIEW_FAMILY_GRID_COLS} border-t border-zinc-800/70 first:border-t-0`}
    >
      <div className="min-w-0 py-1.5 pl-9 pr-1 align-top">
        <ModTemplateText
          nameTemplateKey={row.nameTemplateKey}
          statRanges={row.statRanges}
        />
      </div>
      <div
        className="px-1 py-1.5 text-center tabular-nums text-zinc-400"
        title={t("previewTierColTitle")}
      >
        {row.tier}
      </div>
      <div
        className="px-1 py-1.5 text-right tabular-nums text-zinc-300/95"
        title={t("previewPoolColTitle")}
      >
        {poolFraction !== undefined
          ? format.number(poolFraction, {
              style: "percent",
              maximumFractionDigits: 2,
            })
          : "—"}
      </div>
      <div className="px-1 py-1.5 text-right tabular-nums text-amber-200/95" title={t("previewProbColTitle")}>
        {format.number(row.probability, {
          style: "percent",
          maximumFractionDigits: 2,
        })}
      </div>
      <div
        className="px-1 py-1.5 text-right tabular-nums text-zinc-500"
        title={t("previewWeightColTitle")}
      >
        {row.weight > 0 ? row.weight : "—"}
      </div>
    </div>
  );
};

const CraftLabPreviewSectionTable = ({ section }: CraftLabPreviewSectionTablePropsType): ReactElement => {
  const t = useTranslations("simulator.craftLab");
  const format = useFormatter();

  const familyGroups = useMemo(() => {
    return buildCraftLabPreviewFamilyGroups(section.rows, "family");
  }, [section.rows]);

  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(new Set());

  const familyDomId = (group: CraftLabPreviewFamilyGroupType): string => {
    return `craft-preview-${section.headingKey}-${group.nameTemplateKey}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  };

  const toggleFamily = (group: CraftLabPreviewFamilyGroupType): void => {
    const key = `${section.headingKey}::${group.nameTemplateKey}`;
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isExpanded = (group: CraftLabPreviewFamilyGroupType): boolean => {
    return expandedIds.has(`${section.headingKey}::${group.nameTemplateKey}`);
  };

  return (
    <div className="rounded-lg border border-zinc-800/90 bg-zinc-950/30">
      <div className="space-y-2 p-2">
        {familyGroups.map((group) => {
          const expanded = isExpanded(group);
          const panelId = `${familyDomId(group)}-tiers`;
          const tagLabels = getCraftLabPreviewTagLabelsForModKey(group.representativeModKey);

          return (
            <div
              key={`${section.headingKey}-${group.nameTemplateKey}`}
              className="overflow-hidden rounded-lg border border-zinc-800/70 bg-gradient-to-b from-zinc-900/50 to-zinc-950/80 shadow-sm shadow-black/20"
            >
              <button
                type="button"
                id={`${familyDomId(group)}-btn`}
                className="flex w-full flex-col gap-0 border-b border-transparent px-2 py-2 text-left transition hover:bg-zinc-800/50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-600/80"
                aria-expanded={expanded}
                aria-controls={panelId}
                aria-label={expanded ? t("previewFamilyCollapseAria") : t("previewFamilyExpandAria")}
                onClick={() => {
                  toggleFamily(group);
                }}
              >
                <div className={`${PREVIEW_FAMILY_GRID_COLS} min-w-0`}>
                  <div className="flex min-w-0 items-start gap-2 px-2 py-0.5">
                    <span
                      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-zinc-700/80 bg-zinc-900/80 text-zinc-400"
                      aria-hidden
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={`transition-transform ${expanded ? "rotate-90" : ""}`}
                      >
                        <path
                          d="M4.5 2.5L8 6L4.5 9.5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1 font-medium leading-snug text-zinc-100">
                      <ModTemplateText nameTemplateKey={group.nameTemplateKey} />
                    </div>
                  </div>
                  <div
                    className="px-1 py-0.5 text-center text-[11px] tabular-nums text-zinc-500"
                    title={t("previewFamilyTierCount", { count: group.tierCount })}
                  >
                    {group.tierCount}
                  </div>
                  <div
                    className="px-1 py-0.5 text-right text-xs tabular-nums text-zinc-300/95"
                    title={t("previewPoolColTitle")}
                  >
                    {group.totalPoolFraction > 0
                      ? format.number(group.totalPoolFraction, {
                          style: "percent",
                          maximumFractionDigits: 2,
                        })
                      : "—"}
                  </div>
                  <div
                    className="px-1 py-0.5 text-right text-xs font-medium tabular-nums text-amber-200/95"
                    title={t("previewProbColTitle")}
                  >
                    {format.number(group.totalProbability, {
                      style: "percent",
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div
                    className="px-1 py-0.5 text-right text-xs tabular-nums text-zinc-500"
                    title={t("previewWeightColTitle")}
                  >
                    {group.totalWeightSum > 0 ? group.totalWeightSum : "—"}
                  </div>
                </div>
                <div className="w-full pl-9">
                  <CraftPreviewTagChips labels={tagLabels} className="mt-1.5" />
                </div>
              </button>

              {expanded ? (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={`${familyDomId(group)}-btn`}
                  className="border-t border-zinc-800/80 bg-zinc-950/60 px-2 text-xs text-zinc-200"
                >
                  <p className="sr-only">{t("previewTierDetailTableCaption")}</p>
                  {group.rows.map((row, rowIndex) => {
                    return (
                      <PreviewTierRow
                        key={`${group.nameTemplateKey}-tier-${String(rowIndex)}-${row.modKey}-t${String(row.tier)}`}
                        row={row}
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CraftingLabOrbPreviewPanel = ({
  orbLabel,
  preview,
  onClose,
}: CraftingLabOrbPreviewPanelPropsType): ReactElement => {
  const t = useTranslations("simulator.craftLab");
  const titleId = useId();
  const [activeTab, setActiveTab] = useState<PreviewTabIdType>("prefix");

  const sectionSplit = useMemo(() => {
    if (preview.status !== "ok") {
      return null;
    }
    return splitPreviewSections(preview.sections);
  }, [preview]);

  useEffect(() => {
    if (sectionSplit === null) {
      return;
    }
    const { prefixSections, suffixSections, showAffixTabs } = sectionSplit;
    if (!showAffixTabs) {
      setActiveTab("other");
      return;
    }
    if (prefixSections.length > 0) {
      setActiveTab("prefix");
    } else if (suffixSections.length > 0) {
      setActiveTab("suffix");
    } else {
      setActiveTab("other");
    }
  }, [sectionSplit]);

  const tabPanelSections = useMemo(() => {
    if (sectionSplit === null || preview.status !== "ok") {
      return [];
    }
    const { prefixSections, suffixSections, otherSections, showAffixTabs } = sectionSplit;
    if (!showAffixTabs) {
      return preview.sections;
    }
    if (activeTab === "prefix") {
      return prefixSections;
    }
    if (activeTab === "suffix") {
      return suffixSections;
    }
    return otherSections;
  }, [sectionSplit, activeTab, preview]);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-950/90 p-3 text-sm shadow-lg"
      role="region"
      aria-labelledby={titleId}
    >
      <div className="mb-2 flex shrink-0 flex-wrap items-start justify-between gap-2">
        <h4 id={titleId} className="font-sc pr-2 text-sm font-semibold text-amber-100">
          {preview.status === "unavailable"
            ? t("previewUnavailable")
            : t("previewTitle", { orb: orbLabel })}
        </h4>
        <button
          type="button"
          onClick={() => {
            onClose();
          }}
          className="shrink-0 rounded border border-zinc-600 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          {t("previewClose")}
        </button>
      </div>

      {preview.status === "unavailable" ? (
        <p className="text-xs text-zinc-500">{t("previewUnavailableDetail")}</p>
      ) : (
        <>
          {preview.noteKeys !== undefined
            ? preview.noteKeys.map((key) => {
                return (
                  <p key={key} className="mb-2 shrink-0 text-xs leading-snug text-zinc-400">
                    {t(key)}
                  </p>
                );
              })
            : null}
          {sectionSplit !== null && sectionSplit.showAffixTabs ? (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <div
                className="flex shrink-0 gap-1 border-b border-zinc-800 pb-0"
                role="tablist"
                aria-label={t("previewAffixTablistAria")}
              >
                <button
                  type="button"
                  role="tab"
                  id={`${titleId}-tab-prefix`}
                  aria-selected={activeTab === "prefix"}
                  aria-controls={`${titleId}-tabpanel`}
                  className={[
                    "rounded-t-md px-3 py-1.5 text-xs font-semibold transition",
                    activeTab === "prefix"
                      ? "bg-zinc-800 text-amber-100"
                      : "text-zinc-500 hover:bg-zinc-900/80 hover:text-zinc-300",
                  ].join(" ")}
                  onClick={() => {
                    setActiveTab("prefix");
                  }}
                >
                  {t("previewTabPrefix")}
                </button>
                <button
                  type="button"
                  role="tab"
                  id={`${titleId}-tab-suffix`}
                  aria-selected={activeTab === "suffix"}
                  aria-controls={`${titleId}-tabpanel`}
                  className={[
                    "rounded-t-md px-3 py-1.5 text-xs font-semibold transition",
                    activeTab === "suffix"
                      ? "bg-zinc-800 text-amber-100"
                      : "text-zinc-500 hover:bg-zinc-900/80 hover:text-zinc-300",
                  ].join(" ")}
                  onClick={() => {
                    setActiveTab("suffix");
                  }}
                >
                  {t("previewTabSuffix")}
                </button>
                {sectionSplit.otherSections.length > 0 ? (
                  <button
                    type="button"
                    role="tab"
                    id={`${titleId}-tab-other`}
                    aria-selected={activeTab === "other"}
                    aria-controls={`${titleId}-tabpanel`}
                    className={[
                      "rounded-t-md px-3 py-1.5 text-xs font-semibold transition",
                      activeTab === "other"
                        ? "bg-zinc-800 text-amber-100"
                        : "text-zinc-500 hover:bg-zinc-900/80 hover:text-zinc-300",
                    ].join(" ")}
                    onClick={() => {
                      setActiveTab("other");
                    }}
                  >
                    {t("previewTabOther")}
                  </button>
                ) : null}
              </div>
              <div
                id={`${titleId}-tabpanel`}
                role="tabpanel"
                aria-labelledby={
                  activeTab === "prefix"
                    ? `${titleId}-tab-prefix`
                    : activeTab === "suffix"
                      ? `${titleId}-tab-suffix`
                      : `${titleId}-tab-other`
                }
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5"
              >
                <PreviewSectionList sections={tabPanelSections} />
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5">
              <PreviewSectionList sections={preview.sections} />
            </div>
          )}
        </>
      )}
    </div>
  );
};
