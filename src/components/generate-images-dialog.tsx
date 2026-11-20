'use client';
/**
 * "Generate" button that opens a dialog where the user picks image types, generates them and sees the results.
 */

import Image from "next/image";
import { useRef, useState } from "react";
import { generateImage, type GenerateImageResult } from "@/app/products/[id]/actions";
import { IMAGE_TYPES, IMAGE_TYPE_LABELS, type ImageType } from "@/lib/image-types";

type Status = "choosing" | "generating" | "done";
type Result = GenerateImageResult & { type: ImageType };

export function GenerateImagesDialog({
  productUrlId,
  productTitle,
  disabledReason,
}: {
  productUrlId: string;
  productTitle: string;
  /** When set, the button is disabled and this text explains why (e.g. no source image yet). */
  disabledReason?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<ImageType[]>(["packshot"]);
  const [status, setStatus] = useState<Status>("choosing");
  const [results, setResults] = useState<Result[]>([]);

  const generating = status === "generating";
  const total = selected.length;
  const imagesLabel = `${total} image${total === 1 ? "" : "s"}`;

  function open() {
    // Start fresh every time the dialog opens. Results are not saved yet.
    setStatus("choosing");
    setResults([]);
    dialogRef.current?.showModal();
  }

  function close() {
    // Closing while generating would lose the images, since they are not saved yet.
    if (generating) return;
    dialogRef.current?.close();
  }

  function toggle(type: ImageType, checked: boolean) {
    setSelected((current) => (checked ? [...current, type] : current.filter((t) => t !== type)));
  }

  async function generate() {
    setStatus("generating");
    setResults([]);
    try {
      // One call per image type, so the progress bar can count real progress.
      for (const type of selected) {
        let result: GenerateImageResult;
        try {
          result = await generateImage(productUrlId, type);
        } catch {
          // The call itself failed (e.g. lost connection or the app was redeployed). Record it and carry on.
          result = { ok: false, error: "Could not reach the server. Try again." };
        }
        setResults((current) => [...current, { ...result, type }]);
      }
    } finally {
      // Always finish, so Close and Escape work again. Otherwise the user is stuck in the dialog.
      setStatus("done");
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {disabledReason && (
          <p id="generate-disabled-reason" className="text-sm text-zinc-500">
            {disabledReason}
          </p>
        )}
        <button
          type="button"
          onClick={open}
          disabled={Boolean(disabledReason)}
          aria-describedby={disabledReason ? "generate-disabled-reason" : undefined}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:hover:bg-white"
        >
          Generate
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="generate-dialog-title"
        // Escape fires "cancel"; block it while generating, like the buttons.
        onCancel={(e) => {
          if (generating) e.preventDefault();
        }}
        className="m-auto w-full max-w-xl rounded-xl bg-background p-8 text-foreground shadow-xl backdrop:bg-black/40"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 id="generate-dialog-title" className="text-xl font-semibold">
            Generate images for {productTitle}
          </h2>
          <button
            type="button"
            onClick={close}
            disabled={generating}
            className="text-sm text-zinc-600 hover:text-foreground disabled:opacity-40 dark:text-zinc-400"
          >
            <span aria-hidden="true">✕</span> Close
          </button>
        </div>

        {status === "choosing" && (
          <>
            <fieldset>
              <legend className="mb-2 font-medium">Image types</legend>
              {IMAGE_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={selected.includes(type)}
                    onChange={(e) => toggle(type, e.currentTarget.checked)}
                    className="h-4 w-4 accent-zinc-900 dark:accent-white"
                  />
                  {IMAGE_TYPE_LABELS[type]}
                </label>
              ))}
            </fieldset>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={close}
                className="rounded-md border border-black/20 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/25 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={total === 0}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Generate {imagesLabel}
              </button>
            </div>
          </>
        )}

        {generating && (
          <div>
            <p className="mb-3 font-medium">Generating images …</p>
            <div
              role="progressbar"
              aria-label="Generating images"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={results.length}
              className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
            >
              <div
                className="h-full rounded-full bg-zinc-700 transition-[width] dark:bg-zinc-300"
                style={{ width: `${(results.length / total) * 100}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-zinc-500">
              {results.length} of {total} done. Please keep this window open; this can take up to a minute.
            </p>
          </div>
        )}

        {status === "done" && (
          <>
            <ul className="grid gap-4 sm:grid-cols-2" aria-live="polite">
              {results.map((result) => (
                <li key={result.type}>
                  <p className="mb-2 text-sm font-medium">{IMAGE_TYPE_LABELS[result.type]}</p>
                  {result.ok ? (
                    // unoptimized: a signed link expires, so the image optimizer should not fetch and cache it.
                    <Image
                      src={result.imageUrl}
                      alt={`${IMAGE_TYPE_LABELS[result.type]} of ${productTitle}`}
                      width={512}
                      height={512}
                      unoptimized
                      className="aspect-square w-full rounded-md border border-black/10 object-contain dark:border-white/15"
                    />
                  ) : (
                    <p role="alert" className="text-sm text-red-600">
                      {result.error}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-zinc-500">The images are not saved yet. They disappear when you close this window.</p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={close}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Close
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
