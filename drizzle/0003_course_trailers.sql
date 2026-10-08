ALTER TABLE "courses" ADD COLUMN "trailer_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "trailer_draft_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_trailer_asset_id_assets_id_fk" FOREIGN KEY ("trailer_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_trailer_draft_asset_id_assets_id_fk" FOREIGN KEY ("trailer_draft_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;