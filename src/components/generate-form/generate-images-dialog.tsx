'use client';
/**
 * "Generate" button that opens a dialog in three steps: choose image types and their source images, generate them,
 * then approve or reject each one.
 */

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { generateImage, type GenerateImageResult } from "@/app/products/[id]/actions";
import { ApprovalCard, type ApprovalChange } from "@/components/approval-card";
import { DialogStep } from "@/components/generate-form/dialog-step";
import { ImageTypeOption } from "@/components/generate-form/image-type-option";
import { SourceImagePicker } from "@/components/generate-form/source-image-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IMAGE_TYPES, IMAGE_TYPE_LABELS, type ImageType } from "@/lib/image-types";
import type { ProductImage } from "@/lib/shopify/products";

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
  sourceImages,
  disabledReason,
}: {
  productUrlId: string;
  productTitle: string;
  /** The product's images from Shopify, which the user can choose a source from. */
  sourceImages: ProductImage[];
  /** When set, the button is disabled and this text explains why (e.g. no source image yet). */
  disabledReason?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  // Each type's Change button, so focus can go back to it when the user leaves the source picker.
  const changeButtonRefs = useRef<Partial<Record<ImageType, HTMLButtonElement | null>>>({});
  const [selected, setSelected] = useState<ImageType[]>(["packshot"]);
  // The source image ID per type. Starts as the product's first image; unchecking a type keeps its choice.
  const [sources, setSources] = useState<Record<ImageType, string>>(() =>
    Object.fromEntries(IMAGE_TYPES.map((type) => [type, sourceImages[0]?.id ?? ""])) as Record<ImageType, string>,
  );
  const [status, setStatus] = useState<Status>("choosing");
  // The type whose source is being chosen. While set, the source picker replaces the list of image types.
  const [pickingFor, setPickingFor] = useState<ImageType | null>(null);
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
    setPickingFor(null);
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

  function openPicker(type: ImageType) {
    // flushSync renders the picker first, so focus can move to its title. Otherwise focus stays on a Change button that is gone.
    flushSync(() => setPickingFor(type));
    titleRef.current?.focus();
  }

  /** Leaves the picker. With an image ID, it becomes the type's source; without one (Back), nothing is saved. */
  function closePicker(type: ImageType, imageId?: string) {
    flushSync(() => {
      if (imageId) setSources((current) => ({ ...current, [type]: imageId }));
      setPickingFor(null);
    });
    changeButtonRefs.current[type]?.focus();
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
          result = await generateImage(productUrlId, type, sources[type]);
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
        // Close and Escape drop a pending source choice, so reopening starts on the list of image types.
        onClose={() => setPickingFor(null)}
        // One fixed size for every step, so the dialog does not jump. The width keeps the approval cards side by side.
        // open:flex, not flex: a plain display class would override the browser hiding the closed dialog.
        // overflow-y-auto only matters on very low screens, where even the fixed parts do not fit.
        className="m-auto h-[min(48rem,calc(100dvh-4rem))] w-full max-w-4xl flex-col overflow-y-auto rounded-xl bg-surface p-6 text-primary shadow-xl backdrop:bg-black/40 open:flex sm:p-8"
      >
        <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
          {/* tabIndex -1 lets openPicker() move focus here; it is not a tab stop. */}
          <h2
            ref={titleRef}
            id="generate-dialog-title"
            tabIndex={-1}
            className="typography-heading-page focus:outline-none"
          >
            {pickingFor ? "Choose source image" : `Generate images for ${productTitle}`}
          </h2>
          <Button variant="tertiary" leadingIcon="close" onClick={close}>
            Close
          </Button>
        </div>

        <ol aria-label="Steps" className="mb-6 flex shrink-0 flex-wrap gap-2">
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

        {status === "choosing" && pickingFor && (
          <SourceImagePicker
            typeLabel={IMAGE_TYPE_LABELS[pickingFor]}
            images={sourceImages}
            currentImageId={sources[pickingFor]}
            onUse={(imageId) => closePicker(pickingFor, imageId)}
            onBack={() => closePicker(pickingFor)}
          />
        )}

        {status === "choosing" && !pickingFor && (
          <DialogStep
            top={
              <>
                <h3 id="image-types-heading" className="typography-label">
                  Image types
                </h3>
                <p className="typography-body-sm text-secondary">
                  Choose the source image for each type from the product&apos;s images in Shopify.
                </p>
              </>
            }
            bottom={
              <p className="flex items-start gap-3 rounded-lg bg-subtle p-4 typography-body-sm text-secondary">
                <Icon name="info" size="sm" className="mt-0.5" />
                Generated images must be approved before they are used.
              </p>
            }
            footer={
              <div className="flex flex-wrap items-center justify-end gap-3">
                {/* The count, or why Generate is disabled. The button points to this text when nothing is chosen. */}
                <p id="generate-none-selected" className="mr-auto typography-body-sm text-secondary">
                  {total === 0 ? "Choose at least one image type" : imagesLabel}
                </p>
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
            }
          >
            {/* A group instead of a fieldset, because its heading sits in the fixed part above the scroll area. */}
            <div role="group" aria-labelledby="image-types-heading" className="flex flex-col gap-3">
              {IMAGE_TYPES.map((type) => {
                const source = sourceImages.find((image) => image.id === sources[type]);
                // Only missing if the product has no images, and then the Generate button is disabled.
                if (!source) return null;
                return (
                  <ImageTypeOption
                    key={type}
                    label={IMAGE_TYPE_LABELS[type]}
                    checked={selected.includes(type)}
                    onCheckedChange={(checked) => toggle(type, checked)}
                    source={source}
                    onChangeSource={() => openPicker(type)}
                    changeButtonRef={(button) => {
                      changeButtonRefs.current[type] = button;
                    }}
                  />
                );
              })}
            </div>
          </DialogStep>
        )}

        {generating && (
          <DialogStep
            top={
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
                  className="h-2 w-full overflow-hidden rounded-full bg-subtle"
                >
                  <div
                    className="h-full rounded-full bg-brand transition-[width]"
                    style={{ width: `${(results.length / queue.length) * 100}%` }}
                  />
                </div>
              </>
            }
            footer={
              <div className="flex flex-wrap items-center justify-end gap-4">
                {/* Announced as each image finishes; the per-row badges would be too chatty. */}
                <p aria-live="polite" className="mr-auto typography-body-sm text-secondary">
                  {results.length} of {queue.length} done{timeLeft && ` · ${timeLeft}`}
                </p>
                <Button variant="secondary" onClick={close}>
                  Close
                </Button>
              </div>
            }
            // The rows have nothing to focus, so the list itself must be focusable to scroll it with the keyboard.
            scrollLabel="Images being generated"
          >
            <ul className="flex flex-col gap-2">
              {queue.map((type, i) => {
                // Sources can only change while choosing, so this is the image the run uses.
                const source = sourceImages.find((image) => image.id === sources[type]);
                return (
                  <li key={type} className="flex items-center gap-4 rounded-lg border border-default p-3">
                    {/* Empty alt: the text next to it says what the image is. */}
                    {source ? (
                      <Image
                        src={source.url}
                        alt=""
                        width={56}
                        height={56}
                        className="size-14 shrink-0 rounded-md bg-subtle object-contain"
                      />
                    ) : (
                      <div aria-hidden="true" className="size-14 shrink-0 rounded-md bg-subtle" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="typography-label text-primary">{IMAGE_TYPE_LABELS[type]}</p>
                      <p className="typography-body-sm text-secondary">Source: From Shopify</p>
                    </div>
                    <GenerateStatus result={results[i]} isCurrent={i === results.length} />
                  </li>
                );
              })}
            </ul>
          </DialogStep>
        )}

        {status === "approving" && (
          <DialogStep
            top={
              <>
                <h3 className="typography-label">
                  Review {generatedCount} image{generatedCount === 1 ? "" : "s"}
                </h3>
                <p className="typography-body-sm text-secondary">
                  Nothing is sent to the shop or feeds until you approve.
                </p>
              </>
            }
            footer={
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="typography-body-sm text-secondary">
                  Images you don&apos;t approve or reject now wait on the{" "}
                  <Link href="/approval" className="underline hover:text-primary">
                    Approval page
                  </Link>
                  .
                </p>
                <Button onClick={close}>Done</Button>
              </div>
            }
            // Make the results keyboard-scrollable when no card has remaining actions.
            scrollLabel={
              results.some(
                (result) =>
                  result.ok &&
                  changes[result.imageId] !== "uploaded" &&
                  changes[result.imageId] !== "rejected",
              )
                ? undefined
                : "Results"
            }
          >
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
          </DialogStep>
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
