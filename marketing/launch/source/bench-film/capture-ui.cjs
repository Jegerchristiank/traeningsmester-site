const fs = require("fs"),
  path = require("path");
// Synthetic example states reconstructed from the official native UI, 18 November 2026.
const ROOT = path.resolve(__dirname, "../../../..");
const { createRequire } = require("module");
const req = createRequire(ROOT + "/package.json");
const { chromium } = req("@playwright/test");
const { css, workout, history, icon } = req(
  "./scripts/media-reconstruct-app.cjs",
);
const art = fs
  .readFileSync(path.join(ROOT, "public/product/saetpause.webp"))
  .toString("base64");
const extra = `.heading{display:none}.exercise{border-top:0;padding-top:0}.active .complete{background:#fff;color:#0759c7;border-width:2px}.set-row.done .complete{background:#06703e;color:#fff;border-width:1px}.timer{border-radius:0;background:#fff;border-top:1px solid #D0D5DD;padding:8px 0;margin-bottom:10px;gap:6px}.timer-art{width:35px;height:40px;object-fit:contain}.timer-label{font-size:13px;line-height:18px}.timer strong{font-size:20px}.sheet-backdrop{z-index:5}.header{background:white;position:relative;z-index:2}`;
(async () => {
  const browser = await chromium.launch({ headless: true });
  const p = await browser.newPage({
    viewport: { width: 402, height: 874 },
    deviceScaleFactor: 3,
  });
  const out = path.resolve(process.argv[2] || "output/bench-film/ui");
  fs.mkdirSync(out, { recursive: true });
  let geom;
  for (const state of [
    "before",
    "empty",
    "pending",
    ...Array.from({ length: 12 }, (_, i) => "rest-" + (120 - i)),
    "history",
  ]) {
    const rest = state.startsWith("rest-");
    let markup =
      state === "history" ? history() : workout(rest ? "rest" : "active");
    await p.setContent(
      '<!doctype html><html lang="da"><meta charset="utf-8"><style>' +
        css +
        extra +
        "</style><body>" +
        markup +
        "</body></html>",
    );
    await p.evaluate(
      ({ state, art, check, clock }) => {
        document
          .querySelectorAll(".complete")
          .forEach((e) => (e.innerHTML = ""));
        document
          .querySelectorAll(".set-row.done .complete")
          .forEach((e) => (e.innerHTML = check));
        if (state === "empty")
          document.querySelector(
            ".set-row .field:not(.reps) .input",
          ).textContent = "";
        if (state === "pending")
          document.querySelector(".set-row .complete").innerHTML = clock;
        if (state.startsWith("rest-")) {
          const rem = +state.split("-")[1],
            timer = document.querySelector(".timer");
          timer.insertAdjacentHTML(
            "afterbegin",
            '<img class="timer-art" src="data:image/webp;base64,' + art + '">',
          );
          timer.querySelector("strong").textContent =
            String(Math.floor(rem / 60)).padStart(2, "0") +
            ":" +
            String(rem % 60).padStart(2, "0");
          document.querySelector(".time").textContent =
            "00:01:" + String(120 - rem).padStart(2, "0");
        }
      },
      { state, art, check: icon("check", 25), clock: icon("clock", 24) },
    );
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: out + "/" + state + ".png" });
    if (state === "before")
      geom = await p.evaluate(() => {
        const rect = (s) => {
          const r = document.querySelector(s).getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        };
        return {
          weight: rect(".set-row .field:not(.reps) .input"),
          action: rect(".set-row .complete"),
          exercise: rect(".exercise"),
          prev: rect(".prev"),
          row: rect(".set-row"),
          header: rect(".header"),
        };
      });
  }
  fs.writeFileSync(out + "/geometry.json", JSON.stringify(geom, null, 2));
  await browser.close();
  console.log(geom);
})();
