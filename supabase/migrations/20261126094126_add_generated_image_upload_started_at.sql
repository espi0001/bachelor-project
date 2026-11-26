-- BA-153: mark an image as "uploading" while it is being sent to Shopify.
-- Without it, an image that is uploading looks like a failed upload (approved, no media ID), so a second tab
-- or a colleague could retry it (uploading it twice) or reject it (leaving it in Shopify but marked rejected).
-- Adds a nullable column only: existing rows are not changed and no data is deleted.

ALTER TABLE "public"."generated_image"
  -- When the current upload started. Null when no upload is running.
  -- The app treats a value older than 5 minutes as a crashed upload (Vercel stops a function after 300 seconds at most),
  -- so the image can be retried.
  ADD COLUMN "upload_started_at" timestamp with time zone,

  -- Only approved images are uploaded.
  ADD CONSTRAINT "generated_image_upload_started_only_if_approved_check"
    CHECK ("upload_started_at" IS NULL OR "status" = 'approved');
