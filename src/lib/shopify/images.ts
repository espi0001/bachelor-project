/**
 * Server-only download of product images from Shopify's CDN, so they can be sent on as files (e.g. to Photoroom).
 */

import "server-only";

const SHOPIFY_CDN_ORIGIN = "https://cdn.shopify.com";

// The CDN converts images per request (it serves WebP as JPEG to clients that do not ask for WebP).
// Only ask for formats Photoroom accepts, so it never gets AVIF.
const ACCEPT = "image/webp,image/png,image/jpeg";

const REQUEST_TIMEOUT_MS = 30_000;

/** A freshly uploaded image can briefly fail on the CDN while Shopify processes it, so one retry after a pause. */
const RETRY_DELAY_MS = 2_000;

/**
 * Downloads a product image from Shopify's CDN into memory. Retries once.
 * Throws if the URL is not on the CDN, or the CDN still fails after the retry.
 */
export async function downloadShopifyImage(url: string): Promise<Blob> {
  // The URL comes from Shopify, but checking the host means this can never be used to fetch other addresses.
  if (new URL(url).origin !== SHOPIFY_CDN_ORIGIN) throw new Error(`Not a Shopify CDN URL: ${url}`);

  try {
    return await fetchImage(url);
  } catch (firstError) {
    console.warn(`Downloading ${url} failed, retrying once:`, firstError);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return fetchImage(url);
  }
}

async function fetchImage(url: string): Promise<Blob> {
  const res = await fetch(url, {
    headers: { accept: ACCEPT },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Shopify CDN answered ${res.status} for ${url}`);
  return res.blob();
}
