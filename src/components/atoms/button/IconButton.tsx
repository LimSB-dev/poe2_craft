"use client";

import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

export type IconButtonVariantType = "ghost" | "outline";
export type IconButtonSizeType = "sm" | "md";

type IconButtonPropsType = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children"> & {
  type?: "button" | "submit" | "reset";
  variant?: IconButtonVariantType;
  size?: IconButtonSizeType;
  icon: ReactNode;
  "aria-label": string;
};

const BASE =
  "inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/60 disabled:pointer-events-none disabled:opacity-50";

const SIZE: Record<IconButtonSizeType, string> = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-sm",
};

const VARIANT: Record<IconButtonVariantType, string> = {
  ghost:
    "bg-transparent text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/60",
  outline:
    "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900/60",
};

export const IconButton = ({
  type = "button",
  variant = "ghost",
  size = "md",
  icon,
  className,
  ...rest
}: IconButtonPropsType): ReactElement => {
  const classes = [BASE, SIZE[size], VARIANT[variant], className].filter(Boolean).join(" ");

  return (
    <button type={type} className={classes} {...rest}>
      {icon}
    </button>
  );
};

