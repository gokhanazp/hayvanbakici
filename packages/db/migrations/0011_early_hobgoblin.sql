ALTER TABLE "sitters" ADD COLUMN "has_children" boolean;--> statement-breakpoint
ALTER TABLE "sitters" ADD COLUMN "pets_on_bed" boolean;--> statement-breakpoint
ALTER TABLE "sitters" ADD COLUMN "pets_on_furniture" boolean;--> statement-breakpoint
ALTER TABLE "sitters" ADD COLUMN "potty_break_hours" integer;--> statement-breakpoint
ALTER TABLE "sitters" ADD COLUMN "schedule_text" text;--> statement-breakpoint
ALTER TABLE "sitters" ADD COLUMN "typical_day_text" text;--> statement-breakpoint
ALTER TABLE "sitters" ADD COLUMN "safety_text" text;--> statement-breakpoint
ALTER TABLE "sitters" ADD COLUMN "owner_prefs_text" text;