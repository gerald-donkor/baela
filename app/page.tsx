import Link from "next/link";
import {
  ArrowRight,
  Check,
  Play,
  BookOpen,
  Infinity as InfinityIcon,
} from "lucide-react";
import { catalog, allAccessOffers, grantsFor } from "@/lib/server/catalog";
import { getViewer } from "@/lib/auth/server";
import { withDb } from "@/lib/db";
import { evaluateAccess } from "@/lib/domain/access";
import { launchPrices } from "@/lib/config";
import { money } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { CheckoutButton } from "@/components/checkout-button";
export default async function Home() {
  const [items, plans, user] = await Promise.all([
    catalog(),
    allAccessOffers(),
    getViewer(),
  ]);
  const grants = user ? await withDb((db) => grantsFor(db, user.id)) : [];
  const access = evaluateAccess("", false, true, grants);
  return (
    <>
      <section className="shell grid lg:grid-cols-[1.1fr_.9fr] gap-14 items-center py-20 lg:py-28">
        <div>
          <p className="eyebrow mb-6">Stay curious. Keep growing.</p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl tracking-[-.055em] leading-[1.07] font-medium max-w-2xl">
            Make room for your{" "}
            <span className="text-primary">next chapter.</span>
          </h1>
          <p className="mt-7 text-lg leading-relaxed text-muted-foreground max-w-lg">
            Thoughtful courses. Practical lessons. A place to turn your
            curiosity into something you can do.
          </p>
          <div className="flex flex-wrap gap-3 mt-9">
            <Button asChild size="lg">
              <Link href="#courses">
                Explore courses <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="#pricing">Find your plan</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Learn at your pace. Pick up where you left off.
          </p>
        </div>
        <div
          className="relative p-8 sm:p-12 rounded-[2rem] bg-secondary overflow-hidden min-h-96 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="absolute size-80 rounded-full border border-primary/15 -right-20 -top-20" />
          <div className="relative bg-card border w-full max-w-sm rounded-2xl shadow-xl p-6 -rotate-3">
            <div className="course-art rounded-xl h-36 flex items-center justify-center">
              <span className="rounded-full bg-card size-14 flex items-center justify-center shadow-sm">
                <Play className="size-5 text-primary fill-primary" />
              </span>
            </div>
            <div className="mt-5 text-xs text-primary uppercase tracking-widest">
              One lesson at a time
            </div>
            <div className="mt-2 text-xl font-medium">
              Small steps. Real progress.
            </div>
            <div className="h-1.5 bg-secondary mt-6 rounded-full">
              <div className="h-full w-3/5 bg-primary rounded-full" />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Your next chapter starts here
            </p>
          </div>
        </div>
      </section>
      <div className="border-y bg-card">
        <div className="shell grid sm:grid-cols-3 gap-6 py-7">
          {[
            { icon: BookOpen, label: "Clear, focused lessons" },
            { icon: Play, label: "Watch on your schedule" },
            { icon: InfinityIcon, label: "Keep coming back" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center justify-center gap-3 text-sm"
            >
              <Icon className="size-5 text-primary" />
              {label}
            </div>
          ))}
        </div>
      </div>
      <section id="courses" className="shell py-20">
        <div className="mb-9">
          <p className="eyebrow">The course collection</p>
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mt-3">
            Find your next starting point.
          </h2>
        </div>
        {items.length ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(({ course, offer }) => (
              <CourseCard
                key={course.id}
                course={course}
                amount={offer?.amount}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <BookOpen className="size-8 mx-auto text-primary mb-4" />
            <h3 className="text-xl font-medium">
              Good things are taking shape.
            </h3>
            <p className="mt-2 text-muted-foreground">
              The first courses will appear here when they’re ready.
            </p>
          </div>
        )}
      </section>
      <section id="pricing" className="shell pb-10">
        <div className="text-center mb-10">
          <p className="eyebrow">Room for every kind of learner</p>
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mt-3">
            Choose how you learn.
          </h2>
          <p className="text-muted-foreground mt-4">
            Start with one course, or make the whole collection yours.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {(["course", "monthly", "lifetime"] as const).map((kind) => {
            const plan = plans.find((p) => p.kind === kind);
            const owned =
              access.reason === "lifetime" ||
              (kind === "monthly" && access.reason === "monthly");
            return (
              <div
                key={kind}
                className={
                  "rounded-2xl p-7 border flex flex-col " +
                  (kind === "monthly"
                    ? "bg-secondary border-primary/30"
                    : "bg-card")
                }
              >
                <p className="eyebrow">
                  {kind === "course"
                    ? "A focused start"
                    : kind === "monthly"
                      ? "Keep exploring"
                      : "Yours for the long run"}
                </p>
                <h3 className="text-xl font-medium mt-3">
                  {kind === "course"
                    ? "One course"
                    : kind === "monthly"
                      ? "All-access monthly"
                      : "Lifetime access"}
                </h3>
                <p className="mt-6">
                  <span className="text-4xl tracking-tight font-medium">
                    {money(plan?.amount || launchPrices[kind])}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {kind === "monthly" ? " / month" : " once"}
                  </span>
                </p>
                <ul className="space-y-3 text-sm mt-7 mb-8 flex-1">
                  {(kind === "course"
                    ? [
                        "One course, yours forever",
                        "Future updates included",
                        "Learn at your own pace",
                      ]
                    : kind === "monthly"
                      ? [
                          "Every course in the collection",
                          "New courses as they arrive",
                          "Cancel renewal anytime",
                        ]
                      : [
                          "Every current and future course",
                          "One payment, ongoing learning",
                          "No subscription to manage",
                        ]
                  ).map((t) => (
                    <li key={t} className="flex gap-2">
                      <Check className="size-4 text-primary shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
                {kind === "course" ? (
                  <Button variant="outline" asChild>
                    <Link href={access.allowed ? "/dashboard" : "#courses"}>
                      {access.allowed
                        ? "Go to your learning"
                        : "Choose a course"}
                    </Link>
                  </Button>
                ) : owned ? (
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">You have access</Link>
                  </Button>
                ) : (
                  <CheckoutButton offerId={plan?.id} className="w-full">
                    {kind === "monthly"
                      ? "Start exploring"
                      : "Get lifetime access"}
                  </CheckoutButton>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-5">
          Prices in USD. Any applicable taxes are calculated at checkout.
        </p>
      </section>
    </>
  );
}
