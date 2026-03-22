"use client";

import Image from "next/image";
import type { ReactElement } from "react";

export type CraftingLabOrbSlotButtonPropsType = {
  iconSrc: string | undefined;
  disabled: boolean;
  onUse: () => void;
  /** 티어 오브만 — 로마 숫자 (우하단). 단일 오브는 null. */
  tierRoman: "I" | "II" | "III" | null;
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
 */
export const CraftingLabOrbSlotButton = ({
  iconSrc,
  disabled,
  onUse,
  tierRoman,
  ariaLabel,
  disabledTitle,
  showQuantityBadge,
  quantityLabel,
}: CraftingLabOrbSlotButtonPropsType): ReactElement => {
  const ghosted = disabled;
  return (
    <button
      type="button"
      disabled={disabled}
      title={ghosted ? disabledTitle : ariaLabel}
      aria-label={ariaLabel}
      onClick={() => {
        onUse();
      }}
      className={[
        "relative h-9 w-9 shrink-0 overflow-hidden rounded-sm text-left sm:h-10 sm:w-10",
        "border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500/80",
        ghosted
          ? "cursor-not-allowed border-[#2a231c]/80 bg-black/95 shadow-[inset_0_0_8px_rgba(0,0,0,0.85)]"
          : "cursor-pointer border-[#8b7355]/95 bg-[#121c2a] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] hover:border-amber-500/75 hover:bg-[#182235]",
      ].join(" ")}
    >
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
              ghosted ? "opacity-[0.22] brightness-[0.35] grayscale contrast-75" : "",
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
            ghosted ? "opacity-35" : "",
          ].join(" ")}
          aria-hidden
        >
          {tierRoman}
        </span>
      ) : null}
    </button>
  );
};
