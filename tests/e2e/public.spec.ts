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
    path: testInfo.outputPath("catalog-light.png"),
    fullPage: true,
  });
});
test("theme preference survives reload", async ({ page }, testInfo) => {
  await page.goto("/");
  const toggle = page.getByRole("button", {
    name: "Toggle light and dark appearance",
  });
  await toggle.click();
  await expect(page.locator("html")).toHaveClass("dark");
  await page.screenshot({
    path: testInfo.outputPath("catalog-dark.png"),
    fullPage: true,
  });
  const theme = await page.locator("html").getAttribute("class");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("class", theme!);
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
