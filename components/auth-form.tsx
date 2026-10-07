"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { AuthVisual } from "./auth/auth-visual";
import { Button } from "./ui/button";
import styles from "./auth/auth.module.css";
export function AuthForm({
  view,
  next,
  token,
  enabled,
  oauthError,
}: {
  view: string;
  next: string;
  token?: string;
  enabled: boolean;
  oauthError: boolean;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(
      oauthError ? "Sign-in couldn’t be completed. Please try again." : "",
    );
  const [busyProvider, setBusyProvider] = useState<"google" | "github" | null>(
    null,
  );
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
              callbackURL: new URL(next, window.location.origin).href,
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
                  callbackURL: new URL(next, window.location.origin).href,
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
    setBusyProvider(provider);
    setMessage("");
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: new URL(next, window.location.origin).href,
        errorCallbackURL: new URL(
          "/auth/sign-in?next=" + encodeURIComponent(next),
          window.location.origin,
        ).href,
      });
      if (result.error)
        throw new Error(
          result.error.message || "Sign-in failed. Please try again.",
        );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Sign-in failed.");
      setBusy(false);
      setBusyProvider(null);
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
  const description =
    view === "sign-up"
      ? "Make a little room for something new. Create your learning space."
      : view === "forgot-password"
        ? "Enter your email and we’ll send you a link to reset your password."
        : view === "reset-password"
          ? "Choose a password with at least 8 characters to secure your account."
          : "Your next chapter is right where you left it. Sign in to keep learning.";
  const signInHref = "/auth/sign-in?next=" + encodeURIComponent(next);
  return (
    <section className={styles.layout} aria-labelledby="auth-title">
      <AuthVisual />
      <div className={styles.formPanel}>
        <h1 id="auth-title" className={styles.formTitle}>
          {title}
        </h1>
        <p className={styles.formDescription}>{description}</p>
        {!enabled ? (
          <p className={styles.message}>
            Student accounts will open when enrollment begins. Please check back
            soon.
          </p>
        ) : (
          <>
            <form className={styles.form} onSubmit={submit}>
              {view === "sign-up" && (
                <label className={styles.fieldGroup}>
                  Your name
                  <input
                    className={`field ${styles.input}`}
                    name="name"
                    placeholder="Your name"
                    autoComplete="name"
                    required
                    maxLength={120}
                  />
                </label>
              )}
              {view !== "reset-password" && (
                <label className={styles.fieldGroup}>
                  Email
                  <input
                    className={`field ${styles.input}`}
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </label>
              )}
              {view !== "forgot-password" && (
                <div className={styles.fieldGroup}>
                  <div className={styles.fieldHeader}>
                    <label htmlFor="auth-password">Password</label>
                    {view === "sign-in" && (
                      <Link
                        href={
                          "/auth/forgot-password?next=" +
                          encodeURIComponent(next)
                        }
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className={styles.password}>
                    <input
                      id="auth-password"
                      className={`field ${styles.input}`}
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={
                        view === "sign-in"
                          ? "Enter your password"
                          : "At least 8 characters"
                      }
                      autoComplete={
                        view === "sign-in" ? "current-password" : "new-password"
                      }
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff
                          size={16}
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              )}
              <Button
                className={styles.submit}
                disabled={busy}
                aria-busy={busy}
              >
                {busy
                  ? "One moment…"
                  : view === "sign-up"
                    ? "Create account"
                    : view === "forgot-password"
                      ? "Send recovery link"
                      : view === "reset-password"
                        ? "Save new password"
                        : "Sign in"}
                {!busy && (
                  <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" />
                )}
              </Button>
            </form>
            {["sign-in", "sign-up"].includes(view) && (
              <>
                <div className={styles.divider}>
                  <span />
                  or continue with
                  <span />
                </div>
                <div className={styles.providers}>
                  <Button
                    className={styles.provider}
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => social("google")}
                  >
                    <Image
                      src="/images/auth/google.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 shrink-0 rounded-full bg-white"
                    />
                    {busyProvider === "google" ? "Connecting…" : "Google"}
                  </Button>
                  <Button
                    className={styles.provider}
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => social("github")}
                  >
                    <Image
                      src="/images/auth/github-black.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 shrink-0 dark:hidden"
                    />
                    <Image
                      src="/images/auth/github-white.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="hidden size-5 shrink-0 dark:block"
                    />
                    {busyProvider === "github" ? "Connecting…" : "GitHub"}
                  </Button>
                </div>
                <p className={styles.accountLink}>
                  {view === "sign-in"
                    ? "New to Baela?"
                    : "Already have an account?"}
                  <Link
                    href={
                      (view === "sign-in" ? "/auth/sign-up" : "/auth/sign-in") +
                      "?next=" +
                      encodeURIComponent(next)
                    }
                  >
                    {view === "sign-in" ? "Create an account" : "Sign in"}
                  </Link>
                </p>
              </>
            )}
            {message && (
              <p role="status" className={styles.message}>
                {message}
              </p>
            )}
          </>
        )}
        {["forgot-password", "reset-password"].includes(view) && (
          <Link href={signInHref} className={styles.backLink}>
            <ArrowLeft size={14} aria-hidden="true" /> Back to sign in
          </Link>
        )}
      </div>
    </section>
  );
}
