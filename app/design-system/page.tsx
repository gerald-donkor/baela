import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LearningProgress } from "@/components/ui/learning-progress";
import { SectionHeading } from "@/components/ui/section-heading";
import { CourseCard } from "@/components/course-card";
import { TestimonialCard } from "@/components/ui/testimonial-card";
import { Faq } from "@/components/ui/faq";
import { sampleReviews } from "@/components/landing/reviews-data";
import { SiteHeaderContent } from "@/components/site-header-content";

export const metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

export default function DesignSystem() {
  return (
    <div className="shell py-14 space-y-16">
      <div>
        <Badge>
          <Sparkles className="size-3" /> Baela / Horizon
        </Badge>
        <h1 className="mt-5 text-5xl font-medium tracking-[-.05em]">
          A space for possibility.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground leading-7">
          The shared visual language for courses, lessons, and everything that
          comes next. Use the header toggle to inspect both themes.
        </p>
      </div>
      <section aria-labelledby="palette-title">
        <SectionHeading
          id="palette-title"
          eyebrow="01 / Foundations"
          title="A little light in the dark."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {[
            ["Canvas", "bg-background"],
            ["Card", "bg-card"],
            ["Raised", "bg-surface-raised"],
            ["Primary", "bg-primary"],
            ["Secondary", "bg-secondary"],
            ["Muted", "bg-muted"],
            ["Success", "bg-success"],
            ["Destructive", "bg-destructive"],
          ].map(([label, color]) => (
            <Card key={label} className="overflow-hidden">
              <div className={`h-20 border-b ${color}`} />
              <div className="p-3 text-xs">{label}</div>
            </Card>
          ))}
        </div>
      </section>
      <section aria-labelledby="type-title">
        <SectionHeading
          id="type-title"
          eyebrow="02 / Typography"
          title="Clear ideas deserve clear type."
        />
        <Card>
          <CardContent className="space-y-6">
            <Brand />
            <p className="text-4xl font-medium tracking-tight">
              Your next chapter.
            </p>
            <p className="text-xl font-medium tracking-tight">
              Small steps. Real progress.
            </p>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              Geist Sans, generous line height, and a quiet hierarchy keep the
              focus on what matters. Supporting copy uses the muted foreground
              token.
            </p>
            <p className="eyebrow">Stay curious. Keep growing.</p>
          </CardContent>
        </Card>
      </section>
      <section aria-labelledby="controls-title">
        <SectionHeading
          id="controls-title"
          eyebrow="03 / Controls"
          title="Every action has a place."
        />
        <Card>
          <CardContent className="space-y-7">
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/#demo">
                  Primary action <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/#courses">Secondary</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/#pricing">Outline</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/support">Ghost</Link>
              </Button>
              <Button disabled>Unavailable</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge>In progress</Badge>
              <Badge variant="muted">Preview lesson</Badge>
              <Badge variant="success">
                <Check className="size-3" /> Completed
              </Badge>
            </div>
            <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
              <label className="field-label">
                Example text input
                <input
                  className="field"
                  placeholder="What are you curious about?"
                />
              </label>
              <label className="field-label">
                Example selection
                <select className="field" defaultValue="self">
                  <option value="self">At my own pace</option>
                  <option value="daily">A little every day</option>
                </select>
              </label>
            </div>
          </CardContent>
        </Card>
      </section>
      <section aria-labelledby="learning-title">
        <SectionHeading
          id="learning-title"
          eyebrow="04 / Learning"
          title="Progress, made visible."
          description="Illustrative component examples. These are separate from the course catalog."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <CourseCard
            course={{
              id: "example",
              slug: "example",
              title: "The art of focused learning",
              summary: "A sample course card using the shared design system.",
            }}
            href="/#demo"
            percentage={33}
          />
          <Card>
            <CardContent className="space-y-7">
              <h3 className="text-xl font-medium tracking-tight">
                Learning states
              </h3>
              <LearningProgress value={0} label="Ready to begin" />
              <LearningProgress value={33} label="In progress" />
              <LearningProgress value={100} label="Complete" />
              <p className="text-xs leading-6 text-muted-foreground">
                Native progress elements expose the label and value to assistive
                technology. Success badges add a text and icon completion cue.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      <section aria-labelledby="stories-title">
        <SectionHeading
          id="stories-title"
          eyebrow="05 / Stories and questions"
          title="Make room for another perspective."
          description="Reusable review cards and native, keyboard-accessible FAQ disclosure. These reviews use fictional sample profiles."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <TestimonialCard review={sampleReviews[1]} />
          <TestimonialCard review={sampleReviews[3]} />
        </div>
        <Faq
          className="mt-8"
          items={[
            {
              question: "Where do these review styles come from?",
              answer:
                "The column layout takes inspiration from 21st.dev testimonial components, adapted to Baela’s Horizon tokens. All review text and names here are fictional placeholders.",
            },
            {
              question: "How should these components be reused?",
              answer:
                "Use TestimonialCard for a named, attributed quote and Faq for a list of questions and answers. Both inherit the active theme. Replace sample profiles with approved reviews before using them as real testimonials.",
            },
          ]}
        />
      </section>
      <section aria-labelledby="navigation-title">
        <SectionHeading
          id="navigation-title"
          className="max-w-2xl"
          eyebrow="Navigation"
          title="Room for every account."
          description="The same header adapts to visitors, students, and administrators. These are presentation examples; account permissions come from the signed-in session."
        />
        <div className="space-y-6">
          {[
            { label: "Visitor navigation", signedIn: false, admin: false },
            { label: "Student navigation", signedIn: true, admin: false },
            { label: "Admin navigation", signedIn: true, admin: true },
          ].map(({ label, signedIn, admin }) => (
            <div key={label}>
              <h3 className="mb-3 text-sm text-muted-foreground">{label}</h3>
              <div
                role="group"
                aria-label={label}
                className="relative isolate -mx-4 rounded-card border bg-card focus-within:z-10 sm:-mx-6"
              >
                <SiteHeaderContent signedIn={signedIn} admin={admin} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
