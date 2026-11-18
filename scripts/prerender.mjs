import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = resolve(root, process.argv[2] || "dist");
const vite = await createServer({
  root,
  mode: "production",
  appType: "custom",
  server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true, include: [] },
});

const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

function replaceOnce(html, pattern, replacement) {
  if ([...html.matchAll(pattern)].length !== 1) {
    throw new Error(`Prerender expected one template match: ${pattern}`);
  }
  return html.replace(pattern, () => replacement);
}

function renderPage(shell, path, component) {
  const markup = renderToString(component);
  return replaceOnce(
    shell,
    /<div id="root"><\/div>/g,
    `<div id="root" data-page="${path}">${markup}</div>`,
  );
}

try {
  const { LegalPage, legalDocuments, siteUrl } = await vite.ssrLoadModule(
    "/src/MarketingSite.tsx",
  );
  const { default: Home } = await vite.ssrLoadModule("/src/MarketingHome.tsx");
  const shell = await readFile(resolve(output, "index.html"), "utf8");
  // Token- or session-dependent routes receive the empty application shell.
  await writeFile(resolve(output, "shell.html"), shell);
  await writeFile(
    resolve(output, "index.html"),
    renderPage(shell, "/", createElement(Home)),
  );

  for (const [route, document] of Object.entries(legalDocuments)) {
    const path = `/${route}`;
    const title = `${document.title} — Træningsmester`;
    const canonical = new URL(path, siteUrl).href;
    let html = renderPage(shell, path, createElement(LegalPage, { route }));
    html = replaceOnce(
      html,
      /<title>[\s\S]*?<\/title>/g,
      `<title>${escapeHtml(title)}</title>`,
    );
    html = replaceOnce(
      html,
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/g,
      `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    );
    for (const [attribute, name, content] of [
      ["name", "description", document.intro],
      ["property", "og:title", title],
      ["property", "og:description", document.intro],
      ["property", "og:url", canonical],
      ["name", "twitter:title", title],
      ["name", "twitter:description", document.intro],
    ]) {
      html = replaceOnce(
        html,
        new RegExp(
          `<meta\\s+${attribute}="${name}"\\s+content="[^"]*"\\s*\\/?>`,
          "g",
        ),
        `<meta ${attribute}="${name}" content="${escapeHtml(content)}" />`,
      );
    }
    await writeFile(resolve(output, `${route}.html`), html);
  }
  console.log(
    `Rendered the homepage and ${Object.keys(legalDocuments).length} information pages.`,
  );
} finally {
  await vite.close();
}
