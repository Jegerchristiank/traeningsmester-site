import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = async (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("legal pages expose the operator, current processors and contact routes", async () => {
  const marketing = await source("src/MarketingSite.tsx");

  assert.match(marketing, /KRISTENSON/);
  assert.match(marketing, /40679456/);
  assert.match(marketing, /Blomstergården 13, 4700 Næstved/);
  assert.match(marketing, /christiankristensen123@gmail\.com/);
  assert.match(marketing, /Supabase/);
  assert.match(marketing, /Vercel/);
  assert.match(marketing, /Resend/);
  assert.doesNotMatch(marketing, /Nordicway til maillevering/);
});

test("new app accounts record explicit health-data consent and production cannot fall back to local auth", async () => {
  const app = await source("src/App.tsx");
  const supabase = await source("src/supabaseAppData.ts");

  assert.match(app, /Jeg giver udtrykkeligt samtykke/);
  assert.match(app, /if \(!import\.meta\.env\.DEV\)/);
  assert.match(app, /clearStoredAppState\(email\)/);
  assert.match(app, /HealthDataConsentGate/);
  assert.match(supabase, /health_data_consent: true/);
  assert.match(supabase, /health_data_consent_version/);
  assert.match(supabase, /health_data_consented_at/);
  assert.match(supabase, /client\.auth\.updateUser/);
  assert.match(supabase, /if \(!healthDataConsentRecorded\)/);
  assert.ok(
    supabase.indexOf("if (!healthDataConsentRecorded)") <
      supabase.indexOf("const cached = loadStateForAccount"),
    "personal app cache must not be read before current consent is recorded"
  );
});

test("interactive withdrawal keeps its token out of the request URL", async () => {
  const marketing = await source("src/MarketingSite.tsx");

  assert.match(marketing, /fetch\("\/api\/waitlist-withdraw", \{/);
  assert.doesNotMatch(marketing, /fetch\(`\/api\/waitlist-withdraw\?token=/);
});
