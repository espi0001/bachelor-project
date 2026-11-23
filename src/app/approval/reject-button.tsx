'use client';
/** The Reject button on an approval card: rejects the draft image and shows an error if that fails. */

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { rejectImage } from "./actions";

export function RejectButton({ imageId }: { imageId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reject() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await rejectImage(imageId);
        if (!result.ok) setError(result.error);
      } catch {
        // The call itself failed (e.g. lost connection or the app was redeployed).
        setError("Could not reach the server. Try again.");
      }
    });
  }

  return (
    <>
      <Button variant="secondary" onClick={reject} disabled={isPending}>
        {isPending ? "Rejecting…" : "Reject"}
      </Button>
      {error && (
        <p role="alert" className="typography-caption text-error">
          {error}
        </p>
      )}
    </>
  );
}
