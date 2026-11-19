/**
 * Server-only client for Photoroom's Image Editing API: sends an image URL plus options and returns the edited image.
 */

import "server-only";

// Docs: https://docs.photoroom.com/image-editing-api-plus-plan
// Sandbox keys (prefix "sandbox_") use the same endpoint, are free and return watermarked images,
// so switching to a live key only means changing PHOTOROOM_API_KEY.
const PHOTOROOM_EDIT_URL = "https://image-api.photoroom.com/v2/edit";

// AI generation can take a while. Fail instead of hanging the request forever.
const REQUEST_TIMEOUT_MS = 90_000;

export type PhotoroomResult = {
  /** The edited image as raw bytes. */
  data: Buffer;
  /** E.g. "image/png". */
  contentType: string;
};

function getApiKey(): string {
  const apiKey = process.env.PHOTOROOM_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Photoroom config. Set PHOTOROOM_API_KEY in .env.local");
  }
  return apiKey;
}

/**
 * Sends an image to Photoroom's /v2/edit endpoint with the given options
 * (e.g. { "flatLay.mode": "ai.auto" }) and returns the edited image.
 * Throws if Photoroom returns an error or the request times out.
 */
export async function photoroomEdit(
  imageUrl: string,
  options: Record<string, string>,
): Promise<PhotoroomResult> {
  // Photoroom expects multipart form data: the image plus one field per option.
  const form = new FormData();
  form.append("imageUrl", imageUrl);
  for (const [key, value] of Object.entries(options)) {
    form.append(key, value);
  }

  const res = await fetch(PHOTOROOM_EDIT_URL, {
    method: "POST",
    headers: { "x-api-key": getApiKey() },
    body: form,
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    // Photoroom returns a JSON error body (e.g. invalid argument, quota exceeded). It never contains our key.
    throw new Error(`Photoroom request failed (${res.status}): ${await res.text()}`);
  }

  return {
    data: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get("content-type") ?? "image/png",
  };
}
