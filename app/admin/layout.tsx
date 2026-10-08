import { requireAdminPage } from "@/lib/auth/server";
import { StudioShell } from "@/components/admin/studio-shell";
export const metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdminPage();
  return <StudioShell name={user.name}>{children}</StudioShell>;
}
