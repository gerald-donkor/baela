import { expect, test } from "@playwright/test";

for (const route of ["/", "/auth/sign-in"]) {
  test(`touch drag on ${route} claims the gesture without scrolling`, async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Uses Chromium's native touch input.",
    );
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(route);
    const canvas = page.locator("canvas").first();
    await expect(canvas).toHaveAttribute("data-ready", "true");
    const bounds = (await canvas.boundingBox())!;
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height * (route === "/" ? 0.25 : 0.5);
    await page.evaluate(() => {
      document.addEventListener(
        "touchstart",
        (event) => {
          document.documentElement.dataset.globeTouchClaimed = String(
            event.defaultPrevented,
          );
        },
        { passive: true },
      );
    });
    const scroll = await page.evaluate(() => scrollY);
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    await expect(page.locator("html")).toHaveAttribute(
      "data-globe-touch-claimed",
      "true",
    );
    for (let step = 1; step <= 5; step++) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x + step * 16, y: y + step * 8 }],
      });
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    expect(await page.evaluate(() => scrollY)).toBe(scroll);
    await session.detach();
  });
}

test("mobile hero keeps its SVG fallback after WebGL becomes ready", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const canvas = page.locator("canvas").first();
  await expect(canvas).toHaveAttribute("data-ready", "true");
  const image = canvas.locator("..");
  await expect(image).toHaveCSS("background-image", /hero-globe\.svg/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toBeHidden();
  await expect(image).toHaveCSS("background-image", /hero-globe\.svg/);
});

test("hero globe rotates with a fixed frame and keeps animating without a visible control", async ({
  page,
}) => {
  // The full animation cycle and software WebGL screenshots need extra time.
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const canvas = page.locator("canvas").first();
  await expect(canvas).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("button", { name: /animation$/ })).toHaveCount(0);
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  // Capture the exposed upper hemisphere, excluding the foreground content
  // and development overlays that can repaint independently of the globe.
  const clip = {
    x: bounds!.x + bounds!.width * 0.3,
    y: bounds!.y + bounds!.height * 0.19,
    width: bounds!.width * 0.4,
    height: bounds!.height * 0.05,
  };
  const initial = await page.screenshot({ clip });
  await page.waitForTimeout(1000);
  expect(await canvas.boundingBox()).toEqual(bounds);
  expect(Buffer.compare(await page.screenshot({ clip }), initial)).not.toBe(0);
  await page.waitForTimeout(10500);
  const afterCycle = await page.screenshot({ clip });
  expect(Buffer.compare(afterCycle, initial)).not.toBe(0);
  await page.waitForTimeout(350);
  expect(Buffer.compare(await page.screenshot({ clip }), afterCycle)).not.toBe(
    0,
  );
  expect(await canvas.boundingBox()).toEqual(bounds);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("hero shows the supplied still image for reduced motion and unavailable WebGL", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("canvas").first()).toBeHidden();
  await expect(page.getByRole("button", { name: /animation$/ })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /Make room for your next chapter/ }),
  ).toBeVisible();

  await page.emulateMedia({ reducedMotion: "no-preference" });
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
  await page.reload();
  await expect(page.getByRole("button", { name: /animation$/ })).toHaveCount(0);
  const imageLoaded = await page.evaluate(async () => {
    const image = new Image();
    image.src = "/images/landing/globe.png";
    await image.decode();
    return image.naturalWidth > 0;
  });
  expect(imageLoaded).toBe(true);
});
