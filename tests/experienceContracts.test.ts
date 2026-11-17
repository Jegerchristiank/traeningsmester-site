import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const source = async (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

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
    ["192x192", "512x512"],
  );
});

test("first-party hero and chrome assets stay within mobile budgets", async () => {
  const budgets = new Map([
    ["public/product/vaegtskiver-560.webp", 40_000],
    ["public/product/vaegtskiver-1024.webp", 95_000],
    ["public/product/vaegtskiver-1800.webp", 195_000],
    ["public/product/vaegtskiver-panorama.webp", 185_000],
    ["public/product/baenkpres.webp", 30_000],
    ["public/product/saetraekke-600.webp", 18_000],
    ["public/product/revision-detail-set.webp", 45_000],
    ["public/brand/tm-logo-256.webp", 20_000],
    ["public/brand/app-icon-48.png", 10_000],
    ["public/product/story-program-day.webp", 30_000],
    ["public/product/story-rest-detail.webp", 45_000],
    ["public/product/revision-history.webp", 65_000],
  ]);

  for (const [path, maximumBytes] of budgets) {
    const asset = await stat(new URL(`../${path}`, import.meta.url));
    assert.ok(asset.size <= maximumBytes, `${path} is ${asset.size} bytes`);
  }
});
