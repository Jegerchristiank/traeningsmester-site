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
    .locator(".hero-product img")
    .evaluateAll((images) =>
      Promise.all(images.map((img) => (img as HTMLImageElement).decode())),
    );
  if (testInfo.project.name === "mobile") {
    // The product must be visible before asking visitors to read the full form.
    const product = await page.locator(".hero-product").boundingBox();
    expect(product!.y).toBeLessThan(page.viewportSize()!.height * 0.65);
    await page.locator(".hero-mobile-action a").click();
    await expect(page.getByLabel("Din e-mail", { exact: true })).toBeFocused();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  }
  await page.screenshot({
    path: `/tmp/tm-site-evidence/${testInfo.project.name}-hero-final.png`,
  });
  for (const target of [
    "#traeningsforloeb",
    "#dit-saet",
    "#din-historik",
    ".training-photo",
    ".story-footer",
  ]) {
    await page.locator(target).scrollIntoViewIfNeeded();
  }
  await expect
    .poll(() =>
      page.evaluate(() =>
        Array.from(document.images)
          .filter((img) => img.getBoundingClientRect().width > 0)
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
  await page
    .getByLabel("Din e-mail", { exact: true })
    .fill("demo@example.test");
  await page.locator("#access-consent").check();
  await page.getByRole("button", { name: "Få besked om adgang" }).click();
  await expect(page.getByRole("button", { name: "Sender…" })).toBeDisabled();
  await expect(page.getByText("Du er skrevet op.")).toHaveCount(0);
  release();
  await expect(
    page.getByRole("heading", { name: "Du er skrevet op." }),
  ).toBeVisible();
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

test("chapter buttons retain context and pause is inspectable", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "02 Sæt og pause" }).click();
  if (testInfo.project.name === "desktop") {
    await page.getByRole("button", { name: "Se pausen" }).click();
    await expect(page.locator(".story-stage")).toHaveAttribute(
      "data-frame",
      "rest",
    );
    await expect(page.locator(".story-stage img.is-active")).toHaveAttribute(
      "src",
      "/product/revision-rest.webp",
    );
  } else {
    await expect(page.locator(".mobile-rest")).toBeVisible();
  }
  await page.getByRole("button", { name: "03 Historik" }).click();
  await expect(page.locator("#din-historik")).toBeInViewport();
});

test("reduced motion shows all meaningful states without sticky/scroller dependency", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".story-stage-wrap")).not.toBeVisible();
  for (const state of ["program", "set", "rest", "history"])
    await expect(page.locator(`.mobile-${state}`)).toBeVisible();
  await page.locator(".closing-action").click();
  await expect(page.getByLabel("Din e-mail", { exact: true })).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
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
  await expect(page).toHaveTitle("Træningsmester webapp");
  await expect(page.locator(".story-hero")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Log ind/i }).first(),
  ).toBeVisible();
});
