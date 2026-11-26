/**
 * Generates product images with Photoroom, one function per image type.
 */

import "server-only";
import { photoroomEdit, type PhotoroomResult } from "./client";

/**
 * Used when the store has no visual tone of voice, so a lifestyle image can still be generated.
 * Photoroom expands short prompts itself (background.expandPrompt is on by default).
 */
const DEFAULT_LIFESTYLE_PROMPT =
  "a bright, natural everyday setting with soft daylight and a softly blurred background";

/**
 * "Packshot" in our app: Photoroom's Flat Lay, a new top-down image of the product.
 * Photoroom builds it for clothing; other products are allowed but may give weaker results.
 * Docs: https://docs.photoroom.com/image-editing-api-plus-plan/flat-lay
 */
export function generatePackshot(imageUrl: string): Promise<PhotoroomResult> {
  return photoroomEdit(imageUrl, {
    "flatLay.mode": "ai.auto",
    "flatLay.size": "SQUARE_HD",
  });
}

/**
 * "Lifestyle image" in our app: the product kept as it is, on a new AI background described by
 * the store's visual tone of voice. Falls back to a neutral prompt when the store has none.
 * Docs: https://docs.photoroom.com/image-editing-api-plus-plan/ai-backgrounds
 */
export function generateLifestyleImage(
  imageUrl: string,
  visualToneOfVoice: string | null,
): Promise<PhotoroomResult> {
  return photoroomEdit(imageUrl, {
    // Keeps the product at its original size and place, as in Photoroom's AI background examples.
    referenceBox: "originalImage",
    "background.prompt": visualToneOfVoice || DEFAULT_LIFESTYLE_PROMPT,
  });
}
