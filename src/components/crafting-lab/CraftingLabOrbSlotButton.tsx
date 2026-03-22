"use client";

import Image from "next/image";
import type { ReactElement } from "react";

export type CraftingLabOrbSlotButtonPropsType = {
  iconSrc: string | undefined;
  disabled: boolean;
  onUse: () => void;
  /** 호버(포인터 진입/이탈) — 히네코라 예견 미리보기 등 */
  onHoverChange?: (hovered: boolean) => void;
  /** 티어 오브만 — 로마 숫자 (우하단). 단일 오브는 null. */
  tierRoman: "I" | "II" | "III" | null;
  /** 분열 오브 등 비활성 시 더 뚜렷한 dim (선택). */
  strongDisabled?: boolean;
  /** 접근성·스크린리더용 전체 이름 */
  ariaLabel: string;
  /** 비활성 시 툴팁 */
  disabledTitle?: string;
  /** 활성 슬롯에만 좌상단 수량(시뮬 무제한 등) */
  showQuantityBadge: boolean;
  quantityLabel: string;
};

/**
 * 게임 창고 슬롯과 유사: 3열 그리드 셀, 티어 로마 숫자, 비활성 시 어둡게·아이콘 고스트.
 * 툴팁은 네이티브 `title` 대신 즉시 뜨는 레이어(브라우저 기본 지연 없음).
 */
export const CraftingLabOrbSlotButton = ({
  iconSrc,
  disabled,
  onUse,
  onHoverChange,
  tierRoman,
  ariaLabel,
  disabledTitle,
  showQuantityBadge,
  quantityLabel,
  strongDisabled = false,
}: CraftingLabOrbSlotButtonPropsType): ReactElement => {
  const ghosted = disabled;
  const dimStrong = ghosted && strongDisabled;
  const tipText = ghosted ? (disabledTitle ?? ariaLabel) : ariaLabel;

  const shellClass = [
    "relative block h-full w-full min-h-0 min-w-0 overflow-hidden rounded-sm border p-0 transition-colors",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500/80",
    ghosted
      ? dimStrong
        ? "cursor-not-allowed border-zinc-600/65 bg-zinc-900/90 opacity-90 shadow-[inset_0_0_10px_rgba(0,0,0,0.82)] saturate-0"
        : "cursor-not-allowed border-[#3a3228]/85 bg-[#181410]/95 shadow-[inset_0_0_6px_rgba(0,0,0,0.65)]"
      : "cursor-pointer border-[#8b7355]/95 bg-[#121c2a] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] hover:border-amber-500/75 hover:bg-[#182235]",
  ].join(" ");

  const inner = (
    <>
      {showQuantityBadge && !ghosted ? (
        <span
          className="absolute left-0.5 top-0.5 z-20 text-[8px] font-bold tabular-nums leading-none text-zinc-100 drop-shadow-[0_1px_1px_rgba(0,0,0,1)] sm:text-[9px]"
          aria-hidden
        >
          {quantityLabel}
        </span>
      ) : null}

      <span className="absolute inset-0 flex items-center justify-center p-0.5">
        {iconSrc !== undefined ? (
          <Image
            src={iconSrc}
            alt=""
            width={28}
            height={28}
            className={[
              "h-auto w-auto max-h-[78%] max-w-[78%] object-contain sm:max-h-[80%] sm:max-w-[80%]",
              ghosted
                ? dimStrong
                  ? "opacity-[0.2] brightness-[0.4] grayscale contrast-75"
                  : "opacity-[0.38] brightness-[0.55] grayscale contrast-75"
                : "",
            ].join(" ")}
            sizes="32px"
            aria-hidden
          />
        ) : null}
      </span>

      {tierRoman !== null ? (
        <span
          className={[
            "absolute bottom-0.5 right-0.5 z-20 rounded px-0.5 py-px font-serif text-[7px] font-semibold leading-none tabular-nums sm:text-[8px]",
            "bg-black/60 text-zinc-100 shadow-sm",
            ghosted ? "opacity-55" : "",
          ].join(" ")}
          aria-hidden
        >
          {tierRoman}
        </span>
      ) : null}
    </>
  );

  return (
    <span
      className={[
        "group/orb relative inline-flex h-9 w-9 shrink-0 overflow-visible sm:h-10 sm:w-10",
        ghosted ? "cursor-not-allowed" : "",
      ].join(" ")}
      onMouseEnter={() => {
        onHoverChange?.(true);
      }}
      onMouseLeave={() => {
        onHoverChange?.(false);
      }}
    >
      <span
        role="tooltip"
        className={[
          "pointer-events-none absolute bottom-full left-1/2 z-[100] mb-1.5 w-max max-w-[min(16rem,calc(100vw-1.5rem))] -translate-x-1/2",
          "rounded-md border border-zinc-600/90 bg-zinc-950 px-2 py-1 text-left text-[10px] font-medium leading-snug text-zinc-100 shadow-lg",
          "whitespace-normal break-words",
          "opacity-0 transition-none",
          "group-hover/orb:opacity-100 group-focus-within/orb:opacity-100",
        ].join(" ")}
      >
        {tipText}
      </span>
      <button
        type="button"
        disabled={ghosted}
        aria-label={ariaLabel}
        onClick={() => {
          onUse();
        }}
        className={shellClass}
      >
        {inner}
      </button>
    </span>
  );
};
