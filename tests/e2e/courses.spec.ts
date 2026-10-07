import { expect, test } from "@playwright/test";
import {
  courseLessons,
  currentLesson,
  lessonHref,
  sampleCourses,
} from "../../lib/sample-courses";

test("six sample courses and every lesson are available without authentication", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  await page.goto("/courses");
  await expect(
    page.getByRole("heading", { name: "Your next chapter starts here." }),
  ).toBeVisible();
  for (const course of sampleCourses) {
    await expect(
      page.getByRole("heading", { name: course.title, exact: true }).last(),
    ).toBeVisible();
    const overview = await request.get(`/courses/${course.slug}`);
    expect(overview.status(), course.title).toBe(200);
    const lessons = courseLessons(course);
    const responses = await Promise.all(
      lessons.map((lesson) => request.get(lessonHref(course, lesson))),
    );
    for (const [index, response] of responses.entries()) {
      expect(
        response.status(),
        `${course.title}: ${lessons[index].title}`,
      ).toBe(200);
      expect(await response.text()).toContain(lessons[index].title);
    }
  }
  // Next.js can send 200 for a streamed not-found response; check the rendered state.
  await page.goto("/learn/full-stack-nextjs/not-a-real-lesson");
  await expect(
    page.getByRole("heading", { name: "This chapter is missing." }),
  ).toBeVisible();
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "A little progress, every day." }),
  ).toBeVisible();
});

test("course navigation and content tabs work without saving sample progress", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/(progress|checkout|media)/.test(request.url()))
      requests.push(request.url());
  });
  const course = sampleCourses[0];
  await page.goto(`/courses/${course.slug}`);
  await page
    .getByRole("link", { name: "Continue learning", exact: true })
    .click();
  await expect(page).toHaveURL(lessonHref(course));
  await expect(
    page.getByRole("heading", {
      name: currentLesson(course).title,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mark complete", exact: true }),
  ).toBeDisabled();
  await page.getByRole("tab", { name: "Resources" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Your lesson toolkit");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Transcript" })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("00:38");
  await page.getByRole("link", { name: "Next lesson", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Building the dashboard", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Full-stack Next.js progress" }),
  ).toHaveAttribute("aria-valuenow", "50");
  expect(requests).toEqual([]);
});

test("the collection filters sample courses and gives a useful empty result", async ({
  page,
}) => {
  await page.goto("/courses");
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Interface design essentials",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "React from first principles",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "All courses" }).click();
  await page
    .getByRole("searchbox", { name: "Search courses" })
    .fill("no-such-course");
  await expect(
    page.getByRole("heading", { name: "No courses found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show all courses" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Creative coding & motion",
      exact: true,
    }),
  ).toBeVisible();
});

for (const theme of ["dark", "light"]) {
  test(`course screens fit mobile, tablet, and desktop in ${theme} mode`, async ({
    context,
  }, testInfo) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    await context.addInitScript((value) => {
      window.localStorage.setItem("theme", value);
    }, theme);
    for (const width of [320, 390, 768, 1024, 1440]) {
      // Isolate each viewport from Firefox's pending hard-navigation history.
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        "/courses",
        "/courses/interface-design-essentials",
        "/learn/full-stack-nextjs/setting-up-authentication",
      ]) {
        await page.goto(path);
        await expect
          .poll(
            async () =>
              page.evaluate(() => {
                const heading = document.querySelector("h1");
                const box = heading?.getBoundingClientRect();
                return {
                  theme: document.documentElement.className,
                  fits: document.documentElement.scrollWidth <= innerWidth,
                  visibleHeading: !!box && box.width > 0 && box.height > 0,
                };
              }),
            { message: `${path}, ${width}px, ${theme}` },
          )
          .toEqual({
            theme,
            fits: true,
            visibleHeading: true,
          });
      }
      if (width === 390) {
        await page
          .locator("summary")
          .filter({ hasText: "Course content" })
          .click();
        await expect(
          page.getByRole("navigation", { name: "Course curriculum" }).last(),
        ).toBeVisible();
        await page
          .getByRole("link", { name: /8. Building the dashboard/ })
          .last()
          .click();
        await expect(
          page.getByRole("heading", {
            name: "Building the dashboard",
            exact: true,
          }),
        ).toBeVisible();
        await page.screenshot({
          path: testInfo.outputPath(`course-mobile-${theme}.png`),
          fullPage: true,
        });
      }
      await page.close();
    }
    expect(errors).toEqual([]);
  });
}
