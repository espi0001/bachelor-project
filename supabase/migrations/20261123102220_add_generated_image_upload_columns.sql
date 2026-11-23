-- BA-153: track whether an approved image has been uploaded to Shopify.
-- An approved image without a media ID is one whose upload failed, so the approval page can offer a retry.
-- Adds nullable columns only: existing rows are not changed and no data is deleted.

ALTER TABLE "public"."generated_image"
  -- Shopify's ID for the uploaded image, e.g. "gid://shopify/MediaImage/123". Null until the upload succeeds.
  ADD COLUMN "shopify_media_id" text,
  -- When the upload succeeded. Null until then.
  ADD COLUMN "uploaded_at"      timestamp with time zone,

  -- The two columns are set together, so one cannot say "uploaded" while the other says "not uploaded".
  ADD CONSTRAINT "generated_image_upload_columns_together_check"
    CHECK (("shopify_media_id" IS NULL) = ("uploaded_at" IS NULL)),
  -- Only approved images may be in Shopify (BA-153: drafts and rejected images are never uploaded).
  ADD CONSTRAINT "generated_image_uploaded_only_if_approved_check"
    CHECK ("shopify_media_id" IS NULL OR "status" = 'approved');
