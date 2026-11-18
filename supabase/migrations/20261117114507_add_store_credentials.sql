-- BA-147: each store keeps its own Shopify app credentials and the access token from OAuth.
-- The Client secret and the access token are encrypted in the app (AES-256-GCM, src/lib/crypto.ts) before they are stored.

-- Rows from BA-146 have no credentials and cannot get a token after this change.
-- The organization connects the store again through /connect-store.
DELETE FROM "public"."store";

ALTER TABLE "public"."store"
  ADD COLUMN "name" text NOT NULL;

ALTER TABLE "public"."store"
  ADD COLUMN "shopify_client_id" text NOT NULL;

ALTER TABLE "public"."store"
  ADD COLUMN "shopify_client_secret_encrypted" text NOT NULL;

ALTER TABLE "public"."store"
  ADD COLUMN "shopify_access_token_encrypted" text NOT NULL;
