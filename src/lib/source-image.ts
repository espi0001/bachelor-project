/**
 * The source image a generated image is made from: one of the product's Shopify images, or a file uploaded from the
 * user's device. Shared by the generate dialog and the server actions, so both use the same rules.
 */

/** What the browser sends to generateImage. The server checks it, since anything from the browser can be changed. */
export type SourceImageChoice =
  | { kind: "shopify"; imageId: string }
  | { kind: "upload"; path: string };

/** File extension per accepted content type. Matches allowed_mime_types on the "source-images" bucket. */
export const SOURCE_IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;
export type SourceImageContentType = keyof typeof SOURCE_IMAGE_EXTENSIONS;

/** Same as file_size_limit on the "source-images" bucket, which enforces it again on upload. */
export const SOURCE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

/** Smaller images give poor results in Photoroom. Only checked in the browser: the server has no image library. */
export const SOURCE_IMAGE_MIN_PIXELS = 500;

export function isSourceImageContentType(value: unknown): value is SourceImageContentType {
  return typeof value === "string" && Object.hasOwn(SOURCE_IMAGE_EXTENSIONS, value);
}

export function isSourceImageChoice(value: unknown): value is SourceImageChoice {
  if (typeof value !== "object" || value === null) return false;
  const choice = value as Record<string, unknown>;
  if (choice.kind === "shopify") return typeof choice.imageId === "string";
  if (choice.kind === "upload") return typeof choice.path === "string";
  return false;
}
