/**
 * Server-only client for Supabase Storage: stores generated images and uploaded source images, and signs links to them.
 * Every call to Supabase Storage goes through this file. It does not check access; callers do that first.
 */

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** The private bucket created in supabase/migrations/20261120103117_create_generated_images_bucket.sql. */
export const GENERATED_IMAGES_BUCKET = "generated-images";

/** The private bucket for source images uploaded from the user's device, created in
 * supabase/migrations/20261127125716_add_source_image_upload.sql. */
export const SOURCE_IMAGES_BUCKET = "source-images";

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

function bucket(name: string = GENERATED_IMAGES_BUCKET) {
  return getClient().storage.from(name);
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

/** Deletes generated images in batches. Deleting files that do not exist is not an error. */
export async function deleteGeneratedImages(paths: string[]): Promise<void> {
  await deleteFiles(GENERATED_IMAGES_BUCKET, paths);
}

/** Deletes uploaded source images in batches. Deleting files that do not exist is not an error. */
export async function deleteSourceImages(paths: string[]): Promise<void> {
  await deleteFiles(SOURCE_IMAGES_BUCKET, paths);
}

async function deleteFiles(bucketName: string, paths: string[]): Promise<void> {
  if (paths.length === 0) return;

  const maxBatchSize = 1000; // Supabase Storage's per-request deletion limit.
  for (let offset = 0; offset < paths.length; offset += maxBatchSize) {
    const batch = paths.slice(offset, offset + maxBatchSize);
    const { error } = await bucket(bucketName).remove(batch);
    if (error) throw new Error(`Deleting ${batch.length} file(s) from Storage failed: ${error.message}`);
  }
}

/**
 * Creates signed links for several images in one request.
 * Returns a map from path to link. A path whose file is missing is left out of the map.
 */
export async function createSignedImageUrls(paths: string[]): Promise<Map<string, string>> {
  return createSignedUrls(GENERATED_IMAGES_BUCKET, paths, SIGNED_URL_EXPIRES_IN);
}

/**
 * Creates signed links for several uploaded source images in one request, valid for expiresIn seconds (default an hour).
 * Returns a map from path to link. A path whose file is missing is left out of the map, so this also checks that
 * the files exist.
 */
export async function createSignedSourceImageUrls(
  paths: string[],
  expiresIn: number = SIGNED_URL_EXPIRES_IN,
): Promise<Map<string, string>> {
  return createSignedUrls(SOURCE_IMAGES_BUCKET, paths, expiresIn);
}

async function createSignedUrls(bucketName: string, paths: string[], expiresIn: number): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;

  const { data, error } = await bucket(bucketName).createSignedUrls(paths, expiresIn);
  if (error) throw new Error(`Creating signed links failed: ${error.message}`);

  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) urls.set(item.path, item.signedUrl);
  }
  return urls;
}

/** Downloads an uploaded source image. Throws if the file is missing or Storage fails. */
export async function downloadSourceImage(path: string): Promise<Blob> {
  const { data, error } = await bucket(SOURCE_IMAGES_BUCKET).download(path);
  if (error) throw new Error(`Downloading ${path} from Storage failed: ${error.message}`);
  return data;
}

/**
 * Creates a link the browser can upload one source image to, straight to Storage. The file never passes through our
 * server, so Vercel's request size limit (about 4.5 MB) does not apply. The bucket still enforces type and size.
 * Never overwrites: the upload fails if a file already exists at that path. The link works for two hours.
 */
export async function createSourceImageUploadUrl(path: string): Promise<string> {
  const { data, error } = await bucket(SOURCE_IMAGES_BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(`Creating an upload link for ${path} failed: ${error.message}`);
  return data.signedUrl;
}
