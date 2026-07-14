import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { defaultState } from "../src/appData.ts";

const source = async (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("production state starts empty and Supabase accepts only verified cache fallback", async () => {
  const appData = await source("src/appData.ts");
  const supabase = await source("src/supabaseAppData.ts");
  const app = await source("src/App.tsx");

  assert.equal(defaultState.profile.name, "");
  assert.equal(defaultState.social.friendCode, "");
  assert.deepEqual(defaultState.programs, []);
  assert.deepEqual(defaultState.history, []);
  assert.deepEqual(defaultState.matchQueue, []);
  assert.match(appData, /requireRemoteVerified/);
  assert.match(appData, /REMOTE_CACHE_MARKER_SUFFIX/);
  assert.match(supabase, /requireRemoteVerified: true/);
  assert.doesNotMatch(app, /title="Træner"/);
  assert.doesNotMatch(app, /coach-værktøjer/);
});

test("marketing interactions remain controllable, semantic and token-safe", async () => {
  const marketing = await source("src/MarketingSite.tsx");
  const bear = await source("src/components/BearHatScene.tsx");
  const css = await source("src/marketing.css");

  assert.match(marketing, /const token = fragmentToken \?\? ""/);
  assert.doesNotMatch(marketing, /window\.location\.search/);
  assert.match(marketing, /className="mk-skip-link"/);
  assert.match(marketing, /<h3>\s*<button/);
  assert.match(bear, /Afspil animation/);
  assert.match(bear, /Pause animation/);
  assert.match(bear, /status === "ready"/);
  assert.match(css, /\.mk-nav \{[\s\S]*overflow-y: auto/);
});

test("the installable app stays scoped to the app boundary", async () => {
  const manifest = JSON.parse(await source("public/site.webmanifest")) as {
    id: string;
    start_url: string;
    scope: string;
    icons: Array<{ sizes: string }>;
  };

  assert.equal(manifest.id, "/app/");
  assert.equal(manifest.start_url, "/app/");
  assert.equal(manifest.scope, "/app/");
  assert.deepEqual(
    manifest.icons.map((icon) => icon.sizes),
    ["192x192", "512x512"]
  );
});

test("first-party hero and chrome assets stay within mobile budgets", async () => {
  const budgets = new Map([
    ["public/animation/bear-hat-poster-540.webp", 50_000],
    ["public/brand/tm-logo-256.webp", 20_000],
    ["public/brand/app-icon-48.png", 10_000],
    ["public/app/home-training.webp", 40_000],
    ["public/app/programs.webp", 40_000],
    ["public/app/exercises.webp", 40_000]
  ]);

  for (const [path, maximumBytes] of budgets) {
    const asset = await stat(new URL(`../${path}`, import.meta.url));
    assert.ok(asset.size <= maximumBytes, `${path} is ${asset.size} bytes`);
  }
});
