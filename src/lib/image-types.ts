/**
 * The image types a user can generate, with the names shown in the app. Shared by the generate dialog and the server action.
 */

export const IMAGE_TYPES = ["packshot"] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];

export const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  packshot: "Packshot",
};

export function isImageType(value: unknown): value is ImageType {
  return IMAGE_TYPES.includes(value as ImageType);
}
