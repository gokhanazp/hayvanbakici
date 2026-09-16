ALTER TABLE "sitters" ADD COLUMN "spayed_neutered_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sitters" ADD COLUMN "no_females_in_heat" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sitters" ADD COLUMN "house_trained_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sitters" ADD COLUMN "min_pet_age_months" integer;