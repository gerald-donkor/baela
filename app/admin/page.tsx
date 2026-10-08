import { requireAdminPage } from "@/lib/auth/server";
import { getStudioOverview } from "@/lib/server/studio";
import { isImageKitConfigured } from "@/lib/server/imagekit";
import { StudioDashboard } from "@/components/admin/studio-dashboard";

export default async function Admin() {
  await requireAdminPage();
  const { items, studentCount } = await getStudioOverview();
  return (
    <StudioDashboard
      items={items.map((course) => ({
        ...course,
        createdAt: course.createdAt.toISOString(),
      }))}
      studentCount={studentCount}
      imagekitReady={isImageKitConfigured()}
    />
  );
}
