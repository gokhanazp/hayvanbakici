CREATE TABLE "commission_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"sitter_pct_platform" real,
	"sitter_pct_repeat" real,
	"sitter_pct_referral" real,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"ended_early_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "commission_campaigns_window" CHECK ("commission_campaigns"."ends_at" > "commission_campaigns"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "commission_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"sitter_pct_platform" real DEFAULT 18 NOT NULL,
	"sitter_pct_repeat" real DEFAULT 10 NOT NULL,
	"sitter_pct_referral" real DEFAULT 0 NOT NULL,
	"owner_pct" real DEFAULT 7 NOT NULL,
	"owner_fee_cap_cents" integer DEFAULT 4500 NOT NULL,
	"launch_promo_months" integer DEFAULT 12 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "commission_settings_single_row" CHECK ("commission_settings"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "commission_campaigns" ADD CONSTRAINT "commission_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_settings" ADD CONSTRAINT "commission_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commission_campaigns_window_idx" ON "commission_campaigns" USING btree ("starts_at","ends_at");