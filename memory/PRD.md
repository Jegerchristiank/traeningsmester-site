# Træningsmester — Website (PRD & Working Notes)

## Problem statement
Total redesign of https://www.traeningsmester.dk/ — the Danish pre-launch
marketing/landing page for the Træningsmester fitness/strength-training app
(iOS / Apple Watch; app repo: github.com/Jegerchristiank/Traeningsmester-swift-ios).
User direction: beautiful marketing/landing page promoting the app · light, clean,
minimalist style ("surprise me") · fresh new Danish content · Danish only ·
suggest sensible integrations.

## Tech stack (IMPORTANT — not the standard Emergent CRA/FastAPI/Mongo stack)
- Vite 7 + React 19 + TypeScript single-page app. Source repo: `traeningsmester-site` (deployed on Vercel).
- Entry: `/app/src/main.tsx` (single-file app), styles `/app/src/styles.css`, `/app/index.html`.
- Self-hosted fonts in `/app/public/fonts` (Cabinet Grotesk + Satoshi, from Fontshare) to respect the strict CSP / privacy-first ethos.
- No FastAPI backend. The ONLY integration is the waitlist, which POSTs directly from the browser to the real Supabase REST table `prelaunch_waitlist_signups` (public anon key embedded by design; relies on Supabase RLS allowing INSERT only).
- `/app/api/waitlist.ts` is a Vercel serverless fallback (not used by the client; client posts directly to Supabase).

## Preview runtime (how it runs in this environment)
- Supervisor `frontend` program runs `yarn start` in `/app/frontend`.
- `/app/frontend/package.json` is a thin launcher whose `start` script runs `cd /app && vite --host 0.0.0.0 --port 3000 --strictPort`.
- `/app/frontend` and `yarn.lock` are git-ignored so the Vercel repo root stays clean.
- `vite.config.ts` has a `server` block (host/port/allowedHosts/hmr) for the preview; ignored by Vercel's `build`.
- Build (what Vercel runs): `npm run build` = `tsc -b && vite build` — passes clean.

## Design system
- Light editorial / Swiss-brutalist fitness aesthetic. BG #FCFCFA, ink #0C0C0C, accent International Orange #FF4F00. Dark sections (#0C0C0C) for trainer/quote/CTA/footer contrast.
- Cabinet Grotesk (display) + Satoshi (text), JetBrains-style mono for overlines.
- Sections: sticky header → hero (headline + inline waitlist + device mockup + lifestyle photo) → trust marquee → audience bento (4 cards) → 3 pillars sticky-scroll → trainer workspace (dark) → orange quote band → roadmap timeline → FAQ accordion → final dark CTA (2nd waitlist) → footer (giant TRÆNINGSMESTER wordmark + legal). Scroll-reveal animations + IntersectionObserver, CSS marquee, all `prefers-reduced-motion` aware.
- All interactive/key elements have `data-testid`s.

## Status (implemented — 2026-06-21)
- Full redesign shipped and verified by testing agent: 13/13 frontend flows PASS (100%).
  Hero render, waitlist validation (invalid email + missing consent), live Supabase happy-path (HTTP 201 + success state), all section scroll-reveal, sticky pillar active state, FAQ accordion, 4 legal modals (X/Esc/backdrop close), cookie banner + persistence, header scrolled state, header CTA + nav anchors, mobile hamburger drawer.
- Polish applied: removed `frame-ancestors` from CSP `<meta>` (browser-ignored) and added security headers via `vercel.json` (X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy); added `html { overflow-x: hidden }` to remove ~12px mobile overflow.

## Backlog / next ideas (P1/P2)
- P1: Split `main.tsx` (~1.2k lines) into modules (Header, Hero, Pillars, FAQ, modals, WaitlistForm, content data).
- P1: Give hero & footer waitlist forms independent local state (currently share one React state by design).
- P2: App Store / Google Play badge buttons once links exist; OG image refresh to match new look.
- P2: Optional newsletter double opt-in / confirmation email (currently no confirmation email — by design).
- P2: Lightweight, privacy-friendly analytics (matches no-marketing-cookies stance) if desired.

## Notes
- No auth on this site → no test credentials needed.
- Testing inserted ONE real waitlist row (`qa+tm-redesign-test-<ts>@example.com`) in Supabase.
