ALTER TABLE "public"."store"
  ADD CONSTRAINT "store_auth_org_id_key" UNIQUE (auth_org_id);
