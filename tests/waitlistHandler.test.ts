import assert from "node:assert/strict";
import test from "node:test";
import handler, { createWaitlistHandler } from "../api/waitlist.ts";

type CapturedResponse = {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
};

const responseHarness = () => {
  const captured: CapturedResponse = { statusCode: 0, body: null, headers: {} };
  const response = {
    status(code: number) {
      captured.statusCode = code;
      return response;
    },
    json(body: unknown) {
      captured.body = body;
    },
    setHeader(name: string, value: string) {
      captured.headers[name] = value;
    },
    end() {}
  };
  return { captured, response };
};

const mailEnvironment = {
  SUPABASE_URL: "https://waitlist-test.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_public_capability",
  SUPABASE_SECRET_KEY: "sb_secret_test_server_only_capability",
  TM_SMTP_HOST: "smtp.resend.com",
  TM_SMTP_PORT: "465",
  TM_SMTP_SECURE: "true",
  TM_SMTP_USER: "resend",
  TM_SMTP_PASS: "test-password-never-used",
  TM_SMTP_ENVELOPE_FROM: "no-reply@traeningsmester.dk",
  TM_MAIL_FROM: "no-reply@traeningsmester.dk",
  TM_MAIL_FROM_NAME: "Træningsmester",
  WAITLIST_TOKEN_SECRET: "test-secret-that-is-longer-than-thirty-two-characters",
  PUBLIC_SITE_URL: "https://www.traeningsmester.dk"
};

test("waitlist insert uses Postgres bytea format and a server timestamp", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnvironment = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(mailEnvironment)) {
    originalEnvironment.set(key, process.env[key]);
    process.env[key] = value;
  }

  const fetchCalls: Array<{ url: string; body: Record<string, unknown> }> = [];
  let duplicateInsert = false;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
    fetchCalls.push({ url, body });
    if (url.includes("/rest/v1/prelaunch_waitlist_signups")) {
      if (duplicateInsert) {
        return new Response(JSON.stringify({ code: "23505" }), {
          status: 409,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(null, { status: 201 });
    }
    return new Response("null", {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  try {
    const before = Date.now();
    const clientSubmittedAt = "2000-01-01T00:00:00.000Z";
    const { captured, response } = responseHarness();
    await handler(
      {
        method: "POST",
        headers: {
          referer: "https://www.traeningsmester.dk/?email=person%40example.dk&utm_source=test"
        },
        socket: { remoteAddress: "192.0.2.10" },
        body: {
          email: "person@example.dk",
          audience: "nysgerrig",
          audienceLabel: "Pre-launch signup",
          consent: true,
          submittedAt: clientSubmittedAt,
          source: "https://www.traeningsmester.dk/?email=person%40example.dk&utm_source=test",
          website: ""
        }
      },
      response
    );

    assert.equal(captured.statusCode, 200);
    assert.deepEqual(captured.body, {
      ok: true,
      stored: "supabase",
      confirmation: "accepted"
    });
    assert.equal(fetchCalls.length, 2);
    const inserted = fetchCalls[0].body;
    assert.match(String(inserted.withdrawal_token_hash), /^\\x[a-f0-9]{64}$/);
    assert.notEqual(inserted.submitted_at, clientSubmittedAt);
    assert.ok(Date.parse(String(inserted.submitted_at)) >= before);
    assert.equal(inserted.source, "https://www.traeningsmester.dk/");
    assert.equal(inserted.referrer, "https://www.traeningsmester.dk/");
    assert.equal(
      (inserted.metadata as Record<string, unknown>).client_submitted_at,
      clientSubmittedAt
    );

    duplicateInsert = true;
    const duplicateHarness = responseHarness();
    await handler(
      {
        method: "POST",
        headers: { referer: "https://www.traeningsmester.dk/" },
        socket: { remoteAddress: "192.0.2.11" },
        body: {
          email: "person@example.dk",
          audience: "nysgerrig",
          audienceLabel: "Pre-launch signup",
          consent: true,
          submittedAt: new Date().toISOString(),
          source: "https://www.traeningsmester.dk/",
          website: ""
        }
      },
      duplicateHarness.response
    );
    assert.equal(duplicateHarness.captured.statusCode, captured.statusCode);
    assert.deepEqual(duplicateHarness.captured.body, captured.body);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of originalEnvironment) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

const explicitConsentRequest = (email: string, remoteAddress: string) => ({
  method: "POST",
  headers: {
    referer: "https://www.traeningsmester.dk/?email=must-not-reach-rpc%40example.dk"
  },
  socket: { remoteAddress },
  body: {
    email,
    audience: "nysgerrig",
    audienceLabel: "Pre-launch signup",
    consent: true,
    submittedAt: "2026-07-11T08:00:00.000Z",
    source: "https://www.traeningsmester.dk/?private=must-not-reach-rpc",
    website: ""
  }
});

const withMailEnvironment = async (run: () => Promise<void>) => {
  const originalEnvironment = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(mailEnvironment)) {
    originalEnvironment.set(key, process.env[key]);
    process.env[key] = value;
  }
  try {
    await run();
  } finally {
    for (const [key, value] of originalEnvironment) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

test("a legacy row is never refreshed without fresh explicit consent", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response("null", { status: 200 });
  };

  try {
    const { captured, response } = responseHarness();
    const request = explicitConsentRequest("person@example.dk", "192.0.2.20");
    request.body.consent = false;
    await handler(request, response);

    assert.equal(captured.statusCode, 400);
    assert.deepEqual(captured.body, { ok: false, code: "CONSENT_REQUIRED" });
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a missing or invalid server secret fails closed before any membership lookup", async () => {
  const originalFetch = globalThis.fetch;
  const originalSecret = process.env.SUPABASE_SECRET_KEY;
  const originalConsoleError = console.error;
  const errorLogs: string[] = [];
  let fetchCalls = 0;
  console.error = (...values: unknown[]) => {
    errorLogs.push(values.map(String).join(" "));
  };
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response("null", { status: 200 });
  };

  try {
    await withMailEnvironment(async () => {
      delete process.env.SUPABASE_SECRET_KEY;
      const firstHarness = responseHarness();
      const secondHarness = responseHarness();
      const invalidHarness = responseHarness();

      await handler(
        explicitConsentRequest("new-address@example.dk", "192.0.2.23"),
        firstHarness.response
      );
      await handler(
        explicitConsentRequest("possible-member@example.dk", "192.0.2.24"),
        secondHarness.response
      );
      process.env.SUPABASE_SECRET_KEY = "do-not-log-this-invalid-secret";
      await handler(
        explicitConsentRequest("third-address@example.dk", "192.0.2.26"),
        invalidHarness.response
      );

      assert.equal(firstHarness.captured.statusCode, 503);
      assert.deepEqual(firstHarness.captured.body, {
        ok: false,
        code: "SERVICE_NOT_CONFIGURED"
      });
      assert.deepEqual(secondHarness.captured, firstHarness.captured);
      assert.deepEqual(invalidHarness.captured, firstHarness.captured);
      assert.equal(fetchCalls, 0);
      assert.equal(errorLogs.length, 3);
      assert.ok(errorLogs.every((entry) => !entry.includes("do-not-log-this-invalid-secret")));
    });
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalSecret === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = originalSecret;
  }
});

test("a legacy duplicate is refreshed and delivered once while an accepted duplicate is not resent", async () => {
  const originalFetch = globalThis.fetch;
  const claimId = "11111111-1111-4111-8111-111111111111";
  const calls: Array<{
    url: string;
    body: Record<string, unknown>;
    headers: Record<string, string>;
  }> = [];
  let claimCalls = 0;
  let sentToken = "";
  let sendCalls = 0;
  const legacyHandler = createWaitlistHandler({
    sendConfirmationEmail: async (_email, withdrawalToken) => {
      sendCalls += 1;
      sentToken = withdrawalToken;
      return { messageId: "<legacy-confirmation@traeningsmester.dk>" };
    }
  });
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
    calls.push({
      url,
      body,
      headers: init?.headers as Record<string, string>
    });

    if (url.endsWith("/prelaunch_waitlist_signups")) {
      return new Response(JSON.stringify({ code: "23505" }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (url.endsWith("/rpc/tm_refresh_legacy_prelaunch_waitlist_signup")) {
      return new Response("true", {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (url.endsWith("/rpc/tm_claim_prelaunch_waitlist_confirmation")) {
      claimCalls += 1;
      return new Response(claimCalls === 1 ? JSON.stringify(claimId) : "null", {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (url.endsWith("/rpc/tm_finish_prelaunch_waitlist_confirmation")) {
      return new Response("true", {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    await withMailEnvironment(async () => {
      const { captured, response } = responseHarness();
      await legacyHandler(
        explicitConsentRequest(" Person@Example.dk ", "192.0.2.21"),
        response
      );

      assert.equal(captured.statusCode, 200);
      assert.deepEqual(captured.body, {
        ok: true,
        stored: "supabase",
        confirmation: "accepted"
      });
      assert.equal(calls.length, 4);
      assert.match(calls[1].url, /tm_refresh_legacy_prelaunch_waitlist_signup$/);
      assert.equal(calls[0].headers.apikey, mailEnvironment.SUPABASE_PUBLISHABLE_KEY);
      assert.equal(
        calls[0].headers.Authorization,
        `Bearer ${mailEnvironment.SUPABASE_PUBLISHABLE_KEY}`
      );
      assert.equal(calls[1].headers.apikey, mailEnvironment.SUPABASE_SECRET_KEY);
      assert.equal(
        calls[1].headers.Authorization,
        `Bearer ${mailEnvironment.SUPABASE_SECRET_KEY}`
      );
      assert.deepEqual(Object.keys(calls[1].body).sort(), [
        "p_confirmation_token_hash",
        "p_consent_metadata",
        "p_consent_version",
        "p_email"
      ]);
      assert.equal(calls[1].body.p_email, "person@example.dk");
      assert.match(String(calls[1].body.p_confirmation_token_hash), /^\\x[a-f0-9]{64}$/);
      assert.equal(calls[1].body.p_consent_version, "waitlist_launch_access_email_v1");
      assert.deepEqual(calls[1].body.p_consent_metadata, {
        capture: "prelaunch-site",
        client_submitted_at: "2026-07-11T08:00:00.000Z",
        consent_channel: "email",
        consent_controller: "KRISTENSON_CVR_40679456",
        consent_purposes: ["launch", "access_rounds"],
        consent_version: "waitlist_launch_access_email_v1"
      });

      const refreshPayload = JSON.stringify(calls[1].body);
      assert.doesNotMatch(refreshPayload, /192\.0\.2\.21/);
      assert.doesNotMatch(refreshPayload, /must-not-reach-rpc/);
      assert.doesNotMatch(refreshPayload, /\?email=/);
      assert.match(calls[2].url, /tm_claim_prelaunch_waitlist_confirmation$/);
      assert.equal(calls[2].headers.apikey, mailEnvironment.SUPABASE_SECRET_KEY);
      assert.equal(
        calls[2].headers.Authorization,
        `Bearer ${mailEnvironment.SUPABASE_SECRET_KEY}`
      );
      assert.match(calls[3].url, /tm_finish_prelaunch_waitlist_confirmation$/);
      assert.equal(calls[3].headers.apikey, mailEnvironment.SUPABASE_SECRET_KEY);
      assert.equal(
        calls[3].headers.Authorization,
        `Bearer ${mailEnvironment.SUPABASE_SECRET_KEY}`
      );
      assert.deepEqual(calls[3].body, {
        p_token: sentToken,
        p_claim_id: claimId,
        p_accepted: true,
        p_message_id: "<legacy-confirmation@traeningsmester.dk>"
      });
      assert.equal(sendCalls, 1);

      // The refresh RPC deliberately still returns true for an accepted row;
      // the secret claim returns null, so the SMTP dependency must not run.
      const secondHarness = responseHarness();
      await legacyHandler(
        explicitConsentRequest("person@example.dk", "192.0.2.25"),
        secondHarness.response
      );
      assert.deepEqual(secondHarness.captured, captured);
      assert.equal(sendCalls, 1);
      assert.equal(calls.length, 7);
      assert.match(calls[4].url, /prelaunch_waitlist_signups$/);
      assert.equal(calls[4].headers.apikey, mailEnvironment.SUPABASE_PUBLISHABLE_KEY);
      assert.match(calls[5].url, /tm_refresh_legacy_prelaunch_waitlist_signup$/);
      assert.equal(calls[5].headers.apikey, mailEnvironment.SUPABASE_SECRET_KEY);
      assert.match(calls[6].url, /tm_claim_prelaunch_waitlist_confirmation$/);
      assert.equal(calls[6].headers.apikey, mailEnvironment.SUPABASE_SECRET_KEY);
      assert.equal(
        calls[6].headers.Authorization,
        `Bearer ${mailEnvironment.SUPABASE_SECRET_KEY}`
      );
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a normal duplicate remains indistinguishable and keeps the existing claim retry path", async () => {
  const originalFetch = globalThis.fetch;
  const rpcNames: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    const rpcName = url.match(/\/rpc\/([^/?]+)$/)?.[1];
    if (rpcName) rpcNames.push(rpcName);

    if (url.endsWith("/prelaunch_waitlist_signups")) {
      return new Response(JSON.stringify({ code: "23505" }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (rpcName === "tm_refresh_legacy_prelaunch_waitlist_signup") {
      return new Response("false", {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (rpcName === "tm_claim_prelaunch_waitlist_confirmation") {
      return new Response("null", {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    await withMailEnvironment(async () => {
      const { captured, response } = responseHarness();
      await handler(
        explicitConsentRequest("already@example.dk", "192.0.2.22"),
        response
      );

      assert.equal(captured.statusCode, 200);
      assert.deepEqual(captured.body, {
        ok: true,
        stored: "supabase",
        confirmation: "accepted"
      });
      assert.deepEqual(rpcNames, [
        "tm_refresh_legacy_prelaunch_waitlist_signup",
        "tm_claim_prelaunch_waitlist_confirmation"
      ]);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
