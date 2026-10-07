import { expect, test } from "@playwright/test";

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
