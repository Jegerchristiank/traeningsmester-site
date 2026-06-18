# Træningsmester Website

Pre-launch website for Træningsmester with a Danish waitlist signup flow.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The site is static and Vercel-ready. No private runtime credentials are shipped in the client.

## Waitlist

The signup form writes email signups directly to the Træningsmester Supabase
table `public.prelaunch_waitlist_signups`.

The site does not send confirmation emails and does not open a mail client. The
browser submits directly to Supabase REST using the public anon key; RLS only
allows inserts for public roles.

Optional environment overrides:

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
