import { expect, test } from "@playwright/test";

test("signed-in account menu shows identity and supports keyboard and outside dismissal", async ({
  page,
}, testInfo) => {
  await page.goto("/design-system");
  const student = page.getByRole("group", { name: "Student navigation" });
  const trigger = student.getByRole("button", {
    name: "Open account menu for Maya Chen",
  });
  const menu = page.getByRole("menu", { name: "Account menu" });
  await expect(trigger).toHaveText("M");
  await expect(
    page
      .getByRole("group", { name: "Visitor navigation" })
      .getByRole("button", { name: /Open account menu/ }),
  ).toHaveCount(0);

  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(menu.getByText("Maya Chen", { exact: true })).toBeVisible();
  await expect(menu.getByText("maya@example.com")).toBeVisible();
  await expect(
    menu.getByRole("menuitem", { name: "Manage account" }),
  ).toHaveAttribute("href", "/account");
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem", { name: "Sign out" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.getByRole("heading", { name: "Room for every account." }).click();
  await expect(menu).toHaveCount(0);

  for (const theme of ["dark", "light"]) {
    if (theme === "light") {
      await page
        .getByRole("banner")
        .getByRole("button", { name: "Toggle light and dark appearance" })
        .click();
    }
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await trigger.click();
      await expect(
        menu.getByRole("menuitem", { name: "Sign out" }),
      ).toBeVisible();
      const box = (await menu.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(16);
      expect(box.x + box.width).toBeLessThanOrEqual(width - 16);
      if (width === 320) {
        await page.screenshot({
          path: testInfo.outputPath(`account-menu-${theme}-mobile.png`),
        });
      }
      await page.keyboard.press("Escape");
    }
  }

  await page.setViewportSize({ width: 320, height: 900 });
  await student.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    student.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await trigger.click();
  await expect(menu).toBeVisible();
  await expect(
    student.getByRole("navigation", { name: "Mobile navigation" }),
  ).toHaveCount(0);
});

test("sign-out failures allow retry and success returns to the signed-out home page", async ({
  page,
}) => {
  let attempts = 0;
  let releaseSignOut!: () => void;
  const pendingSignOut = new Promise<void>((resolve) => {
    releaseSignOut = resolve;
  });
  await page.route("**/api/auth/sign-out", async (route) => {
    attempts++;
    if (attempts === 1) {
      await route.fulfill({
        status: 500,
        json: { message: "Service unavailable" },
      });
    } else {
      await pendingSignOut;
      await route.fulfill({ status: 200, json: { success: true } });
    }
  });
  await page.goto("/design-system");
  await page
    .getByRole("group", { name: "Student navigation" })
    .getByRole("button", { name: "Open account menu for Maya Chen" })
    .click();
  const menu = page.getByRole("menu", { name: "Account menu" });
  await menu.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(menu.getByRole("alert")).toHaveText(
    "Couldn’t sign out. Please try again.",
  );
  await expect(menu.getByRole("menuitem", { name: "Sign out" })).toBeEnabled();
  await menu.getByRole("menuitem", { name: "Sign out" }).click();
  const pending = menu.getByRole("menuitem", { name: "Signing out…" });
  await expect(pending).toBeDisabled();
  await expect(pending).toHaveAttribute("aria-busy", "true");
  releaseSignOut();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("banner").getByRole("button", { name: /Open account menu/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Get started" }),
  ).toBeVisible();
  expect(attempts).toBe(2);
});
