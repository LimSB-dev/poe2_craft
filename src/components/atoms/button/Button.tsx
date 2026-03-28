"use client";

import type { ButtonHTMLAttributes, ReactElement } from "react";

import { Spinner } from "../feedback";

export type ButtonVariantType = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSizeType = "sm" | "md" | "lg";

type ButtonPropsType = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariantType;
  size?: ButtonSizeType;
  isLoading?: boolean;
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/60 disabled:pointer-events-none disabled:opacity-50";

const SIZE: Record<ButtonSizeType, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

const VARIANT: Record<ButtonVariantType, string> = {
  primary: "bg-amber-600 text-white hover:bg-amber-500 dark:bg-amber-500 dark:text-amber-950",
  secondary:
    "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
  outline:
    "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900/60",
  ghost:
    "bg-transparent text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800/60",
  danger:
    "bg-red-600 text-white hover:bg-red-500 dark:bg-red-500 dark:text-zinc-950 dark:hover:bg-red-400",
};

export const Button = ({
  type = "button",
  variant = "secondary",
  size = "md",
  isLoading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonPropsType): ReactElement => {
  const isDisabled = disabled === true || isLoading;
  const classes = [BASE, SIZE[size], VARIANT[variant], className].filter(Boolean).join(" ");

  return (
    <button type={type} disabled={isDisabled} className={classes} {...rest}>
      {isLoading ? <Spinner /> : null}
      {children}
    </button>
  );
};

