import { expect, test } from "@playwright/test";

test("production deployment works from a repository subpath", async ({ page }) => {
  const appUrl = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4177/";
  const failedAssets: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400 && /\.(?:css|js|png|webmanifest)(?:\?|$)/.test(response.url())) failedAssets.push(`${response.status()} ${response.url()}`);
  });

  const response = await page.goto(appUrl);
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle("跃动小子：单机复刻版");
  await expect(page.getByRole("button", { name: /开 \d+ 次/ })).toBeVisible();

  const chest = page.locator(".chest-art img");
  await expect(chest).toBeVisible();
  await expect.poll(() => chest.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);

  const atlasImage = await page.locator(".atlas-art").first().evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(atlasImage).toContain("/assets/");
  expect(failedAssets).toEqual([]);

  const geometry = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, viewportWidth: window.innerWidth }));
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);

  if (appUrl.includes("/ydxz-single-player/")) {
    await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.scope || "")).toContain("/ydxz-single-player/");
  }
});
