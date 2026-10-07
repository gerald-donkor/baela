import { expect, test } from "@playwright/test";

test.skip(process.env.BAELA_E2E_AUTH !== "1", "Run with BAELA_E2E_AUTH=1.");

test("password visibility preserves credentials and email sign-in behavior", async ({
  page,
}) => {
  let payload: Record<string, unknown> | undefined;
  await page.route("**/api/auth/sign-in/email", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 400,
      json: { message: "Please check your email and password." },
    });
  });
  await page.goto("/auth/sign-in?next=/account");
  const password = page.getByLabel("Password", { exact: true });
  await page.getByLabel("Email", { exact: true }).fill("student@example.test");
  await password.fill("test-password-123");
  await page
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("test-password-123");
  expect(payload).toBeUndefined();
  await page
    .getByRole("button", { name: "Hide password", exact: true })
    .click();
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Please check your email and password.",
  );
  expect(payload).toMatchObject({
    email: "student@example.test",
    password: "test-password-123",
    callbackURL: "http://localhost:3100/account",
  });
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeEnabled();
});

test("auth globe animates in a fixed frame and switches to still artwork for reduced motion", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1280, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/auth/sign-in");
  const canvas = page.locator("main canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true");
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  const clip = {
    x: bounds!.x + bounds!.width * 0.35,
    y: bounds!.y + bounds!.height * 0.35,
    width: bounds!.width * 0.3,
    height: bounds!.height * 0.3,
  };
  const initial = await page.screenshot({ clip });
  await page.waitForTimeout(750);
  expect(Buffer.compare(initial, await page.screenshot({ clip }))).not.toBe(0);
  expect(await canvas.boundingBox()).toEqual(bounds);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toBeHidden();
  expect(
    await canvas
      .locator("..")
      .evaluate((element) => getComputedStyle(element).backgroundImage),
  ).toContain("/images/auth/globe.svg");
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("unavailable WebGL keeps the globe artwork and account form usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof getContext>
    ) {
      if (String(args[0]).startsWith("webgl")) return null;
      return getContext.apply(this, args);
    } as typeof getContext;
  });
  await page.goto("/auth/sign-in");
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  const canvas = page.locator("main canvas");
  expect(
    await canvas
      .locator("..")
      .evaluate((element) => getComputedStyle(element).backgroundImage),
  ).toContain("/images/auth/globe.svg");
  expect(
    await page.evaluate(async () => {
      const image = new Image();
      image.src = "/images/auth/globe.svg";
      await image.decode();
      return image.naturalWidth > 0;
    }),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Google", exact: true }),
  ).toBeEnabled();
});
