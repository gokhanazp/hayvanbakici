CREATE TYPE "public"."attribution" AS ENUM('platform', 'sitter_referral', 'repeat');--> statement-breakpoint
CREATE TYPE "public"."booking_event_type" AS ENUM('check_in', 'check_out', 'photo', 'video', 'gps_ping', 'note', 'incident');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('draft', 'requested', 'counter_offered', 'declined', 'expired', 'confirmed', 'paid', 'in_progress', 'completed', 'payout_released', 'cancelled', 'disputed', 'refunded', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."cancellation_policy" AS ENUM('flexible', 'moderate', 'strict');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('submitted', 'under_review', 'approved', 'partially_approved', 'denied', 'paid');--> statement-breakpoint
CREATE TYPE "public"."claim_type" AS ENUM('vet', 'property', 'sitter_property', 'injury');--> statement-breakpoint
CREATE TYPE "public"."consent_type" AS ENUM('cookies_analytics', 'cookies_marketing', 'email_marketing', 'sms_marketing', 'criminal_check', 'biometric', 'tos_language', 'data_transfer_outside_quebec');--> statement-breakpoint
CREATE TYPE "public"."home_type" AS ENUM('house', 'townhouse', 'apartment', 'condo', 'farm');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('en-CA', 'fr-CA');--> statement-breakpoint
CREATE TYPE "public"."price_unit" AS ENUM('night', 'visit', 'walk', 'day', 'session');--> statement-breakpoint
CREATE TYPE "public"."province" AS ENUM('AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('boarding', 'house_sitting', 'drop_in', 'dog_walking', 'day_care', 'training', 'grooming');--> statement-breakpoint
CREATE TYPE "public"."sitter_status" AS ENUM('draft', 'pending', 'active', 'paused', 'deactivated');--> statement-breakpoint
CREATE TYPE "public"."species" AS ENUM('dog', 'cat', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'sitter', 'both', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('not_started', 'pending', 'passed', 'failed', 'expired', 'manual_review');--> statement-breakpoint
CREATE TYPE "public"."verification_type" AS ENUM('identity', 'criminal', 'licence', 'insurance', 'certification');--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name_initial" text NOT NULL,
	"last_name_enc" text,
	"avatar_url" text,
	"bio" text,
	"city_id" uuid,
	"neighbourhood_id" uuid,
	"province" "province",
	"postal_code" text,
	"approx_location" "geography",
	"exact_address_enc" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sitters" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"status" "sitter_status" DEFAULT 'draft' NOT NULL,
	"badge_level" integer DEFAULT 0 NOT NULL,
	"median_response_minutes" integer,
	"acceptance_rate" real DEFAULT 0 NOT NULL,
	"cancellation_rate" real DEFAULT 0 NOT NULL,
	"profile_completeness" real DEFAULT 0 NOT NULL,
	"average_rating" real DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"ranking_score" real DEFAULT 0 NOT NULL,
	"home_type" "home_type",
	"has_yard" boolean DEFAULT false NOT NULL,
	"yard_fenced" boolean DEFAULT false NOT NULL,
	"has_own_pets" boolean DEFAULT false NOT NULL,
	"smoke_free" boolean DEFAULT true NOT NULL,
	"max_concurrent_pets" integer DEFAULT 1 NOT NULL,
	"sin_encrypted" text,
	"tin_verified_at" timestamp with time zone,
	"date_of_birth" text,
	"gst_registered" boolean DEFAULT false NOT NULL,
	"gst_number" text,
	"stripe_account_id" text,
	"stripe_onboarded_at" timestamp with time zone,
	"promo_ends_at" timestamp with time zone,
	"referral_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activated_at" timestamp with time zone,
	"deactivated_at" timestamp with time zone,
	"deactivation_reason" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"phone" text,
	"phone_verified_at" timestamp with time zone,
	"locale" "locale" DEFAULT 'en-CA' NOT NULL,
	"role" "user_role" DEFAULT 'owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sitter_availability" (
	"sitter_id" uuid NOT NULL,
	"date" date NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"booked_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sitter_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sitter_id" uuid NOT NULL,
	"service_type" "service_type" NOT NULL,
	"price_cents" integer NOT NULL,
	"price_unit" "price_unit" NOT NULL,
	"extra_pet_price_cents" integer DEFAULT 0 NOT NULL,
	"holiday_surcharge_pct" real DEFAULT 0 NOT NULL,
	"cancellation_policy" "cancellation_policy" DEFAULT 'moderate' NOT NULL,
	"accepted_size_min_kg" real DEFAULT 0 NOT NULL,
	"accepted_size_max_kg" real DEFAULT 100 NOT NULL,
	"accepts_dogs" boolean DEFAULT true NOT NULL,
	"accepts_cats" boolean DEFAULT false NOT NULL,
	"accepts_other" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sitter_id" uuid NOT NULL,
	"type" "verification_type" NOT NULL,
	"status" "verification_status" DEFAULT 'not_started' NOT NULL,
	"provider" text,
	"provider_ref" text,
	"decision" text,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"automated_decision" boolean DEFAULT false NOT NULL,
	"human_review_requested_at" timestamp with time zone,
	"document_url" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pet_vaccinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"vaccine_type" text NOT NULL,
	"administered_on" date NOT NULL,
	"expires_on" date,
	"document_url" text,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"species" "species" NOT NULL,
	"breed" text,
	"birth_date" date,
	"weight_kg" real,
	"is_neutered" boolean,
	"microchip" text,
	"photo_url" text,
	"temperament_notes" text,
	"medication_notes" text,
	"vet_name" text,
	"vet_phone" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "booking_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"type" "booking_event_type" NOT NULL,
	"payload" jsonb,
	"media_url" text,
	"latitude" real,
	"longitude" real,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"sitter_id" uuid NOT NULL,
	"service_type" "service_type" NOT NULL,
	"status" "booking_status" DEFAULT 'draft' NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"units" integer NOT NULL,
	"pet_ids" jsonb NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"base_cents" integer NOT NULL,
	"extra_pet_cents" integer DEFAULT 0 NOT NULL,
	"holiday_cents" integer DEFAULT 0 NOT NULL,
	"add_ons_cents" integer DEFAULT 0 NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"owner_fee_cents" integer NOT NULL,
	"owner_tax_cents" integer NOT NULL,
	"owner_total_cents" integer NOT NULL,
	"attribution" "attribution" NOT NULL,
	"sitter_commission_pct" real NOT NULL,
	"sitter_commission_cents" integer NOT NULL,
	"sitter_commission_tax_cents" integer DEFAULT 0 NOT NULL,
	"sitter_payout_cents" integer NOT NULL,
	"promo_applied" boolean DEFAULT false NOT NULL,
	"province" "province" NOT NULL,
	"cancellation_policy" "cancellation_policy" NOT NULL,
	"special_instructions" text,
	"stripe_payment_intent_id" text,
	"stripe_transfer_id" text,
	"payout_release_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" text,
	"refund_cents" integer,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meet_and_greets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid,
	"owner_id" uuid NOT NULL,
	"sitter_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"location_type" text DEFAULT 'sitter_home' NOT NULL,
	"status" text DEFAULT 'proposed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid,
	"owner_id" uuid NOT NULL,
	"sitter_id" uuid NOT NULL,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" text NOT NULL,
	"body_redacted" text NOT NULL,
	"attachments" jsonb,
	"flagged_reason" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"direction" text NOT NULL,
	"rating" integer NOT NULL,
	"body" text,
	"locale" "locale" DEFAULT 'en-CA' NOT NULL,
	"response_body" text,
	"response_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"claimant_id" uuid NOT NULL,
	"type" "claim_type" NOT NULL,
	"status" "claim_status" DEFAULT 'submitted' NOT NULL,
	"amount_requested_cents" integer NOT NULL,
	"amount_approved_cents" integer,
	"deductible_cents" integer DEFAULT 25000 NOT NULL,
	"description" text NOT NULL,
	"decision_due_at" timestamp with time zone NOT NULL,
	"decided_at" timestamp with time zone,
	"decision_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"opened_by" uuid NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"sla_due_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sitter_id" uuid NOT NULL,
	"stripe_transfer_id" text,
	"amount_cents" integer NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug_en" text NOT NULL,
	"slug_fr" text NOT NULL,
	"name_en" text NOT NULL,
	"name_fr" text NOT NULL,
	"province" "province" NOT NULL,
	"centroid" "geography",
	"tier" integer DEFAULT 3 NOT NULL,
	"population" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landing_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" uuid,
	"neighbourhood_id" uuid,
	"service_type" "service_type" NOT NULL,
	"locale" "locale" NOT NULL,
	"sitter_count" integer DEFAULT 0 NOT NULL,
	"median_price_cents" integer,
	"p25_price_cents" integer,
	"p75_price_cents" integer,
	"booking_count" integer DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"avg_rating" real,
	"median_response_minutes" integer,
	"repeat_client_avg" real,
	"is_indexable" boolean DEFAULT false NOT NULL,
	"last_computed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "neighbourhoods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" uuid NOT NULL,
	"slug_en" text NOT NULL,
	"slug_fr" text NOT NULL,
	"name_en" text NOT NULL,
	"name_fr" text NOT NULL,
	"boundary" "geography",
	"centroid" "geography"
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"before" jsonb,
	"after" jsonb,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automated_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"decision_type" text NOT NULL,
	"outcome" text NOT NULL,
	"factors" jsonb NOT NULL,
	"notified_at" timestamp with time zone,
	"human_review_requested_at" timestamp with time zone,
	"human_reviewed_at" timestamp with time zone,
	"human_reviewer_id" uuid,
	"human_review_outcome" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"anonymous_id" text,
	"type" "consent_type" NOT NULL,
	"granted" boolean NOT NULL,
	"locale_shown" "locale" NOT NULL,
	"version" text NOT NULL,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident_register" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"description" text NOT NULL,
	"affected_user_count" integer,
	"affected_user_ids" jsonb,
	"rrosh_assessment" text,
	"rrosh_met" boolean,
	"reported_to_opc_at" timestamp with time zone,
	"reported_to_cai_at" timestamp with time zone,
	"notified_individuals_at" timestamp with time zone,
	"detected_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retain_until" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sitter_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"quarter" integer NOT NULL,
	"gross_cents" integer NOT NULL,
	"commission_cents" integer NOT NULL,
	"tax_withheld_cents" integer DEFAULT 0 NOT NULL,
	"transaction_count" integer NOT NULL,
	"reported_to_cra_at" timestamp with time zone,
	"copy_sent_to_sitter_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sitters" ADD CONSTRAINT "sitters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sitter_availability" ADD CONSTRAINT "sitter_availability_sitter_id_sitters_user_id_fk" FOREIGN KEY ("sitter_id") REFERENCES "public"."sitters"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sitter_services" ADD CONSTRAINT "sitter_services_sitter_id_sitters_user_id_fk" FOREIGN KEY ("sitter_id") REFERENCES "public"."sitters"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_sitter_id_sitters_user_id_fk" FOREIGN KEY ("sitter_id") REFERENCES "public"."sitters"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_vaccinations" ADD CONSTRAINT "pet_vaccinations_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_sitter_id_sitters_user_id_fk" FOREIGN KEY ("sitter_id") REFERENCES "public"."sitters"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_and_greets" ADD CONSTRAINT "meet_and_greets_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_and_greets" ADD CONSTRAINT "meet_and_greets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_and_greets" ADD CONSTRAINT "meet_and_greets_sitter_id_sitters_user_id_fk" FOREIGN KEY ("sitter_id") REFERENCES "public"."sitters"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_sitter_id_sitters_user_id_fk" FOREIGN KEY ("sitter_id") REFERENCES "public"."sitters"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_subject_id_users_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_claimant_id_users_id_fk" FOREIGN KEY ("claimant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_sitter_id_sitters_user_id_fk" FOREIGN KEY ("sitter_id") REFERENCES "public"."sitters"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_neighbourhood_id_neighbourhoods_id_fk" FOREIGN KEY ("neighbourhood_id") REFERENCES "public"."neighbourhoods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neighbourhoods" ADD CONSTRAINT "neighbourhoods_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automated_decisions" ADD CONSTRAINT "automated_decisions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_reports" ADD CONSTRAINT "tax_reports_sitter_id_sitters_user_id_fk" FOREIGN KEY ("sitter_id") REFERENCES "public"."sitters"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profiles_geo_idx" ON "profiles" USING gist ("approx_location");--> statement-breakpoint
CREATE INDEX "profiles_city_idx" ON "profiles" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "sitters_status_idx" ON "sitters" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sitters_ranking_idx" ON "sitters" USING btree ("ranking_score");--> statement-breakpoint
CREATE UNIQUE INDEX "sitters_referral_code_uq" ON "sitters" USING btree ("referral_code");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "availability_uq" ON "sitter_availability" USING btree ("sitter_id","date");--> statement-breakpoint
CREATE INDEX "availability_lookup" ON "sitter_availability" USING btree ("sitter_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "sitter_service_uq" ON "sitter_services" USING btree ("sitter_id","service_type");--> statement-breakpoint
CREATE INDEX "sitter_services_lookup" ON "sitter_services" USING btree ("service_type","is_active");--> statement-breakpoint
CREATE INDEX "verifications_sitter_idx" ON "verifications" USING btree ("sitter_id","type");--> statement-breakpoint
CREATE INDEX "vaccinations_pet_idx" ON "pet_vaccinations" USING btree ("pet_id");--> statement-breakpoint
CREATE INDEX "vaccinations_expiry_idx" ON "pet_vaccinations" USING btree ("expires_on");--> statement-breakpoint
CREATE INDEX "pets_owner_idx" ON "pets" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "booking_events_booking_idx" ON "booking_events" USING btree ("booking_id","created_at");--> statement-breakpoint
CREATE INDEX "bookings_sitter_time_idx" ON "bookings" USING btree ("sitter_id","start_at","end_at");--> statement-breakpoint
CREATE INDEX "bookings_owner_idx" ON "bookings" USING btree ("owner_id","start_at");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_payout_idx" ON "bookings" USING btree ("payout_release_at");--> statement-breakpoint
CREATE INDEX "bookings_pair_idx" ON "bookings" USING btree ("owner_id","sitter_id","status");--> statement-breakpoint
CREATE INDEX "mng_sitter_idx" ON "meet_and_greets" USING btree ("sitter_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "conversations_participants_idx" ON "conversations" USING btree ("owner_id","sitter_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "reviews_subject_idx" ON "reviews" USING btree ("subject_id","published_at");--> statement-breakpoint
CREATE INDEX "reviews_booking_idx" ON "reviews" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "claims_sla_idx" ON "claims" USING btree ("decision_due_at","status");--> statement-breakpoint
CREATE INDEX "disputes_sla_idx" ON "disputes" USING btree ("sla_due_at","status");--> statement-breakpoint
CREATE INDEX "payouts_sitter_idx" ON "payouts" USING btree ("sitter_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cities_slug_en_uq" ON "cities" USING btree ("slug_en","province");--> statement-breakpoint
CREATE UNIQUE INDEX "cities_slug_fr_uq" ON "cities" USING btree ("slug_fr","province");--> statement-breakpoint
CREATE INDEX "cities_tier_idx" ON "cities" USING btree ("tier");--> statement-breakpoint
CREATE UNIQUE INDEX "landing_uq" ON "landing_pages" USING btree ("city_id","neighbourhood_id","service_type","locale");--> statement-breakpoint
CREATE INDEX "landing_indexable_idx" ON "landing_pages" USING btree ("is_indexable","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "neighbourhoods_slug_uq" ON "neighbourhoods" USING btree ("city_id","slug_en");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_log" USING btree ("entity","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "automated_decisions_user_idx" ON "automated_decisions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "consent_user_idx" ON "consent_records" USING btree ("user_id","type","created_at");--> statement-breakpoint
CREATE INDEX "incident_detected_idx" ON "incident_register" USING btree ("detected_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_report_uq" ON "tax_reports" USING btree ("sitter_id","year","quarter");