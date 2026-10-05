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

test("learning demo updates sample progress and resets independently of enrollment", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Try the demo", exact: true }).click();
  const demo = page.getByRole("region", { name: "Interactive learning demo" });
  await expect(demo.getByText("Sample content", { exact: true })).toBeVisible();
  await demo
    .getByRole("button", { name: "Explore a lesson", exact: true })
    .click();
  await expect(
    demo.getByRole("heading", {
      name: "Start with a little curiosity",
      exact: true,
    }),
  ).toBeVisible();
  await demo
    .getByRole("button", { name: "Mark complete", exact: true })
    .click();
  await expect(
    demo.getByRole("progressbar", { name: "Demo course progress" }),
  ).toHaveAttribute("value", "33");
  await demo
    .getByRole("button", { name: "Completed · Undo", exact: true })
    .click();
  await expect(
    demo.getByRole("progressbar", { name: "Demo course progress" }),
  ).toHaveAttribute("value", "0");
  await demo.getByRole("button", { name: /Make space to focus/ }).click();
  await expect(
    demo.getByRole("heading", { name: "Make space to focus", exact: true }),
  ).toBeVisible();
  await demo
    .getByRole("button", { name: "Mark complete", exact: true })
    .click();
  await demo.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(
    demo.getByRole("progressbar", { name: "Demo course progress" }),
  ).toHaveAttribute("value", "0");
  await expect(
    page.getByRole("button", { name: "Enrollment opens soon" }),
  ).toHaveCount(2);
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
    "/dashboard",
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
