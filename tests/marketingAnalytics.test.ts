import assert from "node:assert/strict";
import test from "node:test";
import {
  createMarketingAnalytics,
  type MarketingProperties,
} from "../src/marketingAnalytics.ts";
import { requestAccess } from "../src/components/AccessForm.tsx";

function harness(initialConsent?: string) {
  const requests: Array<{ url: string; options: RequestInit }> = [];
  const saved = new Map(
    initialConsent ? [["tm-marketing-statistics-v1", initialConsent]] : [],
  );
  const tracker = createMarketingAnalytics({
    token: "phc_test",
    host: "https://analytics.example.test",
    uuid: (() => {
      let id = 0;
      return () => `test-${++id}`;
    })(),
    storage: {
      getItem: (key) => saved.get(key) ?? null,
      setItem: (key, value) => {
        saved.set(key, value);
      },
    },
    send: (async (url, options) => {
      requests.push({ url: String(url), options: options ?? {} });
      return new Response("{}", { status: 200 });
    }) as typeof fetch,
  });
  return { tracker, requests, saved };
}

test("statistics send nothing before consent, stop on withdrawal and do not replay earlier events", () => {
  const { tracker, requests, saved } = harness();
  tracker.capture("visitor");
  tracker.capture("attempt");
  tracker.capture("confirmed");
  assert.equal(requests.length, 0);
  tracker.setConsent(true);
  assert.equal(requests.length, 1);
  assert.equal(
    JSON.parse(String(requests[0].options.body)).event,
    "marketing_visitor",
  );
  tracker.capture("visitor");
  assert.equal(
    requests.length,
    1,
    "React remount must not count a second visit",
  );
  tracker.capture("attempt");
  assert.equal(requests.length, 2);
  tracker.setConsent(false);
  tracker.capture("confirmed");
  tracker.capture("share_attempt", { method: "native" });
  assert.equal(requests.length, 2);
  assert.equal(saved.get("tm-marketing-statistics-v1"), "denied");
});

test("analytics properties are a runtime whitelist, including when callers pass extra fields", () => {
  const { tracker, requests } = harness("allowed");
  tracker.capture("error", {
    reason: "network",
    email: "private@example.test",
    workout: "private workout",
    url: "https://example.test/?token=private",
    method: "native",
  } as MarketingProperties);
  tracker.capture("share_attempt", { method: "copy", reason: "network" });
  const payload = JSON.parse(String(requests[0].options.body));
  assert.deepEqual(payload.properties, {
    source: "traeningsmester-site",
    page: "/",
    environment: "preview",
    $process_person_profile: false,
    $geoip_disable: true,
    reason: "network",
  });
  assert.equal(requests[0].options.credentials, "omit");
  assert.equal(requests[0].options.referrerPolicy, "no-referrer");
  assert.doesNotMatch(
    String(requests[0].options.body),
    /private|workout|method/,
  );
  const share = JSON.parse(String(requests[1].options.body));
  assert.equal(share.event, "marketing_share_attempt");
  assert.equal(share.properties.method, "copy");
  assert.equal(share.properties.reason, undefined);
});

test("missing analytics configuration and blocked browser capabilities cannot block signup", () => {
  let sent = 0;
  const tracker = createMarketingAnalytics({
    send: (async () => {
      sent++;
      throw new Error("blocked");
    }) as typeof fetch,
  });
  tracker.setConsent(true);
  tracker.capture("attempt");
  assert.equal(sent, 0);
  assert.equal(tracker.configured, false);
  const broken = createMarketingAnalytics({
    token: "phc_test",
    host: "https://example.test",
    uuid: () => {
      throw new Error("unavailable");
    },
  });
  assert.doesNotThrow(() => broken.setConsent(true));
});

const signup = {
  email: "test@example.test",
  consent: true,
  website: "",
  source: "https://example.test/",
};
const reply =
  (status: number, body: unknown): typeof fetch =>
  async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

test("signup requires an explicit accepted server acknowledgement, never HTTP success alone", async () => {
  assert.deepEqual(
    await requestAccess(
      signup,
      reply(200, { ok: true, confirmation: "accepted" }),
    ),
    { ok: true },
  );
  for (const body of [
    {},
    { ok: false },
    { ok: true },
    { ok: true, confirmation: "pending" },
    null,
  ]) {
    assert.deepEqual(await requestAccess(signup, reply(200, body)), {
      ok: false,
      reason: "service",
    });
  }
  assert.deepEqual(
    await requestAccess(
      signup,
      reply(502, { ok: true, confirmation: "accepted" }),
    ),
    { ok: false, reason: "service" },
  );
});

test("signup preserves server validation and rate-limit meanings and distinguishes no response", async () => {
  assert.deepEqual(
    await requestAccess(signup, reply(400, { code: "INVALID_EMAIL" })),
    { ok: false, reason: "email" },
  );
  assert.deepEqual(
    await requestAccess(signup, reply(400, { code: "CONSENT_REQUIRED" })),
    { ok: false, reason: "consent" },
  );
  assert.deepEqual(
    await requestAccess(signup, reply(429, { code: "RATE_LIMITED" })),
    { ok: false, reason: "rate_limit" },
  );
  assert.deepEqual(
    await requestAccess(signup, async () => {
      throw new TypeError("offline");
    }),
    { ok: false, reason: "network" },
  );
});
