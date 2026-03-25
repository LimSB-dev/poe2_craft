"use client";

import type { ReactElement } from "react";

export const Spinner = (): ReactElement => {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-b-transparent"
    />
  );
};

