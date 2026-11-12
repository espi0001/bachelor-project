ALTER TABLE "public"."store"
  ADD COLUMN "shopify_domain" text NOT NULL;

ALTER TABLE "public"."store"
  ADD COLUMN "auth_org_id" text;

ALTER TABLE "public"."store"
  ADD COLUMN "last_synced_at" timestamp WITH time zone;

ALTER TABLE "public"."store"
  ADD CONSTRAINT "store_shopify_domain_key" UNIQUE (shopify_domain);
