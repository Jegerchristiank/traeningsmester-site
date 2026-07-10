# Træningsmester hjemmeside og webapp

React/Vite-projektet indeholder både Træningsmesters offentlige pre-launch-side
og en separat webapp til det personlige træningsflow.

## Ruter

- `/` — offentlig marketing- og ventelisteside
- `/app` — loginbeskyttet webapp
- `/privatliv`, `/vilkaar`, `/cookies`, `/tilgaengelighed` — juridiske sider

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The app is static and Vercel-ready. No private runtime credentials are shipped
in the client.

## Supabase app data

The React app uses the Træningsmester Supabase project for auth and first-load
app data when these public Vite variables are present:

```bash
VITE_SUPABASE_URL=https://rbplnybmjwcoigiwtkuh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

`VITE_SUPABASE_ANON_KEY` is supported as a legacy fallback, but new local builds
should use `VITE_SUPABASE_PUBLISHABLE_KEY`.

Ved login henter webappen første gang:

- `user_settings`
- `plan`, `plan_workouts`, `workout`, `workout_exercises`
- `exercises`
- `match`
- `user_trackerlog_exercises`
- `activity_sessions`

Local storage bruges fortsat som browser-cache og fallback, når Supabase ikke er
konfigureret. Brugerens efterfølgende redigeringer i webappen gemmes lokalt og er
endnu ikke fuldt synkroniseret tilbage til Supabase.

## Waitlist

Tilmeldingsformularen sender til den samme origins `/api/waitlist`-endpoint, som
validerer inputtet og gemmer til Træningsmesters Supabase-tabel
`public.prelaunch_waitlist_signups`.

Siden sender ikke bekræftelsesmail og åbner ikke en mailklient. Databasens RLS
tillader kun inserts for offentlige roller.

Optional waitlist environment overrides:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`

## Domains

The canonical public URL is `https://www.traeningsmester.dk/`.

`træningsmester.dk` must be configured in DNS and Vercel with its punycode name:

- `træningsmester.dk` -> `xn--trningsmester-4fb.dk`
- `www.træningsmester.dk` -> `www.xn--trningsmester-4fb.dk`

Add both punycode domains to the same Vercel project as `traeningsmester.dk`.
In Nordicway DNS, point the apex punycode domain to Vercel's required A record
and the `www` punycode subdomain to Vercel's required CNAME. Use the exact DNS
values shown by Vercel for the project.

`vercel.json` redirects both punycode hosts to `https://www.traeningsmester.dk/`,
so browser visits to `https://træningsmester.dk` and
`https://www.træningsmester.dk` land on the same website after DNS is changed.
