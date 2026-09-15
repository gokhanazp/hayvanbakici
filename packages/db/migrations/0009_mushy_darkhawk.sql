CREATE TABLE "favourites" (
	"user_id" uuid NOT NULL,
	"sitter_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favourites_user_id_sitter_id_pk" PRIMARY KEY("user_id","sitter_id")
);
--> statement-breakpoint
ALTER TABLE "favourites" ADD CONSTRAINT "favourites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favourites" ADD CONSTRAINT "favourites_sitter_id_sitters_user_id_fk" FOREIGN KEY ("sitter_id") REFERENCES "public"."sitters"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "favourites_user_idx" ON "favourites" USING btree ("user_id","created_at");