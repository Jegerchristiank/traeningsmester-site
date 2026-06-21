# Træningsmester — Website (PRD & Working Notes)

## Problem statement
Total redesign of https://www.traeningsmester.dk/ — the Danish pre-launch
marketing/landing page for the Træningsmester fitness/strength-training app
(iOS / Apple Watch; app repo: github.com/Jegerchristiank/Traeningsmester-swift-ios).
User direction over iterations: beautiful marketing/landing page · Danish only ·
fresh content · then explicitly: must be CLEAN/minimal (v2's heavy gradients were
rejected as "unicorn vomit") AND have genuine "woaw, didn't know a website could do
that" showoff features.

## Tech stack (NOT the standard Emergent CRA/FastAPI/Mongo stack)
- Vite 7 + React 19 + TypeScript. Repo `traeningsmester-site` (deployed on Vercel).
- Entry `/app/src/main.tsx`; styles `/app/src/styles.css`; set-pieces `/app/src/Phone3D.tsx` (Three.js) and `/app/src/PlatePlayground.tsx` (Matter.js).
- Self-hosted fonts `/app/public/fonts` (Cabinet Grotesk + Satoshi).
- No FastAPI backend. Only integration: waitlist POSTs directly from browser to real Supabase REST table `prelaunch_waitlist_signups` (public anon key embedded by design). `/app/api/waitlist.ts` is an unused Vercel fallback.

## Preview runtime
- Supervisor `frontend` runs `yarn start` in `/app/frontend` (thin launcher: `cd /app && vite --host 0.0.0.0 --port 3000 --strictPort`). `/app/frontend` + `yarn.lock` are git-ignored so the Vercel repo root stays clean.
- `vite.config.ts` has a `server` block for preview (ignored by Vercel build).
- Vercel build = `npm run build` = `tsc -b && vite build` — passes clean. Bundle ~228kb gzip (Three.js).

## Design (v3 — CLEAN "showoff")
- Editorial Swiss minimalism: black ink on white/off-white paper, generous whitespace, hairline dividers, mono overlines. ONE accent = electric blue #0A4BE0 (pulled from the logo), used sparingly. NO rainbow gradients.
- Cabinet Grotesk (display) + Satoshi (text).
- Two interactive set-pieces ("woaw"):
  1. Hero: draggable 3D iPhone (Three.js) showing the app screen — grab to rotate w/ inertia, idle auto-rotate, gentle float; falls back to flat image if WebGL missing.
  2. "Mærk vægten" section: Matter.js physics playground — drag/throw/stack real kg weight plates; live total; touch-drag disabled on mobile to preserve scroll.
- Plus: scroll-scrubbed pinned "Tre faser" section, count-up stats, custom cursor (desktop), magnetic CTAs, fit-to-width footer wordmark, reveal-on-scroll. All `prefers-reduced-motion` aware.
- Sections: header → hero (3D phone + waitlist) → trust marquee → audience bento → pillars (scroll-scrub) → plate playground → trainer → quote → stats → roadmap → FAQ → final CTA → footer + legal modals + cookie banner.

## Status (verified 2026-06-21)
- v3 verified by testing agent: 14/14 frontend flows PASS (100%). Both set-pieces work; design reads clean (1 gradient left = subtle phone shadow); mobile 390 overflow-free; footer wordmark fits one line; pillars scrub works; waitlist → Supabase 201; FAQ/legal/cookie/header/nav all pass.
- Polish applied post-test: added `noValidate` to waitlist form (real users now see the Danish validation copy, not the browser's English popup); footer fit factor 0.98 (removes 1px mobile sub-pixel overflow).
- Security headers via vercel.json (X-Frame-Options DENY etc.); strict CSP in index.html (fonts self-hosted, Supabase allow-listed).

## v4 (2026-06-21) — 3D intro loader + redesigned mini-game (verified 100%, iteration_4.json)
- NEW `/app/src/IntroLoader.tsx`: cinematic ~3.4s Three.js intro on every fresh load. Full-screen black overlay (z-index 1000) with a layered faux-extruded brand "M" logo (texture `/public/brand/tm-logo-mark.png`, 14 depth layers), elastic spring-in + depth-shimmer spin, brand-blue radial glow, additive particle field (behind logo), shockwave ring, white-flash reveal, "TRÆNINGSMESTER" wordmark + gradient progress bar + "Tryk for at springe over" hint. Auto-dismisses (6s safety), click/Space/Enter to skip, `prefers-reduced-motion` → fast 650ms exit. Body scroll locked during intro. Wired in main.tsx via `introActive` state.
- REWRITTEN mini-game `/app/src/PlatePlayground.tsx` → "Stabl stangen" (heading "Stabl stangen. Ét tryk ad gangen."): one-tap timing + Matter.js physics arcade. A plate swings across the top; tap "Slip skive" / Space / click-canvas to drop it straight down onto the bar; land it to score (perfect <13px = +10 + combo, good = +4), tower tip follows a fixed camera line, miss = physics topple → game over → "Spil igen". HUD: Score / Combo / Rekord. Best persists via localStorage `tm-stack-best`.
  - Key fix: prior 0-score/NaN bug was caused by toggling a body created `isStatic:true` to dynamic. Now the active plate is created DYNAMIC and pinned kinematically each frame (setPosition+zero velocity in beforeUpdate); released on drop; landed plates set static. Base is a tall/thick (260px) collision-safe pedestal drawn as a slim platform.
- Verified by testing agent (iteration_4): intro loader (no-preference + reduced-motion + click/Space skip + auto-dismiss), game scoring 0→4→16→30, combo + rekord persistence across reload, spacebar drop, no NaN/console errors; sticky pillars pin on desktop (no-preference); waitlist Danish validation; FAQ/legal/cookie/mobile-menu. Zero app console errors. Build green.

## Backlog / next ideas
- P1: Split main.tsx (~1580 lines) into per-section modules (maintainability; carried over).
- P1: Code-split Phone3D/PlatePlayground/IntroLoader (React.lazy) to trim initial JS (~234kb gzip with Three.js).
- P2: Map real iOS app UI screens onto the hero 3D phone (Phone3D.tsx) — deferred by user (was upcoming task).
- P2: Cookie banner z-index/position can overlap the hero consent checkbox on short desktop viewports (test-harness note; consider bottom-anchoring so it never overlaps form controls).
- P2: Optional session-guard so the intro only plays once per session (currently plays every load by design).
- P2: App Store / Google Play badges when links exist; refresh OG image to the new clean look.
- P2: Independent local state for hero vs footer waitlist forms (currently shared by design).
- P2: Optional privacy-friendly analytics (matches no-marketing-cookies stance).
- P2: Mini-game leaderboard via Supabase (if backend permits) — carried future idea.

## Notes
- No auth → no test credentials needed.
- Testing inserted real Supabase rows: qa+tm-redesign-test@example.com, qa+tm-v3-test-...@example.com (can be deleted).
