'use client';
/** A button on an approval card that runs a server action (Approve, Reject) and shows an error if it fails. */

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { ButtonVariant } from "@/components/ui/button-styles";
import type { ApprovalResult } from "./actions";

type ActionButtonProps = {
  /** A server action with the image ID already bound, e.g. `approveImage.bind(null, imageId)`. */
  action: () => Promise<ApprovalResult>;
  variant: ButtonVariant;
  label: string;
  /** Shown while the action runs, e.g. "Rejecting…". */
  pendingLabel: string;
};

export function ActionButton({ action, variant, label, pendingLabel }: ActionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) setError(result.error);
      } catch {
        // The call itself failed (e.g. lost connection or the app was redeployed).
        setError("Could not reach the server. Try again.");
      }
    });
  }

  return (
    <>
      <Button variant={variant} onClick={run} disabled={isPending}>
        {isPending ? pendingLabel : label}
      </Button>
      {error && (
        <p role="alert" className="typography-caption text-error">
          {error}
        </p>
      )}
    </>
  );
}
