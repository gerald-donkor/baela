import { expect, test } from "@playwright/test";
test("catalog, pricing and mobile layout work before enrollment opens", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Make room for your next chapter/ }),
  ).toBeVisible();
  await expect(page.getByText("$8.33", { exact: true })).toBeVisible();
  await expect(page.getByText("$16.67", { exact: true })).toBeVisible();
  await expect(page.getByText("$83.33", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Explore courses" }).click();
  await expect(page).toHaveURL(/#courses$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("catalog-default-dark.png"),
    fullPage: true,
  });
});
test("theme preference survives reload", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass("dark");
  const toggle = page.getByRole("button", {
    name: "Toggle light and dark appearance",
  });
  await toggle.click();
  await expect(page.locator("html")).toHaveClass("light");
  await page.screenshot({
    path: testInfo.outputPath("catalog-light.png"),
    fullPage: true,
  });
  const theme = await page.locator("html").getAttribute("class");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("class", theme!);
  await toggle.click();
  await expect(page.locator("html")).toHaveClass("dark");
  await page.reload();
  await expect(page.locator("html")).toHaveClass("dark");
});

test("landing preview opens the sample learning workspace", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Try the demo", exact: true }).click();
  const demo = page.getByRole("region", { name: "Learning workspace preview" });
  await expect(
    demo.getByRole("heading", {
      name: "Setting up authentication",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    demo.getByRole("button", { name: "Mark complete", exact: true }),
  ).toBeDisabled();
  await demo
    .getByRole("link", { name: "Explore the workspace", exact: true })
    .click();
  await expect(page).toHaveURL(/\/courses$/);
  await expect(
    page.getByRole("heading", { name: "Your next chapter starts here." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("mobile navigation opens and closes after choosing a destination", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const open = page.getByRole("button", { name: "Open navigation" });
  await open.click();
  await expect(
    page.getByRole("button", { name: "Close navigation" }),
  ).toHaveAttribute("aria-expanded", "true");
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Pricing", exact: true })
    .click();
  await expect(page).toHaveURL(/#pricing$/);
  await expect(open).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toHaveCount(0);
});

test("mobile navigation dismisses with Escape, outside interaction, and a wider viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open navigation" });
  const menu = page.getByRole("navigation", { name: "Mobile navigation" });
  await toggle.click();
  await menu.getByRole("link", { name: "Courses", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(toggle).toBeFocused();

  await toggle.click();
  await page.getByText("At your pace. On your terms.", { exact: true }).click();
  await expect(menu).toHaveCount(0);

  await toggle.click();
  await menu.getByRole("link").last().focus();
  await page.keyboard.press("Tab");
  await expect(menu).toHaveCount(0);

  await toggle.click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(menu).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("all account navigation variants fit without overlapping in both themes", async ({
  page,
}) => {
  await page.goto("/design-system");
  for (const theme of ["dark", "light"]) {
    if (theme === "light") {
      await page
        .getByRole("banner")
        .getByRole("button", { name: "Toggle light and dark appearance" })
        .click();
    }
    for (const width of [320, 360, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const label of [
        "Visitor navigation",
        "Student navigation",
        "Admin navigation",
      ]) {
        const header = page.getByRole("group", { name: label, exact: true });
        expect(
          await header.evaluate((element) => {
            const container = element.getBoundingClientRect();
            const controls = Array.from(element.querySelectorAll("a, button"))
              .map((control) => control.getBoundingClientRect())
              .filter((box) => box.width > 0 && box.height > 0);
            return controls.every(
              (box, index) =>
                box.left >= container.left &&
                box.right <= container.right &&
                controls
                  .slice(index + 1)
                  .every(
                    (other) =>
                      box.right <= other.left ||
                      other.right <= box.left ||
                      box.bottom <= other.top ||
                      other.bottom <= box.top,
                  ),
            );
          }),
          `${label} at ${width}px in ${theme} mode`,
        ).toBe(true);
        if (width >= 1024) {
          await expect(
            header.getByRole("navigation", { name: "Main navigation" }),
          ).toBeVisible();
        } else {
          await expect(
            header.getByRole("button", { name: "Open navigation" }),
          ).toBeVisible();
        }
      }
    }
  }
});

test("review stories and FAQ answers are usable by keyboard", async ({
  page,
}) => {
  await page.goto("/");
  const reviews = page.getByRole("region", {
    name: "Different paths. Same spark.",
  });
  await expect(
    reviews.getByText("Sample reviews · fictional profiles", { exact: true }),
  ).toBeVisible();
  const featured = reviews.getByRole("figure", {
    name: "Featured sample review",
  });
  const announcement = featured.getByRole("status");
  const announcementNode = await announcement.elementHandle();
  await expect(featured.getByText("Maya Chen", { exact: true })).toBeVisible();
  const next = reviews.getByRole("button", { name: "Next sample review" });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(
    featured.getByText("Amara Okafor", { exact: true }),
  ).toBeVisible();
  await expect(announcement).toContainText("Amara Okafor:");
  expect(
    await announcement.evaluate(
      (element, original) => element === original,
      announcementNode,
    ),
  ).toBe(true);
  await announcementNode?.dispose();
  await page.keyboard.press("Enter");
  await expect(featured.getByText("Nina Patel", { exact: true })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(featured.getByText("Maya Chen", { exact: true })).toBeVisible();
  await reviews.getByRole("button", { name: "Previous sample review" }).click();
  await expect(featured.getByText("Nina Patel", { exact: true })).toBeVisible();
  await reviews
    .getByRole("button", { name: "Read Maya Chen’s sample review" })
    .click();
  await expect(featured.getByText("Maya Chen", { exact: true })).toBeVisible();
  const faq = page.getByRole("region", {
    name: "A little clarity, before you begin.",
  });
  const question = faq
    .locator("summary")
    .filter({ hasText: "Can I try the learning experience first?" });
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(
    faq.getByRole("link", { name: "workspace preview", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(
    faq.getByRole("link", { name: "workspace preview", exact: true }),
  ).toBeHidden();
});

test("review controls have room for touch and respect reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const featured = page.getByRole("figure", {
    name: "Featured sample review",
  });
  for (const button of await featured.getByRole("button").all()) {
    const box = await button.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  const initialHeight = (await featured.boundingBox())!.height;
  await featured.getByRole("button", { name: "Next sample review" }).click();
  expect((await featured.boundingBox())!.height).toBeCloseTo(initialHeight, 1);
  const quote = featured.locator("blockquote");
  expect(
    await quote.evaluate(
      (element) => getComputedStyle(element.parentElement!).animationName,
    ),
  ).toBe("none");
  await featured.getByRole("button", { name: "Next sample review" }).click();
  expect((await featured.boundingBox())!.height).toBeCloseTo(initialHeight, 1);
  const caption = featured.locator("figcaption");
  expect(
    await caption.evaluate((element) => element.parentElement?.tagName),
  ).toBe("FIGURE");
  expect(
    await caption.evaluate(
      (element) => element.parentElement?.lastElementChild === element,
    ),
  ).toBe(true);
});

test("buttons and expandable controls show a pointer without enabling closed enrollment", async ({
  page,
}) => {
  await page.goto("/");
  const actions = [
    page.getByRole("link", { name: "Explore courses", exact: true }),
    page.getByRole("link", { name: "Explore the workspace", exact: true }),
    page.getByRole("button", { name: "Next sample review", exact: true }),
    page.getByRole("button", { name: "Enrollment opens soon" }).first(),
    page
      .getByRole("region", { name: "A little clarity, before you begin." })
      .locator("summary")
      .first(),
  ];
  for (const action of actions) {
    await action.hover();
    expect(
      await action.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const hovered = document.elementFromPoint(
          box.x + box.width / 2,
          box.y + box.height / 2,
        );
        return hovered ? getComputedStyle(hovered).cursor : null;
      }),
    ).toBe("pointer");
  }
  const enroll = page
    .getByRole("button", { name: "Enrollment opens soon" })
    .first();
  await expect(enroll).toBeDisabled();
  const checkoutRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/checkout"))
      checkoutRequests.push(request.url());
  });
  await enroll.evaluate((element: HTMLButtonElement) => element.click());
  expect(checkoutRequests).toEqual([]);
});

test("the design system gallery shares theme tokens and accessible progress", async ({
  page,
}) => {
  const response = await page.goto("/design-system");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "A space for possibility." }),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Complete", exact: true }),
  ).toHaveAttribute("value", "100");
  await page.getByLabel("Example text input").fill("Learning something new");
  await page.getByLabel("Example selection").selectOption("daily");
  await page
    .getByRole("banner")
    .getByRole("button", { name: "Toggle light and dark appearance" })
    .click();
  await expect(page.locator("html")).toHaveClass("light");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("protected pages redirect anonymous visitors", async ({ page }) => {
  for (const path of [
    "/account",
    "/admin",
    "/admin/users",
    "/admin/settings",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/auth\/sign-in/);
    await expect(page.getByText(/Student accounts will open/)).toBeVisible();
  }
});
test("security boundaries reject unsigned, anonymous and cross-origin requests", async ({
  request,
}) => {
  expect((await request.get("/api/cron")).status()).toBe(401);
  expect(
    (
      await request.post("/api/webhooks/polar", {
        data: { type: "order.paid" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/admin", {
        headers: { Origin: "https://attacker.example" },
        data: { action: "course" },
      })
    ).status(),
  ).toBe(403);
  expect((await request.get("/api/covers/not-an-id")).status()).toBe(404);
});
test("unknown pages return a useful 404", async ({ page }) => {
  const response = await page.goto("/not-a-real-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("link", { name: /home/i }).last()).toBeVisible();
});

test("legal pages and support remain available", async ({ page }) => {
  for (const [path, title] of [
    ["/privacy", "Privacy policy"],
    ["/terms", "Terms of use"],
    ["/refund-policy", "Refund policy"],
    ["/support", "A little support."],
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }
});
