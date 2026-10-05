import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};
export default async function AuthPage({
  params,
  searchParams,
}: {
  params: Promise<{ view: string }>;
  searchParams: Promise<{ next?: string; token?: string }>;
}) {
  const { view } = await params,
    query = await searchParams;
  if (
    !["sign-in", "sign-up", "forgot-password", "reset-password"].includes(view)
  )
    notFound();
  const next =
    query.next?.startsWith("/") &&
    !query.next.startsWith("//") &&
    !query.next.includes("\\")
      ? query.next
      : "/dashboard";
  return (
    <AuthForm
      view={view}
      next={next}
      token={query.token}
      enabled={!!process.env.NEON_AUTH_BASE_URL}
    />
  );
}
