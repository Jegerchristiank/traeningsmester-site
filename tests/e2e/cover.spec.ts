import { expect, test, type Page } from "@playwright/test";

const backgroundMovie = /\/product\/cover\/saet-(landskab|portraet)\.mp4$/;
const workoutMovie = /\/product\/film\/baenkpres-(bred|hoej)\.mp4$/;

function requestedCoverMovies(page: Page) {
  const paths = new Set<string>();
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (backgroundMovie.test(path)) paths.add(path);
  });
  return paths;
}

function requestedWorkoutMovies(page: Page) {
  const paths = new Set<string>();
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (workoutMovie.test(path)) paths.add(path);
  });
  return paths;
}

async function expectPlayingWorkoutFilm(page: Page, mobile: boolean) {
  const film = page.locator("#workout-film");
  await expect.poll(() => film.evaluate((el: HTMLVideoElement) =>
    !el.paused && el.currentTime > 0.1 && el.readyState >= 2,
  )).toBe(true);
  const media = await film.evaluate((el: HTMLVideoElement) => ({
    controls: el.controls,
    muted: el.muted,
    volume: el.volume,
    duration: el.duration,
    source: new URL(el.currentSrc).pathname,
    width: el.videoWidth,
    height: el.videoHeight,
  }));
  expect(media.controls).toBe(true);
  expect(media.muted).toBe(false);
  expect(media.volume).toBeGreaterThan(0);
  expect(media.duration).toBeCloseTo(40, 1);
  expect(media.source).toBe(`/product/film/baenkpres-${mobile ? "hoej" : "bred"}.mp4`);
  expect(mobile ? media.height > media.width : media.width > media.height).toBe(true);
  await expect.poll(() => film.evaluate((el) =>
    (el as HTMLVideoElement & { webkitAudioDecodedByteCount: number }).webkitAudioDecodedByteCount,
  )).toBeGreaterThan(0);
  const captions = film.locator('track[srclang="da"]');
  await expect(captions).toHaveCount(1);
  await expect(captions).toHaveAttribute("kind", /^(captions|subtitles)$/);
  await expect(captions).toHaveAttribute("label", "Dansk");
  await expect(captions).toHaveAttribute("src", /\.vtt$/);
  await captions.evaluate((el: HTMLTrackElement) => { el.track.mode = "hidden"; });
  await expect.poll(() => captions.evaluate((el: HTMLTrackElement) => ({
    state: el.readyState,
    hasCues: (el.track.cues?.length || 0) > 0,
  }))).toEqual({ state: 2, hasCues: true });
}

test("the poster and background film reach every edge and keep signup in reach", async ({
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
        video: box(".cover-video"),
        photoFit: getComputedStyle(document.querySelector(".focus-photo")!)
          .objectFit,
        videoFit: getComputedStyle(document.querySelector(".cover-video")!)
          .objectFit,
        trigger: box(".hero-access-link"),
        hitTarget: hit !== null && cta.contains(hit),
        singleForm: document.forms.length,
      };
    });
    expect(data.document, `horizontal overflow at ${width}`).toBe(data.width);
    for (const box of [data.hero, data.photo, data.video]) {
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
    expect(data.videoFit).toBe("cover");
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

test("the hero starts the narrated bench film from one ordinary link activation", async ({
  page,
}, info) => {
  const requested = requestedWorkoutMovies(page);
  await page.goto("/", { waitUntil: "networkidle" });
  expect(requested.size).toBe(0);
  const trigger = page.locator(".story-hero").getByRole("link", {
    name: /^Se bænkpres i appen/,
  });
  await expect(trigger).toHaveAttribute("href", "#traeningsforloeb");
  await expect(trigger).not.toHaveAttribute("aria-haspopup", "dialog");
  await expect(trigger).toBeInViewport();
  if (info.project.name === "mobile") await trigger.tap();
  else {
    await trigger.focus();
    await page.keyboard.press("Enter");
  }
  await expect(page).toHaveURL(/#traeningsforloeb$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const section = page.locator("#traeningsforloeb");
  await expect(page.locator("#workout-film")).toBeInViewport();
  await expectPlayingWorkoutFilm(page, info.project.name === "mobile");
  expect(requested.size).toBe(1);
  await page.screenshot({ path: `/tmp/tm-site-evidence/bench-film-${info.project.name}-playing.png` });
  await page.locator("#workout-film").evaluate((el: HTMLVideoElement) => el.pause());

  const nav = page.getByRole("navigation", { name: "Hovednavigation" });
  const menu = nav.locator("summary");
  if (await menu.isVisible()) await menu.click();
  await nav.getByRole("link", { name: "Funktioner", exact: true }).click();
  await expect(page.locator("#feature-heading")).toBeInViewport();
  await page.goBack();
  await expect(page).toHaveURL(/#traeningsforloeb$/);
  await expect(section).toBeInViewport();
  await page.goForward();
  await expect(page.locator("#feature-heading")).toBeInViewport();
});

test("a direct film link shows the poster until a deliberate play and offers the optional set", async ({ page }, info) => {
  const requested = requestedWorkoutMovies(page);
  await page.goto("/#traeningsforloeb", { waitUntil: "networkidle" });
  const section = page.locator("#traeningsforloeb");
  const film = page.locator("#workout-film");
  await expect(section.getByRole("heading", { name: "Hvad løftede jeg sidst?", exact: true })).toBeInViewport();
  const poster = section.locator("picture img");
  await expect(poster).toBeInViewport();
  await poster.evaluate((el: HTMLImageElement) => el.decode());
  expect(await poster.evaluate((el: HTMLImageElement) => new URL(el.currentSrc).pathname))
    .toBe(`/product/film/kridt-${info.project.name === "mobile" ? "hoej" : "bred"}.webp`);
  await expect(film).toBeHidden();
  await expect.poll(() => film.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
  expect(requested.size).toBe(0);
  const play = section.getByRole("link", { name: "Afspil filmen", exact: true });
  await expect(play).toHaveAttribute("href", /\/baenkpres-(bred|hoej)\.mp4$/);
  await expect(play).toBeInViewport();
  await page.screenshot({ path: `/tmp/tm-site-evidence/bench-film-${info.project.name}-poster.png` });
  await play.click();
  await expectPlayingWorkoutFilm(page, info.project.name === "mobile");
  await film.evaluate((el: HTMLVideoElement) => el.pause());
  const disclosure = page.locator("summary").filter({ hasText: /^Prøv sættet selv/ });
  await expect(page.locator("#baenkpres-log")).toBeHidden();
  await disclosure.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#baenkpres-log")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Vægt for sæt 1", exact: true })).toBeEnabled();
  expect(requested.size).toBe(1);
});

test("the selected background plays silently and honours pause when leaving and returning to the cover", async ({
  page,
}, info) => {
  const requested = requestedCoverMovies(page);
  await page.goto("/");
  const player = page.locator(".cover-video");
  const button = page.getByRole("button", {
    name: "Sæt baggrundsfilmen på pause",
  });
  const progress = () =>
    player.evaluate((el: HTMLVideoElement) => el.currentTime);
  const paused = () => player.evaluate((el: HTMLVideoElement) => el.paused);
  await expect.poll(progress).toBeGreaterThan(0);
  await expect(button).toBeVisible();
  const file =
    info.project.name === "mobile" ? "saet-portraet.mp4" : "saet-landskab.mp4";
  expect([...requested]).toEqual(["/product/cover/" + file]);
  expect(
    await player.evaluate(
      (el: HTMLVideoElement) => el.muted && el.playsInline && el.loop,
    ),
  ).toBe(true);
  const tapArea = await button.boundingBox();
  expect(tapArea!.width).toBeGreaterThanOrEqual(44);
  expect(tapArea!.height).toBeGreaterThanOrEqual(44);
  await button.focus();
  await page.keyboard.press("Space");
  await expect.poll(paused).toBe(true);
  await expect(
    page.getByRole("button", { name: "Afspil baggrundsfilmen" }),
  ).toBeFocused();
  const held = await progress();
  await page.locator(".story-footer").scrollIntoViewIfNeeded();
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator(".cover-header[data-scrolled]")).toHaveCount(0);
  expect(await progress()).toBe(held);
  await page.getByRole("button", { name: "Afspil baggrundsfilmen" }).click();
  await expect.poll(progress).toBeGreaterThan(held);
  await page.locator(".story-footer").scrollIntoViewIfNeeded();
  await expect.poll(paused).toBe(true);
  await page.evaluate(() => scrollTo(0, 0));
  await expect.poll(paused).toBe(false);
  const rotated = info.project.name === "mobile" ? "landskab" : "portraet";
  await page.setViewportSize(
    rotated === "portraet"
      ? { width: 820, height: 1024 }
      : { width: 1024, height: 820 },
  );
  await expect(player).toHaveAttribute(
    "src",
    "/product/cover/saet-" + rotated + ".mp4",
  );
  await expect.poll(progress).toBeGreaterThan(0);
  await expect
    .poll(() =>
      page
        .locator(".focus-photo")
        .evaluate((el: HTMLImageElement) => new URL(el.currentSrc).pathname),
    )
    .toBe("/product/cover/saet-" + rotated + ".webp");
});

test("reduced motion keeps the photograph still during native scrolling", async ({
  page,
}) => {
  const requests = requestedCoverMovies(page);
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
  await expect(page.locator(".cover-motion-toggle")).toBeHidden();
  expect(requests.size).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect
    .poll(() =>
      page
        .locator(".cover-video")
        .evaluate((el: HTMLVideoElement) => el.currentTime),
    )
    .toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".cover-video")).not.toHaveAttribute("src", /.+/);
  await expect(page.locator(".cover-visual")).not.toHaveAttribute(
    "data-has-frame",
    /.+/,
  );
});

test("data saver keeps the first frame and makes no background media request", async ({
  page,
}) => {
  const requests = requestedCoverMovies(page);
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: Object.assign(new EventTarget(), { saveData: true }),
    }),
  );
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(".hero-access-link")).toBeInViewport();
  await expect(page.locator(".cover-motion-toggle")).toBeHidden();
  await expect(page.locator(".cover-video")).not.toHaveAttribute("src", /.+/);
  expect(requests.size).toBe(0);
});

test("when the film fails to load the first frame and signup stay usable", async ({
  page,
}) => {
  await page.route(backgroundMovie, (route) => route.abort("failed"));
  await page.goto("/");
  await expect
    .poll(() =>
      page
        .locator(".cover-video")
        .evaluate((el: HTMLVideoElement) => Boolean(el.error)),
    )
    .toBe(true);
  await page
    .locator(".focus-photo")
    .evaluate((el: HTMLImageElement) => el.decode());
  await expect(page.locator(".cover-visual picture")).toHaveCSS("opacity", "1");
  await expect(page.locator(".cover-motion-toggle")).toBeHidden();
  await page.locator(".hero-access-link").click();
  await expect(page.getByLabel("Din e-mail")).toBeFocused();
});

test("a browser that declines autoplay can start the background by an explicit tap", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const nativePlay = HTMLMediaElement.prototype.play;
    let declined = false;
    HTMLMediaElement.prototype.play = function () {
      if (!declined && this.id === "cover-film") {
        declined = true;
        return Promise.reject(
          new DOMException("Autoplay blocked", "NotAllowedError"),
        );
      }
      return nativePlay.call(this);
    };
  });
  await page.goto("/");
  await expect(page.locator(".cover-visual")).not.toHaveAttribute(
    "data-has-frame",
    /.+/,
  );
  await page.getByRole("button", { name: "Afspil baggrundsfilmen" }).click();
  await expect
    .poll(() =>
      page
        .locator(".cover-video")
        .evaluate((el: HTMLVideoElement) => el.currentTime),
    )
    .toBeGreaterThan(0);
  await expect(
    page.getByRole("button", { name: "Sæt baggrundsfilmen på pause" }),
  ).toBeVisible();
});

test.describe("Pre-rendered training film", () => {
  test.use({ javaScriptEnabled: false });
  test("the photograph, film link and optional example remain useful without JavaScript", async ({ page }) => {
    const background = requestedCoverMovies(page);
    const movies = requestedWorkoutMovies(page);
    await page.goto("/");
    await expect(page.locator("h1")).toBeInViewport();
    const photo = page.locator(".focus-photo");
    await expect(photo).toBeInViewport();
    await photo.evaluate((image: HTMLImageElement) => image.decode());
    const trigger = page.locator(".story-hero").getByRole("link", { name: /^Se bænkpres i appen/ });
    await expect(trigger).toHaveAttribute("href", "#traeningsforloeb");
    await trigger.click();
    const section = page.locator("#traeningsforloeb");
    await expect(section.getByRole("heading", { name: "Hvad løftede jeg sidst?", exact: true })).toBeInViewport();
    const fallback = section.locator('a[href^="/product/film/"][href$=".mp4"]').first();
    await expect(fallback).toBeVisible();
    await expect(fallback).toHaveAttribute("href", /\/baenkpres-(bred|hoej)\.mp4$/);
    const disclosure = page.locator("summary").filter({ hasText: /^Prøv sættet selv/ });
    await disclosure.click();
    const story = page.locator("#baenkpres-log");
    await expect(story).toBeVisible();
    await expect(story).toContainText("Eksempeltræning");
    await expect(story.locator("dd").filter({ hasText: /^60\s*kg/ })).toBeVisible();
    await expect(story.locator("dd").filter({ hasText: /^62,5\s*kg/ })).toBeVisible();
    expect(background.size).toBe(0);
    expect(movies.size).toBe(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
