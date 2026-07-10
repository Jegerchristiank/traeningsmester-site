import assert from "node:assert/strict";
import test from "node:test";
import handler from "../api/waitlist.ts";

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
  TM_SMTP_HOST: "cp13.nordicway.dk",
  TM_SMTP_PORT: "465",
  TM_SMTP_SECURE: "true",
  TM_SMTP_USER: "no-reply@traeningsmester.dk",
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
