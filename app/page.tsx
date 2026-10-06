import Link from "next/link";
import {
  ArrowRight,
  Check,
  Play,
  BookOpen,
  Infinity as InfinityIcon,
  Sparkles,
  Clock3,
  Compass,
  Layers3,
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { LearningDemo } from "@/components/landing/learning-demo";
import { DeveloperReviews } from "@/components/landing/developer-reviews";
import { LearningFaq } from "@/components/landing/learning-faq";
import styles from "./page.module.css";
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
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.atmosphere} aria-hidden="true">
          <div className={styles.beams} />
          <div className={styles.horizonClip}>
            <div className={styles.horizon} />
          </div>
          <div className={styles.stars} />
        </div>
        <div className={styles.heroContent}>
          <Badge className={styles.heroBadge}>
            <Sparkles className="size-3.5" /> A new horizon for learning{" "}
            <ArrowRight className="size-3" />
          </Badge>
          <h1 id="hero-title">
            Make room for your
            <br />
            <span>next chapter.</span>
          </h1>
          <p>
            Thoughtful courses. Practical lessons. A space to turn
            <br className="hidden sm:block" /> your curiosity into something you
            can do.
          </p>
          <div className={styles.heroActions}>
            <Button asChild size="lg">
              <Link href="#courses">
                Explore courses <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#demo">
                <Play className="size-3.5" /> Try the demo
              </Link>
            </Button>
          </div>
          <div className={styles.heroNote}>
            <span /> At your pace. On your terms.
          </div>
        </div>
        <LearningDemo />
      </section>
      <div className={styles.valueStrip}>
        <p>A little curiosity. A world of possibility.</p>
        <div className="shell grid gap-5 sm:grid-cols-3">
          {[
            { icon: BookOpen, label: "Clear, focused lessons" },
            { icon: Clock3, label: "Learn on your schedule" },
            { icon: InfinityIcon, label: "Knowledge that stays with you" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center justify-center gap-2.5 text-xs text-muted-foreground"
            >
              <Icon className="size-4 text-primary" strokeWidth={1.5} />
              {label}
            </div>
          ))}
        </div>
      </div>
      <section id="how-it-works" className="shell py-20 sm:py-24">
        <SectionHeading
          eyebrow="Built around the way you learn"
          title="Less friction. More possibility."
          description="A calm space for focused learning, from your first spark of curiosity to the moment it clicks."
          centered
        />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Compass,
              number: "01",
              title: "Follow your curiosity",
              text: "Find a course that speaks to you. Start with one idea, one question, one new possibility.",
            },
            {
              icon: Layers3,
              number: "02",
              title: "Take it one lesson at a time",
              text: "Clear, practical lessons make the next step feel manageable. Pause, revisit, and learn at your pace.",
            },
            {
              icon: Sparkles,
              number: "03",
              title: "See how far you can go",
              text: "Put what you learn into practice. Track your progress and pick up right where you left off.",
            },
          ].map(({ icon: Icon, number, title, text }) => (
            <Card key={number} className={styles.featureCard}>
              <div className="flex items-center justify-between">
                <span className={styles.featureIcon}>
                  <Icon className="size-5" strokeWidth={1.5} />
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {number}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-medium tracking-tight">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {text}
              </p>
            </Card>
          ))}
        </div>
      </section>
      <section id="courses" className="shell py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-5 mb-10">
          <SectionHeading
            className="mb-0"
            eyebrow="The course collection"
            title="Find your next starting point."
            description="New perspectives. Practical skills. Your kind of learning."
          />
          <Badge variant="muted">
            <BookOpen className="size-3" />{" "}
            {items.length
              ? `${items.length} ${items.length === 1 ? "course" : "courses"} to explore`
              : "The first chapter is coming"}
          </Badge>
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
          <div className={styles.emptyCourses}>
            <BookOpen className="size-7 mx-auto text-primary mb-5" />
            <h3 className="text-xl font-medium">
              Good things are taking shape.
            </h3>
            <p className="mt-2 text-muted-foreground">
              The first courses will appear here when they’re ready.
            </p>
            <p className="mt-5 text-xs text-muted-foreground">
              In the meantime, explore what learning here feels like.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-5">
              <Link href="#demo">
                Explore the demo <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>
        )}
      </section>
      <DeveloperReviews />
      <section id="pricing" className="shell pt-16 pb-10 sm:pt-24">
        <SectionHeading
          eyebrow="Room for every kind of learner"
          title="Choose how you learn."
          description="Start with one course, or make the whole collection yours."
          centered
        />
        <div className="grid md:grid-cols-3 gap-5">
          {(["course", "monthly", "lifetime"] as const).map((kind) => {
            const plan = plans.find((p) => p.kind === kind);
            const owned =
              access.reason === "lifetime" ||
              (kind === "monthly" && access.reason === "monthly");
            return (
              <Card
                key={kind}
                className={
                  kind === "monthly" ? styles.featuredPlan : styles.plan
                }
              >
                {kind === "monthly" && (
                  <Badge className={styles.planBadge}>
                    A little more possibility
                  </Badge>
                )}
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
              </Card>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-5">
          Prices in USD. Any applicable taxes are calculated at checkout.
        </p>
      </section>
      <LearningFaq />
      <section className="shell pt-20 sm:pt-28">
        <div className={styles.closingCta}>
          <Sparkles
            className="size-6 mx-auto text-primary mb-5"
            strokeWidth={1.5}
          />
          <h2 className="text-3xl sm:text-4xl font-medium tracking-[-.045em]">
            Your next chapter starts with curiosity.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Make a little room. See where it takes you.
          </p>
          <Button asChild className="mt-7">
            <Link href="#courses">
              Find your starting point <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
