/**
 * One generated image waiting for approval, or approved but not yet in Shopify:
 * the original next to the generated image, its type, product and actions.
 */

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "./action-button";
import { approveImage, rejectImage, retryUpload } from "./actions";

type ApprovalCardProps = {
  imageId: string;
  /** True if the image is approved but its upload to Shopify failed. Shows Retry instead of Approve. */
  uploadFailed: boolean;
  /** Shown as the heading, e.g. "Packshot". */
  typeLabel: string;
  /** Null if the product was deleted in Shopify. */
  productTitle: string | null;
  originalUrl: string;
  /** Null if the file is missing in Storage, so no signed link could be made. */
  generatedUrl: string | null;
};

const IMAGE_BOX_CLASSES = "aspect-square w-full rounded-md bg-subtle object-contain md:w-44";

export function ApprovalCard({ imageId, uploadFailed, typeLabel, productTitle, originalUrl, generatedUrl }: ApprovalCardProps) {
  const productName = productTitle ?? "Deleted product";

  return (
    <article className="flex flex-col gap-6 rounded-lg border border-default bg-surface p-6 md:flex-row md:items-center">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:flex md:gap-6">
        <Image
          src={originalUrl}
          alt={`Original image of ${productName}`}
          width={352}
          height={352}
          className={IMAGE_BOX_CLASSES}
        />
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
          <div
            className={`${IMAGE_BOX_CLASSES} flex items-center justify-center p-2 text-center typography-caption text-secondary`}
          >
            Preview unavailable
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col items-start gap-2">
        <h2 className="typography-heading-section text-primary">{typeLabel}</h2>
        <p className="typography-body-sm text-secondary">
          {productTitle ?? "This product was deleted in Shopify."}
        </p>
        {uploadFailed ? (
          <Badge variant="error">Upload failed</Badge>
        ) : (
          // Hard-coded until the requirement checks exist.
          <Badge variant="success">Label</Badge>
        )}
      </div>

      <div className="flex flex-col gap-2 md:w-40">
        {/* One button that changes label and action, not two buttons swapped by a condition: React then keeps
            its state when a failed Approve turns the card into "Upload failed", so the error stays visible. */}
        <ActionButton
          action={uploadFailed ? retryUpload.bind(null, imageId) : approveImage.bind(null, imageId)}
          variant="primary"
          label={uploadFailed ? "Retry upload" : "Approve"}
          pendingLabel="Uploading…"
        />
        {/* Not wired up yet: comes after the Approve steps. Hidden on a failed upload, which is already approved. */}
        {!uploadFailed && <Button variant="secondary">Generate again</Button>}
        <ActionButton
          action={rejectImage.bind(null, imageId)}
          variant="secondary"
          label="Reject"
          pendingLabel="Rejecting…"
        />
      </div>
    </article>
  );
}
