CREATE TABLE "sitter_slug_history" (
	"slug" text PRIMARY KEY NOT NULL,
	"sitter_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sitter_slug_history" ADD CONSTRAINT "sitter_slug_history_sitter_id_sitters_user_id_fk" FOREIGN KEY ("sitter_id") REFERENCES "public"."sitters"("user_id") ON DELETE cascade ON UPDATE no action;