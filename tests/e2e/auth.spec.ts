import { expect, test } from "@playwright/test";

// Enable custom auth UI while keeping provider requests mocked and the DB disabled.
test.skip(process.env.BAELA_E2E_AUTH !== "1", "Run with BAELA_E2E_AUTH=1.");

test("header auth links open sign-up and sign-in from another page", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/support");
  const header = page.getByRole("banner");
  await header.getByRole("link", { name: "Get started", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/sign-up$/);
  await expect(
    page.getByRole("heading", { name: "A new chapter starts here." }),
  ).toBeVisible();
  await expect(page.getByLabel("Your name", { exact: true })).toBeVisible();
  for (const provider of ["Google", "GitHub"])
    await expect(
      page.getByRole("button", { name: provider, exact: true }),
    ).toBeEnabled();

  const signIn = header.getByRole("link", { name: "Sign in", exact: true });
  if (await signIn.isVisible()) await signIn.click();
  else {
    await header.getByRole("button", { name: "Open navigation" }).click();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Sign in", exact: true })
      .click();
    await expect(
      page.getByRole("navigation", { name: "Mobile navigation" }),
    ).toHaveCount(0);
  }
  await expect(page).toHaveURL(/\/auth\/sign-in$/);
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  for (const provider of ["Google", "GitHub"])
    await expect(
      page.getByRole("button", { name: provider, exact: true }),
    ).toBeEnabled();
  expect(errors).toEqual([]);
});

test("compact mobile navigation provides both auth destinations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const menu = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(
    menu.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await menu.getByRole("link", { name: "Get started", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/sign-up$/);
  await expect(menu).toHaveCount(0);
  await expect(page.getByLabel("Your name", { exact: true })).toBeVisible();
});

for (const view of ["sign-in", "sign-up"]) {
  for (const provider of ["google", "github"]) {
    const label = provider === "google" ? "Google" : "GitHub";
    test(`${label} starts OAuth from ${view} with the intended return page`, async ({
      page,
    }) => {
      const next = "/courses/full-stack-nextjs?lesson=intro";
      let payload: Record<string, unknown> | undefined;
      await page.route("**/api/auth/sign-in/social", async (route) => {
        payload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          json: {
            url: "http://localhost:3100/provider-consent",
            redirect: true,
          },
        });
      });
      await page.route("**/provider-consent", (route) =>
        route.fulfill({ contentType: "text/html", body: "Provider consent" }),
      );
      await page.goto(`/auth/${view}?next=${encodeURIComponent(next)}`);
      await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
      await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: label, exact: true }).click();
      await expect(page).toHaveURL("http://localhost:3100/provider-consent");
      expect(payload).toMatchObject({
        provider,
        callbackURL: "http://localhost:3100" + next,
        errorCallbackURL:
          "http://localhost:3100/auth/sign-in?next=" + encodeURIComponent(next),
      });
    });
  }
}

test("provider errors release the buttons so a user can retry", async ({
  page,
}) => {
  await page.route("**/api/auth/sign-in/social", (route) =>
    route.fulfill({
      status: 400,
      json: { code: "PROVIDER_NOT_FOUND", message: "Provider is unavailable." },
    }),
  );
  await page.goto("/auth/sign-in");
  await page.getByRole("button", { name: "Google", exact: true }).click();
  // The SDK maps this upstream error code to its standard provider message.
  await expect(page.getByRole("status")).toHaveText(
    "OAuth provider not supported",
  );
  await expect(
    page.getByRole("button", { name: "Google", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "GitHub", exact: true }),
  ).toBeEnabled();
});

test("unsafe return URLs fall back to the dashboard", async ({ page }) => {
  let payload: Record<string, unknown> | undefined;
  await page.route("**/api/auth/sign-in/social", (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({ status: 400, json: { message: "Try again." } });
  });
  await page.goto("/auth/sign-in?next=" + encodeURIComponent("/\t/evil.test"));
  await page.getByRole("button", { name: "GitHub", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Try again.");
  expect(payload?.callbackURL).toBe("http://localhost:3100/dashboard");
});

test("cancelled OAuth shows a retry message on the sign-in page", async ({
  page,
}) => {
  await page.goto("/auth/sign-in?error=access_denied&next=/account");
  await expect(page.getByRole("status")).toHaveText(
    "Sign-in couldn’t be completed. Please try again.",
  );
  await expect(
    page.getByRole("button", { name: "Google", exact: true }),
  ).toBeEnabled();
});
