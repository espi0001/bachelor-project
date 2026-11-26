/** Google Merchant Center image rules for the overview. The first image is the main image. */

import type { ProductImage } from "@/lib/shopify/products";

const MIN_SIDE = 100;
const RECOMMENDED_SIDE = 500;
const MAX_PIXELS = 64_000_000;
const BELOW_RECOMMENDED = "Image under 500×500 until 31 January 2027";

export type ImageIssue = {
  severity: "error" | "attention";
  text: string;
};

function hasDimensions(image: ProductImage): image is ProductImage & { width: number; height: number } {
  return image.width !== null && image.height !== null;
}

function shorterThan(width: number, height: number, side: number): boolean {
  return width < side || height < side;
}

function lacksAlt(image: ProductImage): boolean {
  return image.altText === null || image.altText.trim() === "";
}

/**
 * One entry per problem kind, errors first.
 * Images with no width or height are skipped: Shopify leaves both null when it does not host the file.
 */
export function imageIssues(images: ProductImage[]): ImageIssue[] {
  if (images.length === 0) {
    return [{ severity: "error", text: "No image" }];
  }

  const errors: ImageIssue[] = [];
  const attention: ImageIssue[] = [];
  const [main, ...extras] = images;

  if (main && hasDimensions(main)) {
    const belowMinimum = shorterThan(main.width, main.height, MIN_SIDE);
    const aboveMaximum = main.width * main.height > MAX_PIXELS;
    if (belowMinimum) errors.push({ severity: "error", text: "Main image under 100×100" });
    if (aboveMaximum) errors.push({ severity: "error", text: "Main image over 64 megapixels" });
    if (!belowMinimum && !aboveMaximum && shorterThan(main.width, main.height, RECOMMENDED_SIDE)) {
      attention.push({ severity: "attention", text: BELOW_RECOMMENDED });
    }
  }

  let extraBelowMinimum = false;
  let belowRecommended = attention.length > 0;
  let missingAlt = main !== undefined && hasDimensions(main) && lacksAlt(main);

  for (const image of extras) {
    if (!hasDimensions(image)) continue;
    if (shorterThan(image.width, image.height, MIN_SIDE)) extraBelowMinimum = true;
    else if (shorterThan(image.width, image.height, RECOMMENDED_SIDE)) belowRecommended = true;
    if (lacksAlt(image)) missingAlt = true;
  }

  if (belowRecommended && attention.length === 0) {
    attention.push({ severity: "attention", text: BELOW_RECOMMENDED });
  }
  if (extraBelowMinimum) {
    attention.push({ severity: "attention", text: "Extra image under 100×100" });
  }
  if (missingAlt) {
    attention.push({ severity: "attention", text: "No alt text" });
  }

  return [...errors, ...attention];
}

/** The first issue, then "+ N" for the rest. A single issue has no plus. */
export function issueLabel(issues: ImageIssue[]): string {
  const [first, ...rest] = issues;
  if (!first) return "";
  if (rest.length === 0) return first.text;
  return `${first.text} + ${rest.length}`;
}
