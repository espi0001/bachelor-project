/** A red error box that screen readers announce as soon as it appears. */

import type { ReactNode } from "react";

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md bg-error px-3 py-2 typography-body-sm text-error">
      {children}
    </p>
  );
}
