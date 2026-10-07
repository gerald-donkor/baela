import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { isAuthConfigured } from "@/lib/auth/instance";
import { getAuthRedirect } from "@/lib/auth/redirect";
export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};
export default async function AuthPage({
  params,
  searchParams,
}: {
  params: Promise<{ view: string }>;
  searchParams: Promise<{ next?: string; token?: string; error?: string }>;
}) {
  const { view } = await params,
    query = await searchParams;
  if (
    !["sign-in", "sign-up", "forgot-password", "reset-password"].includes(view)
  )
    notFound();
  return (
    <AuthForm
      view={view}
      next={getAuthRedirect(query.next)}
      token={query.token}
      enabled={isAuthConfigured()}
      oauthError={!!query.error}
    />
  );
}
