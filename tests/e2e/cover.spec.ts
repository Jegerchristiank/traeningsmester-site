import { expect, test } from "@playwright/test";

test("the cover uses the available screen and keeps its controls and example legible", async ({
  page,
}, testInfo) => {
  const landscape = testInfo.project.name === "desktop";
  const viewports = landscape
    ? [
        [1440, 720],
        [1920, 720],
        [1920, 1080],
        [2560, 1080],
        [3440, 900],
        [3440, 1440],
        [3840, 1080],
        [5120, 1440],
      ]
    : [
        [320, 740],
        [390, 844],
        [820, 1024],
      ];
  await page.goto("/");
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    const data = await page.evaluate(() => {
      const box = (selector: string) => {
        const el = document.querySelector(selector)!;
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      };
      const title = document.createRange();
      title.selectNodeContents(document.querySelector("h1")!);
      return {
        width: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        headingFits: Array.from(title.getClientRects()).every(
          (r) => r.left >= -1 && r.right <= innerWidth + 1,
        ),
        layout: box(".story-hero"),
        hero: box(".story-hero"),
        trigger: box(".hero-access-link"),
        app: box(".focus-photo"),
        singleForm: document.forms.length,
      };
    });
    expect(data.document, `horizontal overflow at ${width}`).toBe(data.width);
    expect(data.layout.left).toBe(0);
    expect(data.layout.right).toBe(data.width);
    expect(data.headingFits).toBe(true);
    expect(data.trigger.bottom).toBeLessThanOrEqual(height);
    expect(data.singleForm).toBe(1);
    expect(data.app.left).toBeGreaterThanOrEqual(0);
    expect(data.app.right).toBeLessThanOrEqual(data.width);
    if (landscape) {
      expect(
        data.hero.bottom,
        `full first screen at ${width}`,
      ).toBeGreaterThanOrEqual(height - 1);
      expect(
        data.app.bottom,
        `complete set at ${width}×${height}`,
      ).toBeLessThanOrEqual(height + 1);
    }
  }
});

test("visitors can jump to the feature index or close mobile navigation with the keyboard", async ({
  page,
}, info) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Hovednavigation" });
  const mobile = info.project.name === "mobile";
  if (mobile) {
    const toggle = nav.locator("summary");
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(nav.getByRole("link", { name: "Funktioner" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(toggle).toBeFocused();
    await expect(nav.getByRole("link", { name: "Funktioner" })).toHaveCount(0);
    await toggle.click();
  }
  await nav.getByRole("link", { name: "Funktioner" }).click();
  await expect(page).toHaveURL(/#funktioner$/);
  await expect(page.locator("#feature-heading")).toBeInViewport();
  if (mobile) await expect(page.locator("#funktioner")).toBeFocused();
});

test.describe("Pre-rendered training example", () => {
  test.use({ javaScriptEnabled: false });
  test("exercise, past weight, current weight and the app image are on the first page", async ({
    page,
  }) => {
    await page.goto("/");
    const image = page.getByRole("img", { name: /I programmet Overkrop A/ });
    await expect(image).toBeVisible();
    await expect(image).toHaveAccessibleName(/60 kg × 8.*62,5 kg/);
    await expect(page.locator(".hero-example figcaption")).toContainText(
      "Eksempeldata",
    );
    const nav = page.getByRole("navigation", { name: "Hovednavigation" });
    const menu = nav.locator("summary");
    if (await menu.isVisible()) await menu.click();
    await nav.getByRole("link", { name: "Sådan virker appen" }).click();
    await expect(page.locator("#workout-story-heading")).toBeInViewport();
  });
});
