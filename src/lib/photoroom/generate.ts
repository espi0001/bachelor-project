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
 * "Packshot" in our app: Photoroom's Ghost Mannequin, which redraws the garment without the model,
 * as if worn by an invisible mannequin. Photoroom documents it for clothing, but in our tests it
 * also gave the best packshots of other products, so it is used for every product type.
 * Docs: https://docs.photoroom.com/image-editing-api-plus-plan/ghost-mannequin
 */
export function generatePackshot(image: Blob): Promise<PhotoroomResult> {
  return photoroomEdit(image, {
    "ghostMannequin.mode": "ai.auto",
    "ghostMannequin.size": "SQUARE_HD",
  });
}

/**
 * "Lifestyle image" in our app: the product kept as it is, on a new AI background described by
 * the store's visual tone of voice. Falls back to a neutral prompt when the store has none.
 * Docs: https://docs.photoroom.com/image-editing-api-plus-plan/ai-backgrounds
 */
export function generateLifestyleImage(
  image: Blob,
  visualToneOfVoice: string | null,
): Promise<PhotoroomResult> {
  return photoroomEdit(image, {
    // Keeps the product at its original size and place, as in Photoroom's AI background examples.
    referenceBox: "originalImage",
    "background.prompt": visualToneOfVoice || DEFAULT_LIFESTYLE_PROMPT,
  });
}
