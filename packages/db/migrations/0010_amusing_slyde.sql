CREATE TYPE "public"."sitter_photo_kind" AS ENUM('home', 'pet');--> statement-breakpoint
ALTER TABLE "sitter_photos" ADD COLUMN "kind" "sitter_photo_kind" DEFAULT 'home' NOT NULL;