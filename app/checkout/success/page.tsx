import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth/server";
import { CheckoutStatus } from "@/components/checkout-status";
export const metadata = {
  title: "Purchase confirmation",
  robots: { index: false, follow: false },
};
export default async function Success({
  searchParams,
}: {
  searchParams: Promise<{ checkout_id?: string }>;
}) {
  if (!(await getViewer())) redirect("/auth/sign-in");
  const query = await searchParams;
  return <CheckoutStatus checkoutId={query.checkout_id || ""} />;
}
