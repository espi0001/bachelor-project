/**
 * Server-only client for Supabase Storage: uploads and deletes generated images and creates signed links to them.
 * Every call to Supabase Storage goes through this file. It does not check access; callers do that first.
 */

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** The private bucket created in supabase/migrations/20261120103117_create_generated_images_bucket.sql. */
export const GENERATED_IMAGES_BUCKET = "generated-images";

/** How long a signed link works, in seconds. */
const SIGNED_URL_EXPIRES_IN = 60 * 60;

let client: SupabaseClient | undefined;

/** Creates the client on first use and reuses it after that. */
function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("Missing Supabase Storage config. Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local");
  }

  // The server is not a signed-in Supabase user (Clerk handles sign-in), so there is no session to keep.
  client = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

function bucket() {
  return getClient().storage.from(GENERATED_IMAGES_BUCKET);
}

/**
 * Uploads a generated image to the given path in the bucket.
 * Never overwrites: throws if a file already exists at that path.
 */
export async function uploadGeneratedImage(path: string, data: Buffer, contentType: string): Promise<void> {
  const { error } = await bucket().upload(path, data, { contentType, upsert: false });
  if (error) throw new Error(`Uploading ${path} to Storage failed: ${error.message}`);
}

/** Deletes a generated image from the bucket. Deleting a file that does not exist is not an error. */
export async function deleteGeneratedImage(path: string): Promise<void> {
  await deleteGeneratedImages([path]);
}

/** Deletes several generated images in one request. Deleting files that do not exist is not an error. */
export async function deleteGeneratedImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;

  const { error } = await bucket().remove(paths);
  if (error) throw new Error(`Deleting ${paths.length} file(s) from Storage failed: ${error.message}`);
}

/**
 * Creates signed links for several images in one request.
 * Returns a map from path to link. A path whose file is missing is left out of the map.
 */
export async function createSignedImageUrls(paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;

  const { data, error } = await bucket().createSignedUrls(paths, SIGNED_URL_EXPIRES_IN);
  if (error) throw new Error(`Creating signed links failed: ${error.message}`);

  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) urls.set(item.path, item.signedUrl);
  }
  return urls;
}
