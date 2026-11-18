import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // No test can reach a real waitlist/mail transport.
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ status: 503, json: { ok: false } }),
  );
  await page.route("https://eu.i.posthog.com/**", (route) =>
    route.fulfill({ status: 200, json: { status: 1 } }),
  );
});

test("first screen is readable, single signup, images load and no runtime errors", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(
    "Træningsmester — Træn videre fra sidste gang.",
  );
  await expect(page.locator("h1")).toHaveText(
    /Træn videre\s*fra sidste\s*gang\./,
  );
  await expect(page.locator(".hero-access-link")).toBeInViewport();
  await expect(page.locator(".access-form")).toBeHidden();
  await expect(page.locator("form")).toHaveCount(1);
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator(".focus-photo")
    .evaluate((img) => (img as HTMLImageElement).decode());
  await expect(page.locator(".focus-photo")).toBeInViewport({ ratio: 1 });
  await page.screenshot({
    path: `/tmp/tm-site-evidence/${testInfo.project.name}-hero-final.png`,
  });
  for (const target of [
    "#traeningsforloeb",
    "#funktioner",
    "#faq",
    ".story-footer",
  ]) {
    await page.locator(target).scrollIntoViewIfNeeded();
  }
  await expect
    .poll(() =>
      page.evaluate(() =>
        Array.from(document.images)
          .filter(
            (img) =>
              !img.closest("details:not([open])") &&
              img.getBoundingClientRect().width > 0,
          )
          .every((img) => img.complete && img.naturalWidth > 0),
      ),
    )
    .toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("field errors preserve values and server errors never claim success", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".hero-access-link").click();
  const input = page.getByLabel("Din e-mail", { exact: true });
  const submit = page.getByRole("button", { name: "Få besked om adgang" });
  await input.fill("forkert");
  await submit.click();
  await expect(input).toBeFocused();
  await expect(page.locator("#access-error")).toContainText(
    "gyldig e-mailadresse",
  );
  await input.fill("demo@example.test");
  await submit.click();
  await expect(page.locator("#access-consent-error")).toBeVisible();
  await page.locator("#access-consent").check();
  for (const [status, body, message] of [
    [503, { ok: false }, "kunne ikke bekræftes"],
    [429, { code: "RATE_LIMITED" }, "for mange"],
    [200, { ok: true }, "kunne ikke bekræftes"],
  ] as const) {
    await page.route("**/api/waitlist", (route) =>
      route.fulfill({ status, json: body }),
    );
    await submit.click();
    await expect(page.locator("#access-error")).toContainText(message);
    await expect(input).toHaveValue("demo@example.test");
    await expect(page.getByText("Du er skrevet op.")).toHaveCount(0);
  }
  await page.route("**/api/waitlist", (route) =>
    route.abort("internetdisconnected"),
  );
  await submit.click();
  await expect(page.locator("#access-error")).toContainText(
    "kunne ikke få svar",
  );
  await expect(input).toHaveValue("demo@example.test");
});

test("only accepted response confirms once; sharing is a separate action", async ({
  page,
}, testInfo) => {
  let requests = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/waitlist", async (route) => {
    requests++;
    await gate;
    await route.fulfill({ json: { ok: true, confirmation: "accepted" } });
  });
  await page.goto("/");
  await page.locator(".closing-action").click();
  await expect(page.locator("#access-email")).toBeFocused();
  await page
    .getByLabel("Din e-mail", { exact: true })
    .fill("demo@example.test");
  await page.locator(".access-submit").click();
  await expect(page.locator("#access-consent-error")).toBeVisible();
  await page.locator("#access-consent").check();
  await page.getByRole("button", { name: "Få besked om adgang" }).click();
  await expect(page.getByRole("button", { name: "Sender…" })).toBeDisabled();
  await expect(page.getByText("Du er skrevet op.")).toHaveCount(0);
  release();
  await expect(
    page.getByRole("heading", { name: "Du er skrevet op." }),
  ).toBeInViewport({ ratio: 1 });
  await expect(page.locator(".access-success h2")).toBeFocused();
  await expect(page.locator(".access-success")).toContainText(
    "Vi skriver til demo@example.test, når der er nyt om adgang.",
  );
  expect(requests).toBe(1);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async () => {} },
      configurable: true,
    });
  });
  await page.getByRole("button", { name: "Del Træningsmester" }).click();
  await expect(page.getByText("Linket er kopieret.")).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: `/tmp/tm-site-evidence/${testInfo.project.name}-signup-success.png`,
  });
  await page.keyboard.press("Escape");
  await expect(page.locator(".closing-action")).toBeFocused();
  await page.locator(".closing-action").click();
  await expect(page.locator(".access-success h2")).toBeFocused();
  expect(requests).toBe(1);
});

test("keyboard can reach form, open features and return from final CTA", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".story-skip")).toBeFocused();
  const trigger = page.locator(".hero-access-link");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Din e-mail", { exact: true })).toBeFocused();
  await page
    .getByLabel("Din e-mail", { exact: true })
    .fill("bevar@example.test");
  await page.keyboard.press("Tab");
  await expect(page.locator("#access-consent")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(".access-submit")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  const summary = page.locator(".all-features > summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".feature-overview")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator(".feature-overview")).not.toBeVisible();
  await page.locator(".closing-action").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Din e-mail", { exact: true })).toBeFocused();
  await expect(page.locator("#access-email")).toHaveValue("bevar@example.test");
  await page.getByRole("button", { name: "Luk vinduet" }).click();
  await expect(page.locator(".closing-action")).toBeFocused();
  await page.goto("/#adgang");
  await expect(page.locator("#access-email")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#access-dialog")).toBeHidden();
  await expect(page.locator(".hero-access-link")).toBeFocused();
});

test("compact workout story follows one exercise through direct choices", async ({
  page,
}, testInfo) => {
  const motionRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/Flip-[^/]+\.js/.test(request.url()))
      motionRequests.push(request.url());
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#traeningsforloeb");
  await expect(page).toHaveTitle(/Træningsmester/);
  const story = page.locator(".workout-story");
  await expect(story).toHaveAttribute("data-enhanced", "true");
  await expect(story.locator(".ws-panel:visible")).toHaveCount(1);
  await expect(story.locator("#dit-program")).toBeVisible();
  await expect(story.locator(".ws-nav a")).toHaveText([
    "Program",
    "Sæt og pause",
    "Historik",
  ]);
  await expect(
    story.locator(".ws-stage, [data-reading-step], [role=meter]"),
  ).toHaveCount(0);
  await expect(story).toContainText(
    "Eksempeldata · Appvisningerne er rekonstrueret.",
  );
  await expect(story.locator("h2, h3, h4")).toHaveCount(1);
  await story.scrollIntoViewIfNeeded();
  await story
    .locator("#dit-program img")
    .evaluate((img) => (img as HTMLImageElement).decode());
  await story.screenshot({
    path: `/tmp/tm-site-evidence/story-${testInfo.project.name}-program.png`,
  });
  await page.screenshot({
    path: `/tmp/tm-site-evidence/story-${testInfo.project.name}-page.png`,
    fullPage: true,
  });

  expect(motionRequests).toHaveLength(0);
  const chapter = story.getByRole("link", {
    name: "Sæt og pause",
    exact: true,
  });
  await chapter.focus();
  await expect.poll(() => motionRequests.length).toBe(1);
  const before = await page.evaluate(() => scrollY);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#dit-saet$/);
  await expect(chapter).toBeFocused();
  await expect(chapter).toHaveAttribute("aria-current", "step");
  await expect(story.locator("#dit-saet img")).toHaveAttribute(
    "src",
    "/product/revision-detail-set.webp",
  );
  expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThan(
    3,
  );
  await expect(story.locator(".ws-panel:visible")).toHaveCount(1);
  await story
    .locator("#dit-saet img")
    .evaluate((img) => (img as HTMLImageElement).decode());
  await story.screenshot({
    path: `/tmp/tm-site-evidence/story-${testInfo.project.name}-set.png`,
  });

  await story.getByRole("link", { name: "Se pausen" }).click();
  await expect(page).toHaveURL(/#din-pause$/);
  await expect(story.locator("#din-pause")).toBeFocused();
  await expect(chapter).toHaveAttribute("aria-current", "step");
  await expect(story.locator("#din-pause img")).toHaveAttribute(
    "alt",
    /62,5 kg × 8.*01:42/,
  );
  await expect(story.locator(".ws-panel:visible")).toHaveCount(1);
  await story
    .locator("#din-pause img")
    .evaluate((img) => (img as HTMLImageElement).decode());
  await story.screenshot({
    path: `/tmp/tm-site-evidence/story-${testInfo.project.name}-pause.png`,
  });
  await page.keyboard.press("Tab");
  await expect(
    story.getByRole("link", { name: "Se historikken", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(story.locator("#din-historik")).toBeFocused();
  await expect(story.locator("#din-historik img")).toHaveAttribute(
    "src",
    "/product/story-history-detail.webp",
  );
  await expect(story.locator("#din-historik img")).toHaveAttribute(
    "alt",
    /62,5 kg × 8/,
  );
  await expect(story.locator(".ws-panel:visible")).toHaveCount(1);
  await story
    .locator("#din-historik img")
    .evaluate((img) => (img as HTMLImageElement).decode());
  await story.screenshot({
    path: `/tmp/tm-site-evidence/story-${testInfo.project.name}-history.png`,
  });
  await page.goBack();
  await expect(story.locator("#din-pause")).toBeVisible();
  await page.goForward();
  await expect(story.locator("#din-historik")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("workout story preserves deep links and static reduced-motion states", async ({
  page,
}) => {
  const motionRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/Flip-[^/]+\.js/.test(request.url()))
      motionRequests.push(request.url());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const anchor of [
    "dit-program",
    "dit-saet",
    "din-pause",
    "din-historik",
  ]) {
    await page.goto(`/#${anchor}`);
    const story = page.locator(".workout-story");
    await expect(story.locator(".ws-panel:visible")).toHaveCount(1);
    await expect(story.locator(`#${anchor}`)).toBeInViewport();
    await expect(story.locator(`#${anchor} img`)).toHaveCSS(
      "transform",
      "none",
    );
    await expect(story.locator("video")).toHaveCount(0);
  }
  const story = page.locator(".workout-story");
  await story.getByRole("link", { name: "Sæt og pause", exact: true }).click();
  await story.getByRole("link", { name: "Se pausen" }).click();
  await expect(story.locator("#din-pause img")).toHaveCSS("transform", "none");
  await expect(story.locator("#din-pause")).toBeFocused();
  expect(motionRequests).toHaveLength(0);
});

test.describe("workout story without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("native chapter links show one complete example at a time", async ({
    page,
  }) => {
    await page.goto("/#traeningsforloeb");
    const story = page.locator(".workout-story");
    await expect(story.locator("#dit-program")).toBeVisible();
    await expect(story.locator(".ws-panel:visible")).toHaveCount(1);
    await story.getByRole("link", { name: "Se sættet", exact: true }).click();
    await expect(story.locator("#dit-saet")).toBeVisible();
    await story.getByRole("link", { name: "Se pausen" }).click();
    await expect(story.locator("#din-pause")).toBeVisible();
    await expect(story.locator(".ws-panel:visible")).toHaveCount(1);
    await story
      .getByRole("link", { name: "Se historikken", exact: true })
      .click();
    await expect(story.locator("#din-historik")).toBeVisible();
    await page.goto("/#din-pause");
    await expect(story.locator("#din-pause")).toBeVisible();
    await expect(story.locator(".ws-panel:visible")).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
});

test("the workout example uses the available width and keeps the next step in reading order", async ({
  page,
}, testInfo) => {
  const onDesktop = testInfo.project.name === "desktop";
  const size = onDesktop
    ? { width: 3440, height: 1440 }
    : { width: 390, height: 844 };
  await page.setViewportSize(size);
  await page.goto("/#traeningsforloeb");
  const story = page.locator(".workout-story");
  await story
    .locator("#dit-program img")
    .evaluate((img) => (img as HTMLImageElement).decode());
  const product = await story.locator("#dit-program img").boundingBox();
  const heading = await story.locator("h2").boundingBox();
  const section = await story.boundingBox();
  expect(section?.width).toBe(size.width);
  if (onDesktop) {
    expect(product!.width).toBeGreaterThan(1000);
    expect(heading!.x).toBeGreaterThan(product!.x + product!.width);
    expect(product!.x).toBeCloseTo(size.width * 0.05, 0);
  } else {
    const controls = await story.locator("nav").boundingBox();
    const caption = await story
      .locator(".ws-description:visible")
      .boundingBox();
    expect(heading!.y + heading!.height).toBeLessThanOrEqual(controls!.y);
    expect(controls!.y + controls!.height).toBeLessThanOrEqual(product!.y);
    expect(product!.y + product!.height).toBeLessThanOrEqual(caption!.y);
  }
  await story.getByRole("link", { name: "Se sættet", exact: true }).click();
  await expect(story.locator("#dit-saet")).toBeFocused();
  await expect(page).toHaveURL(/#dit-saet$/);
  await expect(story.locator(".ws-panel:visible")).toHaveCount(1);
});

test("statistics are opt-in, payloads exclude personal content and withdrawal stops events", async ({
  page,
}) => {
  const payloads: Record<string, unknown>[] = [];
  await page.route("https://eu.i.posthog.com/**", async (route) => {
    payloads.push(route.request().postDataJSON());
    await route.fulfill({ json: { status: 1 } });
  });
  await page.goto("/");
  await page.locator(".hero-access-link").click();
  await page.locator(".access-submit").click();
  await page.keyboard.press("Escape");
  expect(payloads).toHaveLength(0);
  await page.locator(".analytics-consent summary").click();
  await page.locator(".analytics-consent input").check();
  await expect.poll(() => payloads.length).toBe(1);
  await page.locator(".closing-action").click();
  await page
    .getByLabel("Din e-mail", { exact: true })
    .fill("private@example.test");
  await page.locator(".access-submit").click();
  await expect.poll(() => payloads.length).toBe(3);
  expect(JSON.stringify(payloads)).not.toMatch(
    /private@|workout|training_data|current_url/,
  );
  expect(payloads.map((p) => p.event)).toEqual([
    "marketing_visitor",
    "marketing_attempt",
    "marketing_error",
  ]);
  await page.keyboard.press("Escape");
  await page.locator(".analytics-consent input").uncheck();
  await page.locator(".closing-action").click();
  await page.locator(".access-submit").click();
  expect(payloads).toHaveLength(3);
});

test("public support, deletion and withdrawal routes and app boundary remain available", async ({
  page,
}) => {
  for (const [route, heading] of [
    ["/support", "Support"],
    ["/slet-konto", "Slet konto"],
    ["/privatliv", "Privatliv"],
    ["/vilkaar", "Vilkår"],
    ["/afmeld", "Afmeld ventelisten"],
  ]) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  await page.goto("/app");
  await expect(page).toHaveTitle("Din konto · Træningsmester");
  await expect(page.locator(".story-hero")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Log ind/i }).first(),
  ).toBeVisible();
});

test.describe("public pages before JavaScript starts", () => {
  test.use({ javaScriptEnabled: false });
  test("homepage and deep-linked documents arrive with content, account uses its own shell", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Træn videre/,
    );
    await expect(page.locator("#adgang noscript p")).toContainText(
      "Aktivér JavaScript",
    );
    await page.locator(".all-features summary").click();
    await expect(page.locator(".feature-overview")).toBeVisible();
    await page.goto("/support");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Support");
    await page.goto("/privatliv");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Privatliv",
    );
    await page.goto("/app/programmer");
    await expect(page.locator("#root")).toBeEmpty();
  });
});
