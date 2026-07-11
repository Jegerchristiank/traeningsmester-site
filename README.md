# Træningsmester hjemmeside og webapp

React/Vite-projektet indeholder både Træningsmesters offentlige pre-launch-side
og en separat webapp til det personlige træningsflow.

## Ruter

- `/` — offentlig marketing- og ventelisteside
- `/app` — loginbeskyttet webapp
- `/privatliv`, `/vilkaar`, `/cookies`, `/tilgaengelighed` — juridiske sider
- `/afmeld#token=...` — sikker bekræftelsesside til tilbagetrækning af ventelistesamtykke

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

Endpointet bruger et server-side mailflow: nye tilmeldinger får en neutral HTML-
og tekstkvittering via Træningsmesters SMTP-konto. Mailen indeholder ingen
tracking eller reklame og har et tokeniseret afmeldingslink. Linkets GET-side
ændrer ikke data; sletningen sker først ved brugerens POST-bekræftelse. En
one-click POST fra mailklientens `List-Unsubscribe`-funktion er også understøttet.

Supabase-kontrakten bruger en claim-fence. Kun `pending`, `failed` eller en stale
`sending`-række kan claim'es til udsendelse. En allerede accepteret mail sendes
ikke igen ved en dublettilmelding. Leveringen er dog teknisk *at-least-once*: et
procescrash efter SMTP-accept, men før database-acknowledgement, kan medføre et
nyt forsøg efter claim-leasens udløb. Eksisterende `legacy`-rækker får kun det
nuværende samtykke og en kvittering, hvis personen aktivt tilmelder sig igen i
den nye formular. Samtykkets autoritative tidspunkt skrives af serveren;
browserens tidspunkt gemmes kun som sekundær metadata.

Optional waitlist environment overrides:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`

Required server-only Supabase capability:

- `SUPABASE_SECRET_KEY` (`sb_secret_...`) bruges kun af server-endpointet til de
  `service_role`-beskyttede RPC'er for confirmation claim/finish og legacy
  refresh. Almindelig insert bruger fortsat publishable/anon-nøglen.

Required server-only mail variables:

- `TM_SMTP_HOST` (production: `smtp.resend.com`)
- `TM_SMTP_PORT` (`465`)
- `TM_SMTP_SECURE` (`true` for port 465)
- `TM_SMTP_USER` (`resend`; SMTP usernames are not required to be emails)
- `TM_SMTP_PASS` (server-only Resend API key)
- `TM_SMTP_ENVELOPE_FROM`
- `TM_MAIL_FROM`
- `TM_MAIL_FROM_NAME`
- optional `TM_MAIL_REPLY_TO`
- `WAITLIST_TOKEN_SECRET` (minimum 32 random characters; keep stable so future
  waitlist mails can derive the same withdrawal token)
- `PUBLIC_SITE_URL` (`https://www.traeningsmester.dk`)

These variables and `SUPABASE_SECRET_KEY` must be configured in Vercel as
server-only values. Never use a `VITE_` prefix for SMTP credentials,
`WAITLIST_TOKEN_SECRET` or `SUPABASE_SECRET_KEY`.

Production delivery uses Resend SMTP with the verified `traeningsmester.dk`
sender domain. Keep its SPF/DKIM records and an intentional DMARC policy valid;
SMTP acceptance alone does not prove inbox delivery.

The endpoint keeps an in-memory burst limit and a hidden honeypot as basic abuse
protection. The database uniqueness constraint and fenced claim prevent normal
duplicate submissions from sending repeated mails; the documented crash window
still means delivery is at-least-once. Vercel Firewall/Turnstile can be added if
public abuse becomes visible.

Run the email/template tests and the full build with:

```bash
npm test
npm run build
```

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
