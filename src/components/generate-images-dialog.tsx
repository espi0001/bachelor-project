'use client';
/**
 * "Generate" button that opens a dialog in three steps: choose image types, generate them, then approve or reject each one.
 */

import Link from "next/link";
import { useRef, useState } from "react";
import { generateImage, type GenerateImageResult } from "@/app/products/[id]/actions";
import { ApprovalCard, type ApprovalChange } from "@/components/approval-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IMAGE_TYPES, IMAGE_TYPE_LABELS, type ImageType } from "@/lib/image-types";

type Status = "choosing" | "generating" | "approving";
type Result = GenerateImageResult & { type: ImageType };

const STEPS: { status: Status; label: string }[] = [
  { status: "choosing", label: "Choose" },
  { status: "generating", label: "Generate" },
  { status: "approving", label: "Approve" },
];

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
  // The types being generated, fixed when Generate is clicked. Results arrive in the same order.
  const [queue, setQueue] = useState<ImageType[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  // E.g. "approx. 2 min. left". Null until the first image is done, since there is nothing to estimate from.
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  // What happened to each generated image in the approve step, by image ID.
  const [changes, setChanges] = useState<Record<string, ApprovalChange>>({});

  const generating = status === "generating";
  const total = selected.length;
  const imagesLabel = `${total} image${total === 1 ? "" : "s"}`;
  const generatedCount = results.filter((r) => r.ok).length;

  function open() {
    // Closing the dialog does not stop generating, so reopening it during a run shows that run's progress.
    // Otherwise start fresh. Images from earlier runs are saved and wait on /approval.
    if (!generating) {
      setStatus("choosing");
      setResults([]);
      setChanges({});
    }
    dialogRef.current?.showModal();
  }

  function close() {
    // Allowed while generating: the loop in generate() keeps running as long as the page stays open.
    dialogRef.current?.close();
  }

  function toggle(type: ImageType, checked: boolean) {
    setSelected((current) => (checked ? [...current, type] : current.filter((t) => t !== type)));
  }

  async function generate() {
    const types = [...selected];
    setQueue(types);
    setStatus("generating");
    setResults([]);
    setChanges({});
    setTimeLeft(null);
    const startedAt = Date.now();
    try {
      // One call per image type, so the progress bar can count real progress.
      for (const [i, type] of types.entries()) {
        let result: GenerateImageResult;
        try {
          result = await generateImage(productUrlId, type);
        } catch {
          // The call itself failed (e.g. lost connection or the app was redeployed). Record it and carry on.
          result = { ok: false, error: "Could not reach the server. Try again." };
        }
        setResults((current) => [...current, { ...result, type }]);
        setTimeLeft(estimateTimeLeft(Date.now() - startedAt, i + 1, types.length));
      }
    } finally {
      // Always move on, so Close and Escape work again. Otherwise the user is stuck in the dialog.
      setStatus("approving");
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {disabledReason && (
          <p id="generate-disabled-reason" className="typography-body-sm text-secondary">
            {disabledReason}
          </p>
        )}
        <Button
          onClick={open}
          disabled={Boolean(disabledReason)}
          aria-describedby={disabledReason ? "generate-disabled-reason" : undefined}
        >
          Generate
        </Button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="generate-dialog-title"
        className="m-auto w-full max-w-4xl rounded-xl bg-surface p-6 text-primary shadow-xl backdrop:bg-black/40 sm:p-8"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="generate-dialog-title" className="typography-heading-page">
            Generate images for {productTitle}
          </h2>
          <Button variant="tertiary" leadingIcon="close" onClick={close}>
            Close
          </Button>
        </div>

        <ol aria-label="Steps" className="mb-6 flex flex-wrap gap-2">
          {STEPS.map((step, i) => {
            const isCurrent = step.status === status;
            return (
              <li
                key={step.status}
                aria-current={isCurrent ? "step" : undefined}
                className={`rounded-full px-3 py-1 typography-label ${
                  isCurrent
                    ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-subtle text-secondary"
                }`}
              >
                {i + 1}&nbsp; {step.label}
              </li>
            );
          })}
        </ol>

        {status === "choosing" && (
          <>
            <fieldset>
              <legend className="mb-2 typography-label">Image types</legend>
              {IMAGE_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 py-1 typography-body">
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
              {total === 0 && (
                <p id="generate-none-selected" className="typography-body-sm text-secondary">
                  Choose at least one image type
                </p>
              )}
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button
                onClick={generate}
                disabled={total === 0}
                aria-describedby={total === 0 ? "generate-none-selected" : undefined}
              >
                Generate {imagesLabel}
              </Button>
            </div>
          </>
        )}

        {generating && (
          <>
            <p className="mb-3 typography-label">
              Generating {queue.length} image{queue.length === 1 ? "" : "s"} …
            </p>
            <div
              role="progressbar"
              aria-label="Generating images"
              aria-valuemin={0}
              aria-valuemax={queue.length}
              aria-valuenow={results.length}
              className="mb-4 h-2 w-full overflow-hidden rounded-full bg-subtle"
            >
              <div
                className="h-full rounded-full bg-brand transition-[width]"
                style={{ width: `${(results.length / queue.length) * 100}%` }}
              />
            </div>

            <ul className="flex flex-col gap-2">
              {queue.map((type, i) => (
                <li key={type} className="flex items-center gap-4 rounded-lg border border-default p-3">
                  <div aria-hidden="true" className="size-14 shrink-0 rounded-md bg-subtle" />
                  <div className="min-w-0 flex-1">
                    <p className="typography-label text-primary">{IMAGE_TYPE_LABELS[type]}</p>
                    {/* Always the product's first image until uploading a source (BA-150) exists. */}
                    <p className="typography-body-sm text-secondary">Source: From Shopify · Product image 1</p>
                  </div>
                  <GenerateStatus result={results[i]} isCurrent={i === results.length} />
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-4">
              {/* Announced as each image finishes; the per-row badges would be too chatty. */}
              <p aria-live="polite" className="mr-auto typography-body-sm text-secondary">
                {results.length} of {queue.length} done{timeLeft && ` · ${timeLeft}`}
              </p>
              <Button variant="secondary" onClick={close}>
                Close
              </Button>
            </div>
          </>
        )}

        {status === "approving" && (
          <>
            <h3 className="typography-label">
              Review {generatedCount} image{generatedCount === 1 ? "" : "s"}
            </h3>
            <p className="mb-4 typography-body-sm text-secondary">
              Nothing is sent to the shop or feeds until you approve.
            </p>

            <ul className="flex flex-col gap-4">
              {results.map((result) => {
                const change = result.ok ? changes[result.imageId] : undefined;
                return (
                  <li key={result.ok ? result.imageId : result.type}>
                    {result.ok ? (
                      <ApprovalCard
                        imageId={result.imageId}
                        uploadFailed={change === "uploadFailed"}
                        outcome={change === "uploadFailed" ? undefined : change}
                        onChange={(next) => setChanges((current) => ({ ...current, [result.imageId]: next }))}
                        typeLabel={IMAGE_TYPE_LABELS[result.type]}
                        headingLevel="h3"
                        productTitle={productTitle}
                        originalUrl={result.sourceImageUrl}
                        generatedUrl={result.imageUrl}
                      />
                    ) : (
                      <div className="rounded-lg border border-default p-6">
                        <h3 className="mb-1 typography-heading-section">{IMAGE_TYPE_LABELS[result.type]}</h3>
                        <p role="alert" className="typography-body-sm text-error">
                          {result.error}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="typography-body-sm text-secondary">
                Images you don&apos;t approve or reject now wait on the{" "}
                <Link href="/approval" className="underline hover:text-primary">
                  Approval page
                </Link>
                .
              </p>
              <Button onClick={close}>Done</Button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}

/** The status at the end of a row in the generate step: done, failed, generating now, or waiting. */
function GenerateStatus({ result, isCurrent }: { result: Result | undefined; isCurrent: boolean }) {
  if (result?.ok) return <Badge variant="success">Done</Badge>;
  if (result) return <Badge variant="error">Failed</Badge>;
  if (isCurrent) return <Badge variant="warning">Generating …</Badge>;
  return <span className="typography-body-sm text-secondary">In queue</span>;
}

/** Guesses the time left from the average time per image so far. Null when nothing is left. */
function estimateTimeLeft(elapsedMs: number, done: number, total: number): string | null {
  const left = total - done;
  if (left === 0) return null;
  const secondsLeft = (elapsedMs / done / 1000) * left;
  return secondsLeft < 60 ? "less than a minute left" : `approx. ${Math.round(secondsLeft / 60)} min. left`;
}
