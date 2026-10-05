import { businessProfile } from "@/lib/server/catalog";
export const metadata = { title: "Support" };
export default async function Support() {
  const business = await businessProfile();
  const email = business?.supportEmail || process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return (
    <div className="shell max-w-2xl py-16">
      <p className="eyebrow">Here to help</p>
      <h1 className="text-4xl font-medium mt-3">A little support.</h1>
      <p className="text-muted-foreground my-6">
        For purchase questions, learning access, or a technical issue, get in
        touch. Refund requests can be submitted from your account.
      </p>
      {email ? (
        <a className="text-primary underline" href={"mailto:" + email}>
          {email}
        </a>
      ) : (
        <p>Support details will be published before enrollment opens.</p>
      )}
    </div>
  );
}
