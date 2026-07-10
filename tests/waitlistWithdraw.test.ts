import assert from "node:assert/strict";
import test from "node:test";
import handler from "../api/waitlist-withdraw.ts";

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

test("GET never mutates waitlist state", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response("true");
  };
  try {
    const { captured, response } = responseHarness();
    await handler({ method: "GET", body: null }, response);
    assert.equal(captured.statusCode, 405);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("invalid withdrawal tokens are rejected before the RPC", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response("true");
  };
  try {
    const { captured, response } = responseHarness();
    await handler({ method: "POST", body: { token: "not-a-token" } }, response);
    assert.equal(captured.statusCode, 400);
    assert.deepEqual(captured.body, { ok: false, code: "INVALID_WITHDRAWAL" });
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("valid POST calls the idempotent withdrawal RPC", async () => {
  const originalFetch = globalThis.fetch;
  const token = "A".repeat(43);
  let requestedUrl = "";
  let requestedBody = "";
  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input);
    requestedBody = String(init?.body ?? "");
    return new Response("true", { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const { captured, response } = responseHarness();
    await handler({ method: "POST", body: null, query: { token } }, response);
    assert.equal(captured.statusCode, 200);
    assert.deepEqual(captured.body, { ok: true });
    assert.match(requestedUrl, /\/rest\/v1\/rpc\/tm_withdraw_prelaunch_waitlist_signup$/);
    assert.deepEqual(JSON.parse(requestedBody), { p_token: token });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
