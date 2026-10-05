"use client";
import { accountCommand } from "@/app/account/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { money } from "@/lib/utils";
import { Button } from "./ui/button";
export function AccountPanel({
  state,
  admin,
  orders,
  requests,
}: {
  state: string;
  admin: boolean;
  orders: {
    id: string;
    amount: number;
    refunded: number;
    currency: string;
    paid: boolean;
  }[];
  requests: {
    id: string;
    orderId: string;
    status: string;
    reason: string;
    response: string;
  }[];
}) {
  const router = useRouter(),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [deleting, setDeleting] = useState(false);
  async function act(body: unknown) {
    setBusy(true);
    setMessage("");
    try {
      const { ok, data } = await accountCommand(body);
      if (!ok) throw new Error(data.error);
      if (data.customer_portal_url) location.href = data.customer_portal_url;
      else {
        setMessage(
          data.pending
            ? "Deletion is pending while we stop subscription renewal. You won’t be charged for a new period once cancellation is confirmed."
            : "Your request has been saved.",
        );
        router.refresh();
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-8">
      {state === "deleting" && (
        <p className="p-5 bg-secondary rounded-xl" role="status">
          Your account deletion is pending. We’re confirming cancellation before
          removing the account.
        </p>
      )}
      <section className="border rounded-2xl p-6">
        <h2 className="text-xl font-medium">Billing & account</h2>
        <p className="text-muted-foreground mt-2 mb-5">
          Manage your subscription and payment details securely in Polar.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button disabled={busy} onClick={() => act({ action: "portal" })}>
            Manage billing
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await authClient.signOut();
              router.push("/");
              router.refresh();
            }}
          >
            Sign out
          </Button>
        </div>
      </section>
      <section className="border rounded-2xl p-6">
        <h2 className="text-xl font-medium mb-5">Request a refund</h2>
        {orders.filter((o) => o.paid && o.refunded < o.amount).length ? (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              void act({
                action: "refund",
                orderId: data.get("orderId"),
                reason: data.get("reason"),
              });
            }}
          >
            <label className="field-label">
              Purchase
              <select name="orderId" className="field" required>
                {orders
                  .filter((o) => o.paid && o.refunded < o.amount)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {money(o.amount, o.currency)} · {o.id.slice(0, 8)}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field-label">
              Tell us what happened
              <textarea
                className="field"
                name="reason"
                minLength={10}
                maxLength={2000}
                required
                rows={4}
              />
            </label>
            <Button disabled={busy} className="justify-self-start">
              Submit request
            </Button>
          </form>
        ) : (
          <p className="text-muted-foreground">
            No purchases are available for a refund request.
          </p>
        )}
      </section>
      {requests.length > 0 && (
        <section>
          <h2 className="text-xl font-medium mb-4">Your requests</h2>
          <div className="space-y-3">
            {requests.map((r) => (
              <article key={r.id} className="border rounded-xl p-5">
                <div className="flex justify-between gap-4">
                  <p className="font-medium">Order {r.orderId.slice(0, 8)}</p>
                  <span className="text-sm text-primary capitalize">
                    {r.status === "partial" ? "Partially refunded" : r.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-3">{r.reason}</p>
                {r.response && (
                  <p className="text-sm mt-4 bg-secondary p-4 rounded-lg">
                    {r.response}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      {!admin && state === "active" && (
        <section className="border rounded-2xl p-6">
          <h2 className="text-xl font-medium">Delete account</h2>
          <p className="text-muted-foreground text-sm mt-2 mb-4">
            This removes your account, learning progress, and course access
            after subscription renewal is stopped. It does not issue a refund.
          </p>
          {deleting ? (
            <form
              className="flex gap-3 flex-wrap"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                void act({
                  action: "delete",
                  confirmation: data.get("confirmation"),
                });
              }}
            >
              <label className="field-label">
                Type DELETE to confirm
                <input
                  name="confirmation"
                  className="field"
                  pattern="DELETE"
                  required
                  autoComplete="off"
                />
              </label>
              <Button
                disabled={busy}
                variant="destructive"
                className="self-end"
              >
                Permanently delete account
              </Button>
            </form>
          ) : (
            <Button variant="outline" onClick={() => setDeleting(true)}>
              Delete my account
            </Button>
          )}
        </section>
      )}
      {message && (
        <p role="status" className="rounded-xl bg-secondary p-4 text-sm">
          {message}
        </p>
      )}
    </div>
  );
}
