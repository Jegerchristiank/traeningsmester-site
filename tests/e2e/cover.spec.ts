import { expect, test } from "@playwright/test";

test("the photographic cover reaches every edge and keeps signup in reach", async ({
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
        [320, 568],
        [320, 740],
        [390, 844],
        [820, 1024],
      ];
  // The fallback font paints on a cold connection. Its wrapping must keep
  // the headline in place when the brand font arrives.
  let releaseFonts!: () => void;
  const fontGate = new Promise<void>((resolve) => {
    releaseFonts = resolve;
  });
  await page.route("**/*.woff2", async (route) => {
    await fontGate;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const title = page.locator("#hero-title");
  const fallbackTitle = await title.boundingBox();
  releaseFonts();
  await page.evaluate(() => document.fonts.ready);
  const loadedTitle = await title.boundingBox();
  expect(Math.abs(loadedTitle!.y - fallbackTitle!.y)).toBeLessThan(3);
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    await page
      .locator(".focus-photo")
      .evaluate((el: HTMLImageElement) => el.decode());
    const data = await page.evaluate(() => {
      const box = (selector: string) => {
        const el = document.querySelector(selector)!;
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      };
      const title = document.createRange();
      title.selectNodeContents(document.querySelector("h1")!);
      const cta =
        document.querySelector<HTMLAnchorElement>(".hero-access-link")!;
      const trigger = cta.getBoundingClientRect();
      const hit = document.elementFromPoint(
        trigger.x + trigger.width / 2,
        trigger.y + trigger.height / 2,
      );
      return {
        width: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        headingFits: Array.from(title.getClientRects()).every(
          (r) => r.left >= -1 && r.right <= innerWidth + 1,
        ),
        hero: box(".story-hero"),
        photo: box(".focus-photo"),
        photoFit: getComputedStyle(document.querySelector(".focus-photo")!)
          .objectFit,
        trigger: box(".hero-access-link"),
        hitTarget: hit !== null && cta.contains(hit),
        singleForm: document.forms.length,
      };
    });
    expect(data.document, `horizontal overflow at ${width}`).toBe(data.width);
    for (const box of [data.hero, data.photo]) {
      expect(box.left, `left edge at ${width}`).toBeLessThanOrEqual(1);
      expect(box.top, `top edge at ${width}`).toBeLessThanOrEqual(1);
      expect(box.right, `right edge at ${width}`).toBeGreaterThanOrEqual(
        data.width - 1,
      );
      expect(
        box.bottom,
        `bottom edge at ${width}×${height}`,
      ).toBeGreaterThanOrEqual(height - 1);
    }
    expect(data.headingFits).toBe(true);
    expect(data.photoFit).toBe("cover");
    expect(data.trigger.top).toBeGreaterThanOrEqual(0);
    expect(data.trigger.bottom).toBeLessThanOrEqual(height);
    expect(data.trigger.bottom - data.trigger.top).toBeGreaterThanOrEqual(44);
    expect(data.hitTarget).toBe(true);
    expect(data.singleForm).toBe(1);
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
  const heading = page.locator("#feature-heading");
  await expect(heading).toBeInViewport();
  const header = page.locator(".cover-header");
  await expect(header).toHaveAttribute("data-scrolled", /.+/);
  await expect
    .poll(async () => {
      const title = await heading.boundingBox();
      const mast = await header.boundingBox();
      return Boolean(title && mast && title.y >= mast.y + mast.height - 1);
    })
    .toBe(true);
  if (mobile) await expect(page.locator("#funktioner")).toBeFocused();
});

test("ordinary scrolling changes the frosted header and scrolling back restores it", async ({
  page,
}) => {
  await page.goto("/");
  const header = page.locator(".cover-header");
  await expect(page.locator(".cover-header[data-scrolled]")).toHaveCount(0);
  const frost = await header.evaluate((el) =>
    [getComputedStyle(el), getComputedStyle(el, "::before")].some((style) =>
      /blur\([1-9]/.test(style.backdropFilter),
    ),
  );
  expect(frost).toBe(true);
  const tint = () =>
    header.evaluate((el) => {
      const base = getComputedStyle(el),
        layer = getComputedStyle(el, "::before");
      return [
        base.color,
        base.backgroundColor,
        layer.backgroundColor,
        layer.opacity,
      ].join(" ");
    });
  const photoClip = () =>
    page
      .locator(".cover-visual")
      .evaluate((el) => getComputedStyle(el).clipPath);
  const initialTint = await tint();
  const initialHeight = (await header.boundingBox())!.height;
  const initialClip = await photoClip();
  const scroll = Math.round((page.viewportSize()?.height ?? 900) * 0.55);
  await page.mouse.wheel(0, scroll);
  await expect(page.locator(".cover-header[data-scrolled]")).toBeInViewport();
  await expect.poll(tint).not.toBe(initialTint);
  await expect
    .poll(async () => (await header.boundingBox())!.height)
    .toBeLessThan(initialHeight - 1);
  if (await page.evaluate(() => CSS.supports("animation-timeline: view()")))
    await expect.poll(photoClip).not.toBe(initialClip);
  const mast = await header.boundingBox();
  expect(mast!.y).toBeGreaterThanOrEqual(-1);
  expect(mast!.y).toBeLessThan(32);
  await page.mouse.wheel(0, -(scroll + 100));
  await expect(page.locator(".cover-header[data-scrolled]")).toHaveCount(0);
  await expect.poll(tint).toBe(initialTint);
  await expect.poll(photoClip).toBe(initialClip);
});

test("the film loads on demand and returns focus and playback control on close", async ({
  page,
}, info) => {
  const mediaRequests: string[] = [];
  page.on("request", (request) => {
    if (/\.(?:mp4|webm)(?:\?|$)/i.test(request.url()))
      mediaRequests.push(request.url());
  });
  await page.goto("/", { waitUntil: "networkidle" });
  const trigger = page.locator('[aria-controls="workout-film"]');
  expect(mediaRequests).toHaveLength(0);
  if (info.project.name === "mobile") {
    await trigger.tap();
  } else {
    await trigger.focus();
    await page.keyboard.press("Enter");
  }
  const dialog = page.locator("#workout-film");
  await expect(dialog).toBeVisible();
  const video = dialog.locator("video");
  await expect(video).toBeVisible();
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime))
    .toBeGreaterThan(0);
  expect(mediaRequests.length).toBeGreaterThan(0);
  if (info.project.name === "mobile")
    await dialog.getByRole("button", { name: /luk/i }).tap();
  else await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.paused))
    .toBe(true);
});

test("reduced motion keeps the photograph still during native scrolling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const poster = page.locator(".focus-photo");
  const readPhoto = () =>
    poster.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const hero = el.closest(".story-hero")!.getBoundingClientRect();
      return [
        Math.round(rect.top - hero.top),
        Math.round(rect.left - hero.left),
        Math.round(rect.width),
        Math.round(rect.height),
        getComputedStyle(el.closest(".cover-visual")!).clipPath,
      ];
    });
  const top = await readPhoto();
  await page.mouse.wheel(0, 240);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  expect(await readPhoto()).toEqual(top);
});

test.describe("Pre-rendered training example", () => {
  test.use({ javaScriptEnabled: false });
  test("the full photograph and the program, earlier set and current set are available without JavaScript", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeInViewport();
    const photo = page.locator(".focus-photo");
    await expect(photo).toBeInViewport();
    await photo.evaluate((image: HTMLImageElement) => image.decode());
    const nav = page.getByRole("navigation", { name: "Hovednavigation" });
    const menu = nav.locator("summary");
    if (await menu.isVisible()) await menu.click();
    await nav.getByRole("link", { name: "Sådan virker appen" }).click();
    await expect(page.locator("#workout-story-heading")).toBeInViewport();
    const story = page.locator("#traeningsforloeb");
    await expect(story.locator("#dit-program img")).toHaveAccessibleName(
      /Overkrop A.*Bænkpres.*60 kg/,
    );
    await expect(story).toContainText("Eksempeldata");
    await story.getByRole("link", { name: "Sæt og pause" }).click();
    const set = story.locator("#dit-saet img");
    await expect(set).toBeInViewport();
    await expect(set).toHaveAccessibleName(/62,5 kg.*60 kg × 8/);
  });
});
