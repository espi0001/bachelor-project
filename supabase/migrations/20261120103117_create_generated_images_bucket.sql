-- BA-159: Storage bucket for images generated with Photoroom.
-- Private: files are only reachable through signed URLs that the server creates after checking the organization.
-- Created in a migration so the bucket is the same locally and in the cloud.

INSERT INTO "storage"."buckets" ("id", "name", "public", "file_size_limit", "allowed_mime_types")
VALUES (
  'generated-images',
  'generated-images',
  false,
  10485760, -- 10 MB in bytes. A Photoroom SQUARE_HD PNG is a few MB.
  -- Raster image formats only. SVG is left out on purpose: it can contain scripts that run when the file is opened.
  -- image/jpeg covers both .jpg and .jpeg files.
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/avif']
);
