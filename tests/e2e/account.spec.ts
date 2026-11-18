import { expect, test as base, type Page } from "@playwright/test";

const email = "konto@example.test";
const password = "syntetisk-testkode";
const user = {
  id: "bd2fe550-0abb-49f6-8c39-fba3bded8783",
  email,
  aud: "authenticated",
  role: "authenticated",
  created_at: "2026-01-01T00:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {
    name: "Testkonto",
    health_data_consent: true,
    health_data_consent_version: "health_activity_processing_v1",
    health_data_consented_at: "2026-01-01T00:00:00Z",
  },
};
const expiresAt = Math.floor(Date.now() / 1000) + 3600;
const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
const accessToken = [
  encode({ alg: "HS256", typ: "JWT" }),
  encode({ sub: user.id, aud: user.aud, exp: expiresAt }),
  Buffer.from("browser-test-only").toString("base64url"),
].join(".");

type AuthTraffic = {
  logoutScopes: Array<string | null>;
  registrations: Record<string, unknown>[];
};

// Intercept all API traffic, including requests made against a hosted preview.
// Only the site's own documents and static assets may reach the network.
const test = base.extend<{ auth: AuthTraffic }>({
  auth: async ({ context, baseURL }, use) => {
    const origin = new URL(baseURL!).origin;
    const unexpected: string[] = [];
    const traffic: AuthTraffic = { logoutScopes: [], registrations: [] };
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname;
      if (path === "/auth/v1/token" && url.searchParams.get("grant_type") === "password") {
        const data = request.postDataJSON();
        if (data.email !== email || data.password !== password) {
          return route.fulfill({ status: 400, json: { code: "invalid_credentials", message: "Invalid login credentials" } });
        }
        return route.fulfill({ json: {
          access_token: accessToken, refresh_token: "browser-test-refresh",
          token_type: "bearer", expires_in: 3600, expires_at: expiresAt, user,
        } });
      }
      if (path === "/auth/v1/user" && request.method() === "GET") {
        expect(request.headers().authorization).toBe(`Bearer ${accessToken}`);
        return route.fulfill({ json: user });
      }
      if (path === "/auth/v1/logout") {
        traffic.logoutScopes.push(url.searchParams.get("scope"));
        return route.fulfill({ status: 204 });
      }
      if (path === "/auth/v1/signup") {
        traffic.registrations.push(request.postDataJSON().data);
        return route.fulfill({ json: user }); // Confirmation required, no session yet.
      }
      const apiPath = /^\/(api|oauth|mcp|auth|rest|graphql|realtime|functions|storage)(\/|$)/.test(path);
      const devModule = request.resourceType() === "script" && path.endsWith(".ts");
      const staticAsset = !apiPath && !["fetch", "xhr"].includes(request.resourceType());
      if (url.origin === origin && request.method() === "GET" && (staticAsset || devModule)) {
        return route.continue();
      }
      unexpected.push(`${request.method()} ${path}`);
      await route.abort();
    });
    await use(traffic);
    expect(unexpected, "No unhandled APIs or training data reads/writes").toEqual([]);
  },
});
test.use({ serviceWorkers: "block" });

async function signIn(page: Page, inputPassword = password) {
  await page.getByLabel(/^E-?mail$/i).fill(email);
  await page.getByLabel("Adgangskode", { exact: true }).fill(inputPassword);
  await page.locator("form").getByRole("button", { name: "Log ind", exact: true }).click();
}

test("old workout links only show the account, which shares its session with connected tools", async ({ page, auth }) => {
  const legacyKey = "tm-react-workbench-state-v1";
  const accountKey = `${legacyKey}:${email}`;
  const otherKey = `${legacyKey}:anden@example.test`;
  const cache = JSON.stringify({
    auth: { loggedIn: true, onboardingCompleted: true },
    profile: { email },
    programs: [{ name: "Gammelt lokalt testprogram" }],
  });
  const initialCache = {
    [legacyKey]: cache,
    [accountKey]: cache,
    [accountKey + ":remote-verified"]: "1",
    [otherKey]: JSON.stringify({ profile: { email: "anden@example.test" } }),
    [otherKey + ":remote-verified"]: "1",
  };
  await page.addInitScript((values) => {
    if (sessionStorage.getItem("seeded-old-cache")) return;
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
    sessionStorage.setItem("seeded-old-cache", "1");
  }, initialCache);
  const readLegacyCache = () => page.evaluate(
    (keys) => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])),
    Object.keys(initialCache),
  );
  await page.route("**/api/ai-connect?action=connections", async (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${accessToken}`);
    await route.fulfill({ json: { connections: [] } });
  });

  await page.goto("/app/programmer");
  await signIn(page, "forkert-testkode");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByLabel(/^E-?mail$/i)).toHaveValue(email);
  await signIn(page);
  await expect(page.getByRole("heading", { name: "Din konto", level: 1 })).toBeVisible();
  for (const path of ["/app", "/app/social", "/app/training/history"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Din konto", level: 1 })).toBeVisible();
    await expect(page.getByText(email).first()).toBeVisible();
    await expect(page.getByText("Gammelt lokalt testprogram")).toHaveCount(0);
    const retired = { name: /^(Træning|Programmer|Social|Match|Historik)$/ };
    await expect(page.getByRole("button", retired).or(page.getByRole("link", retired))).toHaveCount(0);
  }
  await page.getByRole("link", { name: "Forbundne AI-assistenter" }).click();
  await expect(page).toHaveURL(/\/ai\/connections$/);
  await expect(page.getByText(/Du har ingen forbundne AI-assistenter endnu/)).toBeVisible();

  await page.goto("/app");
  expect(await readLegacyCache()).toEqual(initialCache);
  await page.getByRole("button", { name: "Log ud", exact: true }).click();
  await expect(page.getByLabel("Adgangskode", { exact: true })).toBeVisible();
  expect(auth.logoutScopes).toEqual(["local"]);
  expect(await readLegacyCache()).toEqual({
    ...initialCache, [legacyKey]: null, [accountKey]: null, [accountKey + ":remote-verified"]: null,
  });
  await page.goto("/ai/connections");
  await expect(page.getByLabel("Adgangskode", { exact: true })).toBeVisible();
});

test("a tool can start login, obtain explicit approval and continue to its return URL", async ({ page, auth }) => {
  const uid = "syntetisk-interaktion";
  let approved = false;
  await page.route("**/api/ai-connect?**", async (route) => {
    const request = route.request();
    const action = new URL(request.url()).searchParams.get("action");
    if (action === "interaction") {
      return route.fulfill({ json: {
        uid, challenge: "syntetisk-udfordring", csrf: "syntetisk-formulartoken",
        clientName: "Testassistent", scopes: ["training:read"],
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
        status: approved ? "approve" : "pending", deepLink: "traeningsmester://ai/connect",
      } });
    }
    if (action === "approve") {
      expect(request.headers().authorization).toBe(`Bearer ${accessToken}`);
      expect(request.postDataJSON()).toEqual({ challenge: "syntetisk-udfordring" });
      approved = true;
      return route.fulfill({ json: { ok: true } });
    }
    if (action === "finish") {
      expect(approved).toBe(true);
      expect(request.postDataJSON()).toEqual({ uid, csrf: "syntetisk-formulartoken" });
      return route.fulfill({ json: { returnTo: "/oauth/auth/syntetisk-retur" } });
    }
    return route.fallback();
  });
  await page.route("**/oauth/auth/syntetisk-retur", (route) =>
    route.fulfill({ contentType: "text/html", body: "<h1>Tilbage til testassistenten</h1>" }),
  );
  await page.goto(`/ai/connect?uid=${uid}`);
  await expect(page.getByRole("heading", { name: "Testassistent" })).toBeVisible();
  await signIn(page);
  const approve = page.getByRole("button", { name: "Giv den viste adgang" });
  await expect(approve).toBeVisible();
  expect(approved).toBe(false);
  await approve.click();
  await expect(page.getByRole("heading", { name: "Tilbage til testassistenten" })).toBeVisible();
  expect(auth.registrations).toHaveLength(0);
});

test("creating an account requires consent and waits for email confirmation", async ({ page, auth }) => {
  await page.goto("/app");
  await page.getByText("Opret konto", { exact: true }).click();
  const form = page.locator("form");
  await form.getByLabel("Navn", { exact: true }).fill("Testkonto");
  await form.getByLabel(/^E-?mail$/i).fill(email);
  await form.getByLabel("Adgangskode", { exact: true }).fill(password);
  const consent = form.getByRole("checkbox");
  const submit = form.getByRole("button", { name: "Opret konto", exact: true });
  await expect(consent).not.toBeChecked();
  // The control may either be disabled or use native required validation.
  if (await submit.isEnabled()) await submit.click();
  expect(auth.registrations).toHaveLength(0);
  await consent.check();
  await submit.click();
  await expect(page.getByText(/bekræft.{0,30}e-?mail|tjek din (indbakke|e-?mail)/i).first()).toBeVisible();
  expect(auth.registrations).toEqual([expect.objectContaining({
    health_data_consent: true,
    health_data_consent_version: "health_activity_processing_v1",
    health_data_consented_at: expect.any(String),
  })]);
  await expect(page.getByRole("button", { name: "Log ud", exact: true })).toHaveCount(0);

  // Follow the browser return from email confirmation without sending a message.
  const fragment = new URLSearchParams({
    access_token: accessToken,
    refresh_token: "browser-test-refresh",
    expires_in: "3600",
    token_type: "bearer",
    type: "signup",
  });
  const confirmation = await page.context().newPage();
  await confirmation.goto(`/app#${fragment}`);
  await expect(confirmation.getByRole("heading", { name: "Din konto", level: 1 })).toBeVisible();
  await expect(confirmation).not.toHaveURL(/access_token=/);
});
