'use client';
/** "Disconnect store" button that asks for confirmation in a dialog before it deletes the store. */

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { disconnectStore, type DisconnectStoreState } from "./actions";

export function DisconnectStoreButton({ shopDomain }: { shopDomain: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, isPending] = useActionState<DisconnectStoreState>(disconnectStore, {});

  return (
    <>
      <Button variant="secondary" onClick={() => dialogRef.current?.showModal()}>
        Disconnect store
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="disconnect-dialog-title"
        aria-describedby="disconnect-dialog-description"
        // Escape fires "cancel"; block it while deleting, like the Cancel button.
        onCancel={(e) => {
          if (isPending) e.preventDefault();
        }}
        className="m-auto w-full max-w-md rounded-lg bg-surface p-6 text-primary shadow-modal backdrop:bg-black/40 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <h2 id="disconnect-dialog-title" className="typography-heading-section">
          Disconnect {shopDomain}?
        </h2>
        <p id="disconnect-dialog-description" className="mt-2 typography-body-sm text-secondary dark:text-zinc-400">
          The store and its generated images are removed from Instant Image. Nothing is changed in Shopify. You can
          connect the store again later.
        </p>

        {state.error ? (
          <p role="alert" className="mt-4 rounded-md bg-error px-3 py-2 typography-body-sm text-error">
            {state.error}
          </p>
        ) : null}

        <form action={formAction} className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => dialogRef.current?.close()} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Disconnecting…" : "Disconnect"}
          </Button>
        </form>
      </dialog>
    </>
  );
}
