import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = new URL("../dist/", import.meta.url);
const vite = await createServer({
  root,
  appType: "custom",
  server: { middlewareMode: true, hmr: false },
});

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

function replaceOnce(html, pattern, replacement) {
  if ([...html.matchAll(pattern)].length !== 1) {
    throw new Error(`Privacy prerender expected one template match: ${pattern}`);
  }
  return html.replace(pattern, () => replacement);
}

try {
  // Render the same component and policy used by the browser. The built shell
  // retains its production JS/CSS so existing client behavior stays available.
  const { LegalPage, legalDocuments, siteUrl } = await vite.ssrLoadModule("/src/MarketingSite.tsx");
  const document = legalDocuments.privatliv;
  const title = `${document.title} — Træningsmester`;
  const canonicalUrl = new URL("/privatliv", siteUrl).href;
  const markup = renderToString(createElement(LegalPage, { route: "privatliv" }));
  let html = await readFile(new URL("index.html", output), "utf8");
  html = replaceOnce(html, /<div id="root"><\/div>/g, `<div id="root">${markup}</div>`);
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/g, `<title>${escapeHtml(title)}</title>`);
  html = replaceOnce(html, /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/g,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
  for (const [attribute, name, content] of [
    ["name", "description", document.intro],
    ["property", "og:title", title],
    ["property", "og:description", document.intro],
    ["property", "og:url", canonicalUrl],
    ["name", "twitter:title", title],
    ["name", "twitter:description", document.intro],
  ]) {
    html = replaceOnce(html, new RegExp(`<meta\\s+${attribute}="${name}"\\s+content="[^"]*"\\s*\\/?>`, "g"),
      `<meta ${attribute}="${name}" content="${escapeHtml(content)}" />`);
  }
  await writeFile(new URL("privatliv.html", output), html);
  console.log(`Prerendered /privatliv from LegalPage (${document.sections.length} sections).`);
} finally {
  await vite.close();
}
