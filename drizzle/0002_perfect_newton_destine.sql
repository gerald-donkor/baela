ALTER TABLE "assets" ADD COLUMN "height" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_revisions" ADD COLUMN "image_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;