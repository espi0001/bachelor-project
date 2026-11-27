-- BA-150: let the user upload a source image from their device instead of choosing one of the product's Shopify images.
-- Adds a private bucket for the uploaded files and lets a generated_image row point at one of them.
-- Existing rows all have a Shopify source, so they pass the new check. No data is changed or deleted.

-- Private, like "generated-images": the browser uploads with a signed upload link the server creates after checking
-- the organization, and files are only read through signed links.
INSERT INTO "storage"."buckets" ("id", "name", "public", "file_size_limit", "allowed_mime_types")
VALUES (
  'source-images',
  'source-images',
  false,
  10485760, -- 10 MB in bytes. Matches the limit the upload panel shows and checks in the browser.
  -- The formats the upload panel accepts. SVG is left out on purpose: it can contain scripts.
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

ALTER TABLE "public"."generated_image"
  -- A source uploaded from the device has no Shopify image.
  ALTER COLUMN "source_image_id"  DROP NOT NULL,
  ALTER COLUMN "source_image_url" DROP NOT NULL,
  -- Path inside the "source-images" bucket: "{store_id}/{product number}/{uuid}.{ext}". Null for a Shopify source.
  ADD COLUMN "source_storage_path" text,

  -- Exactly one kind of source: a Shopify image (ID and URL together) or an uploaded file.
  ADD CONSTRAINT "generated_image_one_source_check" CHECK (
    ("source_image_id" IS NOT NULL AND "source_image_url" IS NOT NULL AND "source_storage_path" IS NULL)
    OR ("source_image_id" IS NULL AND "source_image_url" IS NULL AND "source_storage_path" IS NOT NULL)
  );
