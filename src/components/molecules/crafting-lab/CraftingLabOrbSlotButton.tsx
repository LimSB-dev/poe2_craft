"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";

export type CraftingLabOrbSlotButtonPropsType = {
  iconSrc: string | undefined;
  /** false면 비활성 표시. 네이티브 disabled는 쓰지 않아 클릭으로 안내 가능 */
  applicable: boolean;
  onUse: () => void;
  /** applicable이 false일 때 클릭 시 (창고 하단 검증 영역 등) */
  onBlockedClick?: () => void;
  /** 툴팁·스크린리더용 재료 이름(항상 표시) */
  currencyName: string;
  /** 호버 툴팁: 이름 아래 (`simulator.craftLab.currencyHoverHint.*`, `\n`으로 줄바꿈) */
  hoverHint?: string;
  /** 비활성 사유 — 툴팁 아래, 클릭 시 onBlockedClick과 함께 쓰면 됨 */
  disabledReason?: string;
  onHoverChange?: (hovered: boolean) => void;
  tierRoman: "I" | "II" | "III" | null;
  strongDisabled?: boolean;
  /** 접근성·스크린리더용 전체 이름 */
  ariaLabel: string;
  showQuantityBadge: boolean;
  quantityLabel: string;
  /** 징조 등 토글 선택 시 슬롯 안쪽에 링(바깥 ring-offset 없음) */
  isSelected?: boolean;
};

/**
 * 게임 창고 슬롯과 유사: 3열 그리드 셀, 티어 로마 숫자, 비활성 시 어둡게·아이콘 고스트.
 * 툴팁은 `document.body`로 포털해 스크롤 영역에 잘리지 않게 함.
 */
export const CraftingLabOrbSlotButton = ({
  iconSrc,
  applicable,
  onUse,
  onBlockedClick,
  currencyName,
  hoverHint,
  disabledReason,
  onHoverChange,
  tierRoman,
  ariaLabel,
  showQuantityBadge,
  quantityLabel,
  isSelected = false,
  strongDisabled = false,
}: CraftingLabOrbSlotButtonPropsType): ReactElement => {
  const ghosted = !applicable;
  const dimStrong = ghosted && strongDisabled;
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [tipOpen, setTipOpen] = useState(false);
  const [tipPos, setTipPos] = useState<{
    left: number;
    top: number;
    placeAbove: boolean;
  } | null>(null);

  const updateTipPosition = useCallback(() => {
    const el = anchorRef.current;
    if (el === null) {
      return;
    }
    const r = el.getBoundingClientRect();
    const margin = 8;
    const preferAbove = r.top > 80;
    setTipPos({
      left: r.left + r.width / 2,
      top: preferAbove ? r.top - margin : r.bottom + margin,
      placeAbove: preferAbove,
    });
  }, []);

  useEffect(() => {
    if (!tipOpen) {
      return;
    }
    updateTipPosition();
    const handler = (): void => {
      updateTipPosition();
    };
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [tipOpen, updateTipPosition]);

  const shellClass = [
    "relative block h-full w-full min-h-0 min-w-0 overflow-hidden rounded-sm border p-0 transition-colors",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500/80",
    isSelected
      ? "z-10 ring-2 ring-inset ring-amber-500/90"
      : "",
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

  const portalTooltip =
    typeof document !== "undefined" &&
    tipOpen &&
    tipPos !== null &&
    createPortal(
      <div
        role="tooltip"
        className={[
          "pointer-events-none fixed z-[9999] w-max max-w-[min(18rem,calc(100vw-1rem))]",
          "rounded-md border border-zinc-600/90 bg-zinc-950 px-2 py-1.5 text-left text-[10px] font-medium leading-snug text-zinc-100 shadow-lg",
          "whitespace-normal break-words",
        ].join(" ")}
        style={{
          left: tipPos.left,
          top: tipPos.top,
          transform: tipPos.placeAbove
            ? "translate(-50%, -100%)"
            : "translate(-50%, 0)",
        }}
      >
        <span className="text-zinc-50">{currencyName}</span>
        {hoverHint !== undefined && hoverHint.length > 0 ? (
          <span className="mt-1 block whitespace-pre-line text-[9px] font-normal leading-snug text-zinc-400">
            {hoverHint}
          </span>
        ) : null}
        {ghosted && disabledReason !== undefined && disabledReason.length > 0 ? (
          <span className="mt-1 block whitespace-pre-line text-[10px] font-normal leading-snug text-zinc-400">
            {disabledReason}
          </span>
        ) : null}
      </div>,
      document.body,
    );

  return (
    <span
      ref={anchorRef}
      className={[
        "group/orb relative inline-flex h-9 w-9 shrink-0 overflow-visible sm:h-10 sm:w-10",
        ghosted ? "cursor-not-allowed" : "",
      ].join(" ")}
      onMouseEnter={() => {
        setTipOpen(true);
        updateTipPosition();
        onHoverChange?.(true);
      }}
      onMouseLeave={() => {
        setTipOpen(false);
        setTipPos(null);
        onHoverChange?.(false);
      }}
    >
      {portalTooltip}
      <button
        type="button"
        aria-label={ariaLabel}
        aria-disabled={ghosted}
        tabIndex={0}
        onClick={() => {
          if (ghosted) {
            onBlockedClick?.();
            return;
          }
          onUse();
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") {
            return;
          }
          e.preventDefault();
          if (ghosted) {
            onBlockedClick?.();
            return;
          }
          onUse();
        }}
        className={shellClass}
      >
        {inner}
      </button>
    </span>
  );
};
