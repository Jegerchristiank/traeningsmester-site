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

test("the local bench demo records a set, rests and carries it into the next workout", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  const dataRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // A demonstration must never reach account, workout or mail endpoints.
  // Record and block any attempted data transport while exercising it.
  await page.route("**/*", (route) => {
    if (["fetch", "xhr"].includes(route.request().resourceType())) {
      dataRequests.push(`${route.request().method()} ${route.request().url()}`);
      return route.abort("blockedbyclient");
    }
    return route.fallback();
  });
  await page.goto("/#dit-saet");
  await expect(page).toHaveTitle(/Træningsmester/);
  const story = page.locator("#baenkpres-log");
  await expect(story.getByRole("heading", { name: "Bænkpres med stang.", exact: true })).toBeVisible();
  await expect(story).toContainText("Eksempeltræning");
  await expect(story).toContainText("Overkrop A");
  const media = story.getByRole("img", { name: /bænkpres/i }).first();
  await expect(media).toBeVisible();
  await media.evaluate((img: HTMLImageElement) => img.decode());
  await expect(story.getByRole("textbox", { name: "Din e-mail", exact: true })).toHaveCount(0);
  await expect(story.getByRole("button", { name: "Få besked om adgang", exact: true })).toHaveCount(0);
  await expect(story.getByRole("button", { name: /^Marker sæt [123] som udført$/ })).toHaveCount(3);

  const weight = story.getByRole("textbox", { name: "Vægt for sæt 1", exact: true });
  const reps = story.getByRole("textbox", { name: "Gentagelser for sæt 1", exact: true });
  await expect(reps).toHaveValue("8");
  await weight.fill("62,5");
  await reps.fill("8");
  await story.getByRole("button", { name: "Marker sæt 1 som udført", exact: true }).click();
  await expect(story.getByRole("button", { name: "Fjern udført for sæt 1", exact: true })).toBeVisible();
  await expect(weight).toHaveValue("62,5");
  await expect(story.getByRole("textbox", { name: "Vægt for sæt 2", exact: true })).toHaveValue("60");
  const cancelRest = story.getByRole("button", { name: "Annuller pausetid mellem sæt", exact: true });
  await expect(cancelRest).toBeVisible();
  await expect(story.getByText("Pausetid mellem sæt", { exact: true })).toBeVisible();
  await story.screenshot({ path: `/tmp/tm-site-evidence/bench-${testInfo.project.name}-rest.png` });
  await cancelRest.click();
  await expect(cancelRest).toBeHidden();

  const history = story.getByRole("button", { name: "Tidligere", exact: true });
  await history.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Seneste registreringer", exact: true })).toBeVisible();
  await expect(dialog).toContainText(/60\s*kg/);
  await expect(dialog).not.toContainText(/62,5\s*kg/);
  await dialog.getByRole("button", { name: "Luk historik", exact: true }).click();
  await expect(history).toBeFocused();

  await story.getByRole("button", { name: "Afslut træning", exact: true }).click();
  const confirmation = page.getByRole("dialog");
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Afslut træning", exact: true }).click();
  await story.getByRole("button", { name: "Start næste træning", exact: true }).click();
  await expect(story.getByRole("button", { name: "Marker sæt 1 som udført", exact: true })).toBeVisible();
  await history.click();
  await expect(dialog.getByRole("heading", { name: "Seneste registreringer", exact: true })).toBeVisible();
  await expect(dialog).toContainText(/62,5\s*kg\s*×\s*8/);
  await dialog.screenshot({ path: `/tmp/tm-site-evidence/bench-${testInfo.project.name}-history.png` });
  await dialog.getByRole("button", { name: "Luk historik", exact: true }).click();
  await expect(history).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(dataRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test("the bench example keeps keyboard edits and history dialog focus usable", async ({ page }) => {
  await page.goto("/#dit-saet");
  const story = page.locator("#baenkpres-log");
  const weight = story.getByRole("textbox", { name: "Vægt for sæt 1", exact: true });
  await weight.focus();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("65,5");
  const register = story.getByRole("button", { name: "Marker sæt 1 som udført", exact: true });
  await register.focus();
  await page.keyboard.press("Space");
  await expect(story.getByRole("button", { name: "Fjern udført for sæt 1", exact: true })).toBeVisible();
  await expect(weight).toHaveValue("65,5");
  const history = story.getByRole("button", { name: "Tidligere", exact: true });
  await history.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Shift+Tab");
  // Native modal dialogs may let Tab reach browser chrome, but never a background control.
  await expect.poll(() => dialog.evaluate((el) =>
    document.activeElement === document.body || el.contains(document.activeElement),
  )).toBe(true);
  await page.keyboard.press("Tab");
  await expect.poll(() => dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(history).toBeFocused();
  await expect(weight).toHaveValue("65,5");
});

test("legacy workout links remain meaningful with reduced motion", async ({ page }) => {
  const motionRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/(?:Flip|gsap)-[^/]+\.js/.test(request.url())) motionRequests.push(request.url());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const anchor of ["dit-program", "dit-saet", "din-pause", "din-historik"]) {
    await page.goto(`/#${anchor}`);
    await expect(page).toHaveURL(new RegExp(`#${anchor}$`));
    const story = page.locator("#baenkpres-log");
    await expect(story).toBeInViewport();
    if (anchor === "din-historik") {
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("heading", { name: "Seneste registreringer", exact: true })).toBeInViewport();
      await dialog.getByRole("button", { name: "Luk historik", exact: true }).click();
      await expect(story.getByRole("button", { name: "Tidligere", exact: true })).toBeFocused();
    } else {
      await expect(page.getByRole("dialog")).toHaveCount(0);
      if (anchor === "dit-saet") {
        await expect(story.getByRole("textbox", { name: "Vægt for sæt 1", exact: true })).toBeInViewport();
      }
    }
    await expect(story.getByRole("textbox", { name: "Vægt for sæt 1", exact: true })).toBeEnabled();
    expect(await story.evaluate((el) => el.getAnimations({ subtree: true }).some((animation) => animation.playState === "running"))).toBe(false);
  }
  const story = page.locator("#baenkpres-log");
  await story.getByRole("button", { name: "Marker sæt 1 som udført", exact: true }).click();
  await expect(story.getByRole("button", { name: "Annuller pausetid mellem sæt", exact: true })).toBeVisible();
  expect(motionRequests).toHaveLength(0);
});

test.describe("workout example without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the static example explains the set, pause and next workout at legacy links", async ({ page }) => {
    for (const anchor of ["dit-program", "dit-saet", "din-pause", "din-historik"]) {
      await page.goto(`/#${anchor}`);
      const story = page.locator("#baenkpres-log");
      if (!(await story.isVisible())) {
        await page.locator("summary").filter({ hasText: /^Prøv sættet selv/ }).click();
      }
      await expect(story).toBeInViewport();
      await expect(story.getByRole("heading", { name: "Bænkpres med stang.", exact: true })).toBeVisible();
      await expect(story).toContainText("Eksempeltræning");
      await expect(story.locator("dd").filter({ hasText: /^60\s*kg/ })).toBeVisible();
      await expect(story.locator("dd").filter({ hasText: /^62,5\s*kg/ })).toBeVisible();
      await expect(story.locator("dt").filter({ hasText: /^Pause$/ }).last()).toBeVisible();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
});

test("the bench example stays readable and operable on wide and mobile screens", async ({ page }, testInfo) => {
  const size = testInfo.project.name === "desktop"
    ? { width: 3440, height: 1440 }
    : { width: 390, height: 844 };
  await page.setViewportSize(size);
  await page.goto("/#dit-saet");
  const story = page.locator("#baenkpres-log");
  const heading = story.getByRole("heading", { name: "Bænkpres med stang.", exact: true });
  const media = story.getByRole("img", { name: /bænkpres/i }).first();
  await media.evaluate((img: HTMLImageElement) => img.decode());
  const section = await story.boundingBox();
  expect(section?.width).toBe(size.width);
  for (const control of [
    heading,
    media,
    story.getByRole("textbox", { name: "Vægt for sæt 1", exact: true }),
    story.getByRole("textbox", { name: "Gentagelser for sæt 1", exact: true }),
    story.getByRole("button", { name: "Marker sæt 1 som udført", exact: true }),
  ]) {
    await expect(control).toBeVisible();
    const box = await control.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(size.width);
  }
  const register = story.getByRole("button", { name: "Marker sæt 1 som udført", exact: true });
  const hitArea = await register.boundingBox();
  expect(hitArea!.width).toBeGreaterThanOrEqual(44);
  expect(hitArea!.height).toBeGreaterThanOrEqual(44);
  await register.click();
  await expect(story.getByRole("button", { name: "Fjern udført for sæt 1", exact: true })).toBeVisible();
  await story.screenshot({ path: `/tmp/tm-site-evidence/bench-${testInfo.project.name}-layout.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
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
