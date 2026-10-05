import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getViewer } from "@/lib/auth/server";
export const metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getViewer();
  if (!user) redirect("/auth/sign-in?next=/admin");
  if (!user.admin) notFound();
  return (
    <div className="shell py-10">
      <div className="flex flex-wrap justify-between items-center gap-5 border-b pb-6 mb-8">
        <h1 className="text-2xl font-medium">Baela studio</h1>
        <nav aria-label="Administration" className="flex gap-5 text-sm">
          <Link href="/admin">Courses</Link>
          <Link href="/admin/users">Students</Link>
          <Link href="/admin/refunds">Refunds</Link>
          <Link href="/admin/settings">Settings</Link>
          <Link href="/admin/jobs">Jobs</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
