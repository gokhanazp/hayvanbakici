CREATE TABLE "sitter_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sitter_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sitter_photos" ADD CONSTRAINT "sitter_photos_sitter_id_sitters_user_id_fk" FOREIGN KEY ("sitter_id") REFERENCES "public"."sitters"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sitter_photos_sitter_idx" ON "sitter_photos" USING btree ("sitter_id","sort_order");