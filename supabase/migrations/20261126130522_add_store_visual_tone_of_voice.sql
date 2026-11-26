-- BA-195: the store's visual tone of voice, sent as Photoroom's background.prompt when lifestyle images are generated.
-- It lives on the store row on purpose: it needs a connected store, and disconnecting the store deletes it too.
-- NULL means the store has not written one yet.

ALTER TABLE "public"."store"
  ADD COLUMN "visual_tone_of_voice" text;
