import type { ReactElement, ReactNode } from "react";

export type ReservedStatusRegionPropsType = {
  /** Reserve vertical space so optional messages do not shift surrounding layout. */
  minHeightClass: string;
  isEmpty: boolean;
  /** Typography classes for the invisible placeholder (match visible message text size). */
  placeholderTextClassName: string;
  children: ReactNode;
  "aria-live"?: "polite" | "assertive" | "off";
  "aria-atomic"?: boolean;
};

/**
 * Renders a fixed-height region for optional status/validation text.
 * When `isEmpty`, keeps the same footprint with an invisible placeholder (no layout shift).
 */
export const ReservedStatusRegion = ({
  minHeightClass,
  isEmpty,
  placeholderTextClassName,
  children,
  "aria-live": ariaLive = "polite",
  "aria-atomic": ariaAtomic = true,
}: ReservedStatusRegionPropsType): ReactElement => {
  return (
    <div
      className={`flex shrink-0 flex-col justify-start ${minHeightClass}`}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
    >
      {isEmpty ? (
        <p className={`${placeholderTextClassName} invisible select-none`} aria-hidden="true">
          &nbsp;
        </p>
      ) : (
        children
      )}
    </div>
  );
};

