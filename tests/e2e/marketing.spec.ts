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
  await expect(page.getByLabel("Din e-mail", { exact: true })).toBeVisible();
  await expect(page.locator("form")).toHaveCount(1);
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator(".plate-image")
    .evaluate((img) => (img as HTMLImageElement).decode());
  if (testInfo.project.name === "mobile") {
    // Visitors can type their e-mail immediately. The same exercise is also
    // introduced on that first screen without opening additional controls.
    await expect(
      page.getByLabel("Din e-mail", { exact: true }),
    ).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Få besked om adgang" }),
    ).toBeInViewport();
    await expect(page.locator("#example-exercise")).toBeInViewport();
  }
  await page.screenshot({
    path: `/tmp/tm-site-evidence/${testInfo.project.name}-hero-final.png`,
  });
  for (const target of [
    "#traeningsforloeb",
    "#dit-saet",
    "#din-pause",
    "#din-historik",
    ".feature-register",
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
  await page.locator("#adgang").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `/tmp/tm-site-evidence/${testInfo.project.name}-signup-success.png`,
  });
  await page.locator(".closing-action").click();
  await expect(page.locator("#adgang")).toBeFocused();
  expect(requests).toBe(1);
});

test("keyboard can reach form, open features and return from final CTA", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".story-skip")).toBeFocused();
  await page.getByLabel("Din e-mail", { exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Få besked om adgang" }),
  ).toBeFocused();
  const summary = page.locator(".all-features > summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".feature-overview")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator(".feature-overview")).not.toBeVisible();
  await page.locator(".closing-action").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Din e-mail", { exact: true })).toBeFocused();
});

test("ordinary scrolling follows one exercise through the set, its pause and the next session", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const story = page.locator(".workout-story");
  const wide = testInfo.project.name === "desktop";
  const steps = [
    ["program", "story-program-day"],
    ["set", "revision-detail-set"],
    ["rest", "story-rest-detail"],
    ["history", "revision-history"],
  ] as const;
  await expect(story.locator(".ws-stage")).toHaveCount(wide ? 1 : 0);
  for (const [frame, image] of steps) {
    const step = story.locator(`[data-reading-step="${frame}"]`);
    const distance = await step.evaluate(
      (el) => el.getBoundingClientRect().top - 124,
    );
    await page.mouse.wheel(0, Math.round(distance));
    const scene = wide
      ? story.locator(".ws-stage .ws-scene")
      : step.locator(".ws-scene");
    await expect(scene).toHaveAttribute("data-frame", frame);
    await expect(scene).toBeInViewport();
    await expect(scene.locator(".ws-window img")).toHaveAttribute(
      "src",
      `/product/${image}.webp`,
    );
    if (frame === "set") {
      await expect(scene.locator(".ws-comparison")).toContainText("60 kg × 8");
      await expect(scene.locator(".ws-comparison")).toContainText(
        "62,5 kg × 8",
      );
    }
    if (frame === "rest") {
      await expect(scene).toContainText("01:42");
      const scale = scene.getByRole("meter", { name: "Forløbet pausetid" });
      await expect(scale).toHaveAttribute("aria-valuenow", "18");
      await expect(scale).toHaveAttribute("aria-valuemax", "120");
    }
    if (frame === "history") {
      await expect(scene.locator("time")).toHaveCount(3);
      await expect(scene.locator(".ws-saved")).toContainText("62,5 kg × 8");
    }
  }
  await expect(story.locator("[aria-current=step]")).toContainText("Historik");
  const chapter = story.getByRole("link", { name: "02 Sæt og pause" });
  await chapter.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#dit-saet$/);
  await expect(chapter).toHaveAttribute("aria-current", "step");
  await expect(story.locator("#ws-set-title")).toBeInViewport();
});

test("reduced motion shows four static app frames in reading order", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const story = page.locator(".workout-story");
  const scenes = story.locator(".ws-scene");
  await expect(story.locator(".ws-stage")).toHaveCount(0);
  await expect(scenes).toHaveCount(4);
  for (const [index, state] of [
    "program",
    "set",
    "rest",
    "history",
  ].entries()) {
    const scene = scenes.nth(index);
    await expect(scene).toBeVisible();
    await expect(scene).toHaveAttribute("data-frame", state);
    await expect(scene.locator(".ws-window img")).toHaveAttribute("alt", /./);
  }
  await expect(story.locator("video")).toHaveCount(0);
  await story.getByRole("link", { name: "03 Historik" }).click();
  await expect(story.locator("#ws-history-title")).toBeInViewport();
  await page.locator(".closing-action").click();
  await expect(page.getByLabel("Din e-mail", { exact: true })).toBeFocused();
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
  await page.getByRole("button", { name: "Få besked om adgang" }).click();
  expect(payloads).toHaveLength(0);
  await page.locator(".analytics-consent summary").click();
  await page.locator(".analytics-consent input").check();
  await expect.poll(() => payloads.length).toBe(1);
  await page
    .getByLabel("Din e-mail", { exact: true })
    .fill("private@example.test");
  await page.getByRole("button", { name: "Få besked om adgang" }).click();
  await expect.poll(() => payloads.length).toBe(3);
  expect(JSON.stringify(payloads)).not.toMatch(
    /private@|workout|training_data|current_url/,
  );
  expect(payloads.map((p) => p.event)).toEqual([
    "marketing_visitor",
    "marketing_attempt",
    "marketing_error",
  ]);
  await page.locator(".analytics-consent input").uncheck();
  await page.getByRole("button", { name: "Få besked om adgang" }).click();
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
