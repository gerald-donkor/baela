import Link from "next/link";
import { redirect } from "next/navigation";
import { dashboard } from "@/lib/server/catalog";
import { getViewer } from "@/lib/auth/server";
import { evaluateAccess } from "@/lib/domain/access";
import { coursePercentage } from "@/lib/domain/progress";
import { CourseCard } from "@/components/course-card";
import { Button } from "@/components/ui/button";
export const metadata = {
  title: "My learning",
  robots: { index: false, follow: false },
};
export default async function Dashboard() {
  const user = await getViewer();
  if (!user) redirect("/auth/sign-in?next=/dashboard");
  if (user.state !== "active") redirect("/account");
  const { rows, grants } = await dashboard(user.id);
  const grouped = Map.groupBy(rows, (row) => row.course.id);
  const owned = [...grouped.values()].filter(
    (group) =>
      group.some((r) => r.progress) ||
      grants.some(
        (g) => g.kind === "course" && g.courseId === group[0].course.id,
      ),
  );
  const recent = rows
    .filter((r) => r.progress && !r.progress.completed)
    .sort(
      (a, b) =>
        b.progress!.updatedAt.getTime() - a.progress!.updatedAt.getTime(),
    )[0];
  return (
    <div className="shell py-14">
      <p className="eyebrow">Your learning space</p>
      <div className="flex flex-wrap justify-between gap-4 mt-3 mb-10">
        <h1 className="text-4xl font-medium tracking-tight">
          Welcome back, {user.name.split(" ")[0]}.
        </h1>
        <Button variant="outline" asChild>
          <Link href="/#courses">Browse all courses</Link>
        </Button>
      </div>
      {recent && (
        <section className="bg-secondary rounded-2xl p-8 mb-12">
          <p className="eyebrow">Continue watching</p>
          <h2 className="text-2xl font-medium mt-3">{recent.revision.title}</h2>
          <p className="text-muted-foreground mt-2 mb-5">
            {recent.course.title}
          </p>
          <Button asChild>
            <Link
              href={"/learn/" + recent.course.slug + "/" + recent.lesson.id}
            >
              Pick up where you left off →
            </Link>
          </Button>
        </section>
      )}
      <h2 className="text-2xl font-medium mb-6">My courses</h2>
      {owned.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {owned.map((group) => {
            const first = group[0],
              accessible = evaluateAccess(
                first.course.id,
                false,
                true,
                grants,
              ).allowed;
            return (
              <div key={first.course.id} className="grid">
                <CourseCard
                  course={first.course}
                  href={
                    accessible
                      ? "/learn/" + first.course.slug + "/" + first.lesson.id
                      : "/courses/" + first.course.slug
                  }
                  percentage={coursePercentage(
                    group.filter((r) => r.progress?.completed).length,
                    group.length,
                  )}
                />
                {!accessible && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Your progress is saved. Renew access to continue.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed rounded-2xl p-12 text-center">
          <h3 className="text-xl">Your next chapter is waiting.</h3>
          <p className="text-muted-foreground my-4">
            Start a course and it will appear here.
          </p>
          <Button asChild>
            <Link href="/#courses">Find a course</Link>
          </Button>
        </div>
      )}
      {grants.some((g) => g.kind !== "course" && !g.revokedAt) && (
        <section className="mt-12">
          <h2 className="text-2xl font-medium mb-5">Included in your access</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[...grouped.values()]
              .filter(
                (g) =>
                  !owned.includes(g) &&
                  evaluateAccess(g[0].course.id, false, true, grants).allowed,
              )
              .map((g) => (
                <CourseCard
                  key={g[0].course.id}
                  course={g[0].course}
                  href={"/learn/" + g[0].course.slug + "/" + g[0].lesson.id}
                />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
