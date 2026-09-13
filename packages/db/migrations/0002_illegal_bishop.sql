ALTER TABLE "sitters" ADD COLUMN "slug" text;--> statement-breakpoint
CREATE UNIQUE INDEX "sitters_slug_uq" ON "sitters" USING btree ("slug");