DROP INDEX "conversations_participants_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_pair_uq" ON "conversations" USING btree ("owner_id","sitter_id");--> statement-breakpoint
CREATE INDEX "conversations_recent_idx" ON "conversations" USING btree ("last_message_at");