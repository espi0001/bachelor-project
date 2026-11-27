/**
 * One generated image to approve or reject: the original next to the generated image, its type, product and actions.
 * Used on the approval page and in the generate dialog's last step.
 */

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/action-button";
import { approveImage, rejectImage, retryUpload, type ApprovalResult } from "@/app/approval/actions";

/** What happened to an image on this card, for callers that keep their own state (the generate dialog). */
export type ApprovalChange = "uploaded" | "rejected" | "uploadFailed";

type ApprovalCardProps = {
  imageId: string;
  /** True while the image is being uploaded, e.g. started from another tab. Shows no buttons, since the server refuses them. */
  uploading?: boolean;
  /** True if the image is approved but its upload to Shopify failed. Shows Retry instead of Approve. */
  uploadFailed: boolean;
  /** When set, the card shows the result instead of the buttons. */
  outcome?: "uploaded" | "rejected";
  /** Called after Approve, Retry or Reject changed the image. The approval page leaves it out and refreshes instead. */
  onChange?: (change: ApprovalChange) => void;
  /** Shown as the heading, e.g. "Packshot". */
  typeLabel: string;
  /** h2 on the approval page (below its h1), h3 in the dialog (below its h2 title). */
  headingLevel?: "h2" | "h3";
  /** Null if the product was deleted in Shopify. */
  productTitle: string | null;
  /** A Shopify image, or a signed link to a source uploaded from the device. Null if that file is missing in Storage. */
  originalUrl: string | null;
  /** Null if the file is missing in Storage, so no signed link could be made. */
  generatedUrl: string | null;
};

const IMAGE_BOX_CLASSES = "aspect-square w-full rounded-md bg-subtle object-contain @3xl:w-44";

export function ApprovalCard({
  imageId,
  uploading = false,
  uploadFailed,
  outcome,
  onChange,
  typeLabel,
  headingLevel: Heading = "h2",
  productTitle,
  originalUrl,
  generatedUrl,
}: ApprovalCardProps) {
  const productName = productTitle ?? "Deleted product";

  function handleUpload(result: ApprovalResult) {
    if (result.ok) onChange?.("uploaded");
    else if (result.uploadFailed) onChange?.("uploadFailed");
  }

  function handleReject(result: ApprovalResult) {
    if (result.ok) onChange?.("rejected");
  }

  return (
    // Container queries (@3xl:) instead of screen breakpoints (md:): the card is used both on a full page and
    // in a dialog, so it lays itself out by the space it gets. A container query only applies to the
    // container's children, so the wrapper is the container and the article inside it changes layout.
    <div className="@container">
      <article className="flex flex-col gap-6 rounded-lg border border-default bg-surface p-6 @3xl:flex-row @3xl:items-center">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 @3xl:flex @3xl:gap-6">
          {originalUrl ? (
            <Image
              src={originalUrl}
              alt={`Original image of ${productName}`}
              width={352}
              height={352}
              // Shopify images go through the image optimizer. A signed Storage link expires, so it is not cached.
              unoptimized={!originalUrl.startsWith("https://cdn.shopify.com/")}
              className={IMAGE_BOX_CLASSES}
            />
          ) : (
            <PreviewUnavailable />
          )}
          {/* Decorative: the alt texts already say which image is the original and which is generated. */}
          <span aria-hidden="true" className="typography-heading-section text-secondary">
            →
          </span>
          {generatedUrl ? (
            // unoptimized: a signed link expires, so the image optimizer should not fetch and cache it.
            <Image
              src={generatedUrl}
              alt={`Generated ${typeLabel.toLowerCase()} of ${productName}`}
              width={352}
              height={352}
              unoptimized
              className={IMAGE_BOX_CLASSES}
            />
          ) : (
            <PreviewUnavailable />
          )}
        </div>

        <div className="flex flex-1 flex-col items-start gap-2">
          <Heading className="typography-heading-section text-primary">{typeLabel}</Heading>
          <p className="typography-body-sm text-secondary">
            {productTitle ?? "This product was deleted in Shopify."}
          </p>
          {/* Announced when it changes, because the buttons that were clicked disappear at the same time. */}
          <div aria-live="polite">
            {outcome === "uploaded" ? (
              <Badge variant="success">Uploaded to Shopify</Badge>
            ) : outcome === "rejected" ? (
              <Badge variant="warning">Rejected</Badge>
            ) : uploading ? (
              <Badge variant="warning">Uploading…</Badge>
            ) : uploadFailed ? (
              <Badge variant="error">Upload failed</Badge>
            ) : (
              // Hard-coded until the requirement checks exist.
              <Badge variant="success">Label</Badge>
            )}
          </div>
        </div>

        {!outcome && !uploading && (
          <div className="flex flex-col gap-2 @3xl:w-40">
            {/* One button that changes label and action, not two buttons swapped by a condition: React then keeps
                its state when a failed Approve turns the card into "Upload failed", so the error stays visible. */}
            <ActionButton
              action={uploadFailed ? retryUpload.bind(null, imageId) : approveImage.bind(null, imageId)}
              variant="primary"
              label={uploadFailed ? "Retry upload" : "Approve"}
              pendingLabel="Uploading…"
              onResult={onChange && handleUpload}
            />
            {/* Not wired up yet. Hidden on a failed upload, which is already approved. */}
            {!uploadFailed && <Button variant="secondary">Generate again</Button>}
            <ActionButton
              action={rejectImage.bind(null, imageId)}
              variant="secondary"
              label="Reject"
              pendingLabel="Rejecting…"
              onResult={onChange && handleReject}
            />
          </div>
        )}
      </article>
    </div>
  );
}

/** Takes an image's place when its file is missing, so the layout stays the same. */
function PreviewUnavailable() {
  return (
    <div
      className={`${IMAGE_BOX_CLASSES} flex items-center justify-center p-2 text-center typography-caption text-secondary`}
    >
      Preview unavailable
    </div>
  );
}
