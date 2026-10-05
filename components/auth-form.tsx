"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Button } from "./ui/button";
export function AuthForm({
  view,
  next,
  token,
  enabled,
}: {
  view: string;
  next: string;
  token?: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || ""),
      password = String(data.get("password") || "");
    try {
      const result =
        view === "sign-up"
          ? await authClient.signUp.email({
              email,
              password,
              name: String(data.get("name")),
              callbackURL: next,
            })
          : view === "forgot-password"
            ? await authClient.requestPasswordReset({
                email,
                redirectTo:
                  location.origin +
                  "/auth/reset-password?next=" +
                  encodeURIComponent(next),
              })
            : view === "reset-password"
              ? await authClient.resetPassword({
                  newPassword: password,
                  token: token || "",
                })
              : await authClient.signIn.email({
                  email,
                  password,
                  callbackURL: next,
                });
      if (result.error)
        throw new Error(result.error.message || "Unable to sign in.");
      if (view === "sign-up")
        setMessage("Check your email to verify your account, then sign in.");
      else if (view === "forgot-password")
        setMessage(
          "If an account exists for that email, a recovery link is on its way.",
        );
      else if (view === "reset-password")
        router.push("/auth/sign-in?next=" + encodeURIComponent(next));
      else {
        router.push(next);
        router.refresh();
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function social(provider: "google" | "github") {
    setBusy(true);
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: next,
      });
      if (result.error) throw new Error(result.error.message);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Sign-in failed.");
      setBusy(false);
    }
  }
  const title =
    view === "sign-up"
      ? "A new chapter starts here."
      : view === "forgot-password"
        ? "Let’s get you back in."
        : view === "reset-password"
          ? "Choose a new password."
          : "Welcome back.";
  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <p className="eyebrow">Your learning, your pace</p>
      <h1 className="text-3xl tracking-tight font-medium mt-3 mb-7">{title}</h1>
      {!enabled ? (
        <p className="rounded-xl bg-secondary p-5 text-sm">
          Student accounts will open when enrollment begins. Please check back
          soon.
        </p>
      ) : (
        <>
          <form className="space-y-5" onSubmit={submit}>
            {view === "sign-up" && (
              <label className="field-label">
                Your name
                <input
                  className="field"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={120}
                />
              </label>
            )}
            {view !== "reset-password" && (
              <label className="field-label">
                Email
                <input
                  className="field"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
            )}
            {view !== "forgot-password" && (
              <label className="field-label">
                Password
                <input
                  className="field"
                  name="password"
                  type="password"
                  autoComplete={
                    view === "sign-in" ? "current-password" : "new-password"
                  }
                  required
                  minLength={8}
                />
              </label>
            )}
            <Button className="w-full" disabled={busy}>
              {busy
                ? "One moment…"
                : view === "sign-up"
                  ? "Create account"
                  : view === "forgot-password"
                    ? "Send recovery link"
                    : view === "reset-password"
                      ? "Save new password"
                      : "Sign in"}
            </Button>
          </form>
          {["sign-in", "sign-up"].includes(view) && (
            <>
              <div className="flex items-center gap-3 my-6 text-xs text-muted-foreground">
                <span className="h-px bg-border flex-1" />
                or continue with
                <span className="h-px bg-border flex-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => social("google")}
                >
                  Google
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => social("github")}
                >
                  GitHub
                </Button>
              </div>
              <div className="text-sm flex justify-between gap-3 mt-6">
                <Link
                  href={
                    (view === "sign-in" ? "/auth/sign-up" : "/auth/sign-in") +
                    "?next=" +
                    encodeURIComponent(next)
                  }
                >
                  {view === "sign-in"
                    ? "Create an account"
                    : "Already have an account?"}
                </Link>
                <Link
                  href={
                    "/auth/forgot-password?next=" + encodeURIComponent(next)
                  }
                >
                  Forgot password?
                </Link>
              </div>
            </>
          )}
          {message && (
            <p
              role="status"
              className="mt-5 text-sm rounded-xl bg-secondary p-4"
            >
              {message}
            </p>
          )}
        </>
      )}
    </div>
  );
}
