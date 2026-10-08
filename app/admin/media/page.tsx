import { desc } from "drizzle-orm";
import { requireAdminPage } from "@/lib/auth/server";
import { withDb } from "@/lib/db";
import { assets } from "@/lib/db/schema";
import { isImageKitConfigured } from "@/lib/server/imagekit";
import { MediaLibrary } from "@/components/admin/media-library";
import { StudioHeading } from "@/components/admin/studio-ui";
import styles from "@/components/admin/studio.module.css";
import Link from "next/link";

export default async function MediaPage() {
  await requireAdminPage();
  const items = await withDb((db) =>
    db
      .select({
        id: assets.id,
        name: assets.name,
        kind: assets.kind,
        ready: assets.ready,
        duration: assets.duration,
        size: assets.size,
      })
      .from(assets)
      .orderBy(desc(assets.createdAt)),
  );
  return (
    <>
      <StudioHeading
        title="Media library"
        description="Your course videos, images, and resources, all together."
      />
      {!isImageKitConfigured() && (
        <p className={`${styles.notice} mb-6`}>
          ImageKit setup is needed before you can upload files.{" "}
          <Link href="/admin/settings" className="text-primary underline">
            View setup details
          </Link>
          .
        </p>
      )}
      <MediaLibrary assets={items} />
    </>
  );
}
