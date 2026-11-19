/**
 * Generates product images with Photoroom, one function per image type.
 */

import "server-only";
import { photoroomEdit, type PhotoroomResult } from "./client";

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
